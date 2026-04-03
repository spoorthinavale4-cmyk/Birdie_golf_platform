import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server'
import { generateRandomDraw, generateAlgorithmicDraw, calculatePrizePools } from '@/lib/draw-engine'
import { getMonthBounds as getBounds } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const auth = createServerSupabaseClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await auth.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { drawId, drawType } = await req.json()
  const supabase = createAdminSupabaseClient()

  const { start, end } = getBounds()

  // Generate numbers without committing
  const numbers = drawType === 'algorithmic'
    ? await generateAlgorithmicDraw(supabase, start, end)
    : generateRandomDraw()

  // Get active subscriber count for pool estimate
  const { count: subCount } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  const { data: lastDraw } = await supabase
    .from('draws')
    .select('jackpot_carried_forward')
    .lt('month', new Date().toISOString())
    .order('month', { ascending: false })
    .limit(1)
    .maybeSingle()

  const pools = calculatePrizePools(subCount || 0, lastDraw?.jackpot_carried_forward || 0)

  // Save simulation result
  await supabase.from('draws').update({
    status: 'simulated',
    simulation_numbers: numbers,
    pool_total: pools.total,
    five_match_pool: pools.five_match,
    four_match_pool: pools.four_match,
    three_match_pool: pools.three_match,
    draw_type: drawType,
  }).eq('id', drawId)

  return NextResponse.json({
    numbers,
    pools,
    estimated_entries: subCount || 0,
  })
}
