import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server'
import { executeFullDraw } from '@/lib/draw-engine'
import { getMonthBounds } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const auth = createServerSupabaseClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await auth.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { drawId } = await req.json()
  const supabase = createAdminSupabaseClient()

  // Fetch draw
  const { data: draw, error: drawError } = await supabase
    .from('draws')
    .select('*')
    .eq('id', drawId)
    .single()

  if (drawError || !draw) return NextResponse.json({ error: 'Draw not found' }, { status: 404 })
  if (draw.status === 'published') return NextResponse.json({ error: 'Already published' }, { status: 400 })

  const { start, end } = getMonthBounds()

  // Get carried forward from previous month
  const { data: prevDraw } = await supabase
    .from('draws')
    .select('jackpot_carried_forward')
    .lt('month', draw.month)
    .order('month', { ascending: false })
    .limit(1)
    .maybeSingle()

  try {
    const result = await executeFullDraw(
      supabase,
      drawId,
      draw.draw_type,
      start,
      end,
      prevDraw?.jackpot_carried_forward || 0
    )

    // Update draw record
    await supabase.from('draws').update({
      status: 'published',
      winning_numbers: result.winningNumbers,
      pool_total: result.pools.total,
      five_match_pool: result.pools.five_match,
      four_match_pool: result.pools.four_match,
      three_match_pool: result.pools.three_match,
      jackpot_carried_forward: result.jackpotCarriedForward,
      total_entries: result.entries.length,
      published_at: new Date().toISOString(),
    }).eq('id', drawId)

    // Insert all draw entries
    if (result.entries.length > 0) {
      await supabase.from('draw_entries').upsert(
        result.entries.map(e => ({
          draw_id: drawId,
          user_id: e.user_id,
          numbers: e.numbers,
          matched_count: e.matched_count,
          tier: e.tier,
        })),
        { onConflict: 'draw_id,user_id' }
      )
    }

    // Insert winners
    if (result.winners.length > 0) {
      await supabase.from('winners').insert(
        result.winners.map(w => ({
          draw_id: drawId,
          user_id: w.user_id,
          tier: w.tier,
          prize_amount: w.prize_amount,
          status: 'pending',
        }))
      )
    }

    return NextResponse.json({
      success: true,
      winningNumbers: result.winningNumbers,
      totalEntries: result.entries.length,
      winnersCount: result.winners.length,
      jackpotCarriedForward: result.jackpotCarriedForward,
      pools: result.pools,
    })
  } catch (err: any) {
    console.error('[Draw Run]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
