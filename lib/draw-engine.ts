// ============================================================
// DRAW ENGINE — Golf Charity Platform
// Supports random and algorithmic (weighted) draw modes
// ============================================================

import { SupabaseClient } from '@supabase/supabase-js'
import { WinnerTier, PrizePools } from '@/types'

// --- Utilities ---

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function weightedSample(
  items: { num: number; weight: number }[],
  count: number
): number[] {
  const result: number[] = []
  const pool = [...items]

  while (result.length < count && pool.length > 0) {
    const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0)
    let rand = Math.random() * totalWeight
    let idx = 0
    for (let i = 0; i < pool.length; i++) {
      rand -= pool[i].weight
      if (rand <= 0) { idx = i; break }
    }
    result.push(pool[idx].num)
    pool.splice(idx, 1) // no duplicates
  }

  return result
}

// --- Draw Generators ---

/**
 * Standard lottery-style random draw
 * Picks 5 unique numbers from 1–45
 */
export function generateRandomDraw(): number[] {
  const pool = Array.from({ length: 45 }, (_, i) => i + 1)
  return shuffleArray(pool).slice(0, 5).sort((a, b) => a - b)
}

/**
 * Algorithmic weighted draw
 * Least-frequently-entered scores get higher probability
 * This creates a more exciting jackpot that's harder to hit
 */
export async function generateAlgorithmicDraw(
  supabase: SupabaseClient,
  monthStart: string,
  monthEnd: string
): Promise<number[]> {
  // Fetch all scores entered during this month by active subscribers
  const { data: scores, error } = await supabase
    .from('golf_scores')
    .select('score, profiles!inner(subscriptions!inner(status))')
    .gte('played_at', monthStart)
    .lte('played_at', monthEnd)

  if (error || !scores || scores.length === 0) {
    // Fallback to random if no data
    return generateRandomDraw()
  }

  // Build frequency map for all possible scores 1–45
  const freq: Record<number, number> = {}
  for (let i = 1; i <= 45; i++) freq[i] = 0
  scores.forEach(({ score }: { score: number }) => {
    if (freq[score] !== undefined) freq[score]++
  })

  // Invert weights: least common = highest chance of being drawn
  // This means users with unusual scores have a better shot
  const maxFreq = Math.max(...Object.values(freq)) + 1
  const weighted = Object.entries(freq).map(([num, count]) => ({
    num: parseInt(num),
    weight: maxFreq - count, // invert
  }))

  return weightedSample(weighted, 5).sort((a, b) => a - b)
}

// --- Matching Logic ---

export function countMatches(userNumbers: number[], winningNumbers: number[]): number {
  return userNumbers.filter(n => winningNumbers.includes(n)).length
}

export function getTier(matchCount: number): WinnerTier | null {
  if (matchCount >= 5) return 'five'
  if (matchCount === 4) return 'four'
  if (matchCount === 3) return 'three'
  return null
}

// --- Prize Pool Calculation ---

export function calculatePrizePools(
  activeSubscriberCount: number,
  carriedForward: number = 0,
  contributionPerSub: number = 500 // pence
): PrizePools {
  const poolTotal = (activeSubscriberCount * contributionPerSub) / 100 // convert to pounds

  return {
    five_match: poolTotal * 0.4 + carriedForward,
    four_match: poolTotal * 0.35,
    three_match: poolTotal * 0.25,
    total: poolTotal,
  }
}

// --- Full Draw Execution ---

export interface DrawExecutionResult {
  winningNumbers: number[]
  entries: Array<{
    user_id: string
    numbers: number[]
    matched_count: number
    tier: WinnerTier | null
  }>
  winners: Array<{
    user_id: string
    tier: WinnerTier
    prize_amount: number
  }>
  pools: PrizePools
  jackpotCarriedForward: number
}

export async function executeFullDraw(
  supabase: SupabaseClient,
  drawId: string,
  drawType: 'random' | 'algorithmic',
  monthStart: string,
  monthEnd: string,
  carriedForward: number = 0
): Promise<DrawExecutionResult> {
  // 1. Get all active subscribers with their scores
  const { data: subscribers } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('status', 'active')

  if (!subscribers || subscribers.length === 0) {
    throw new Error('No active subscribers found')
  }

  const userIds = subscribers.map(s => s.user_id)

  // 2. Get scores for each user (their current 5 scores)
  const { data: allScores } = await supabase
    .from('golf_scores')
    .select('user_id, score, played_at')
    .in('user_id', userIds)
    .order('played_at', { ascending: false })

  // Group scores by user
  const userScores: Record<string, number[]> = {}
  allScores?.forEach(({ user_id, score }: { user_id: string; score: number }) => {
    if (!userScores[user_id]) userScores[user_id] = []
    if (userScores[user_id].length < 5) userScores[user_id].push(score)
  })

  // 3. Generate winning numbers
  const winningNumbers = drawType === 'algorithmic'
    ? await generateAlgorithmicDraw(supabase, monthStart, monthEnd)
    : generateRandomDraw()

  // 4. Calculate prize pools
  const pools = calculatePrizePools(
    subscribers.length,
    carriedForward
  )

  // 5. Process each user's entries
  const entries = userIds
    .filter(uid => userScores[uid] && userScores[uid].length > 0)
    .map(user_id => {
      const numbers = userScores[user_id]
      const matched_count = countMatches(numbers, winningNumbers)
      const tier = getTier(matched_count)
      return { user_id, numbers, matched_count, tier }
    })

  // 6. Group winners by tier and calculate individual prizes
  const winnersByTier: Record<WinnerTier, string[]> = {
    five: [], four: [], three: []
  }
  entries.forEach(e => {
    if (e.tier) winnersByTier[e.tier].push(e.user_id)
  })

  const winners: DrawExecutionResult['winners'] = []

  if (winnersByTier.five.length > 0) {
    const prize = pools.five_match / winnersByTier.five.length
    winnersByTier.five.forEach(user_id => {
      winners.push({ user_id, tier: 'five', prize_amount: prize })
    })
  }
  if (winnersByTier.four.length > 0) {
    const prize = pools.four_match / winnersByTier.four.length
    winnersByTier.four.forEach(user_id => {
      winners.push({ user_id, tier: 'four', prize_amount: prize })
    })
  }
  if (winnersByTier.three.length > 0) {
    const prize = pools.three_match / winnersByTier.three.length
    winnersByTier.three.forEach(user_id => {
      winners.push({ user_id, tier: 'three', prize_amount: prize })
    })
  }

  // 7. Handle jackpot rollover
  const jackpotCarriedForward = winnersByTier.five.length === 0
    ? pools.five_match
    : 0

  return {
    winningNumbers,
    entries,
    winners,
    pools,
    jackpotCarriedForward,
  }
}
