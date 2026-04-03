'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, Eye, Loader2, Plus, RefreshCw, Send } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { formatMonth, statusBadgeColor } from '@/lib/utils'
import type { Draw } from '@/types'

export default function AdminDrawsPage() {
  const supabase = createClient()
  const [draws, setDraws] = useState<Draw[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  async function fetchDraws() {
    const { data } = await supabase.from('draws').select('*').order('month', { ascending: false })
    setDraws(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchDraws()
  }, [])

  async function createDraw() {
    setActionLoading('create')
    const now = new Date()
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const { error } = await supabase.from('draws').insert({
      month,
      status: 'draft',
      draw_type: 'random',
      pool_total: 0,
      jackpot_carried_forward: 0,
    })

    if (!error) await fetchDraws()
    setActionLoading(null)
  }

  async function simulate(drawId: string, drawType: string) {
    setActionLoading(`sim-${drawId}`)
    const res = await fetch('/api/draws/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ drawId, drawType }),
    })

    const data = await res.json()
    if (data.numbers) await fetchDraws()
    setActionLoading(null)
  }

  async function publish(drawId: string) {
    setActionLoading(`pub-${drawId}`)
    const res = await fetch('/api/draws/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ drawId }),
    })

    const data = await res.json()
    if (data.success) await fetchDraws()
    setActionLoading(null)
  }

  async function toggleDrawType(draw: Draw) {
    const newType = draw.draw_type === 'random' ? 'algorithmic' : 'random'
    await supabase.from('draws').update({ draw_type: newType }).eq('id', draw.id)
    await fetchDraws()
  }

  return (
    <div className="page-container max-w-6xl">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="birdie-label mb-2">Admin draws</p>
          <h1 className="birdie-heading-md text-foreground">Manage monthly prize draws</h1>
          <p className="birdie-body mt-2 max-w-3xl">Schedule draft draws, preview simulated numbers, publish results, and monitor pool structure from one clean workspace.</p>
        </div>
        <button onClick={createDraw} disabled={actionLoading === 'create'} className="btn-gold">
          {actionLoading === 'create' ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4" /> Schedule draw</>}
        </button>
      </div>

      <div className="birdie-card-elevated mb-6 grid gap-4 p-5 md:grid-cols-2">
        {[
          { type: 'Random', desc: 'Standard lottery mode with five unique numbers from 1 to 45.' },
          { type: 'Algorithmic', desc: 'Weighted draw mode that favors less-common submitted scores.' },
        ].map((item) => (
          <div key={item.type}>
            <p className="birdie-label mb-2">{item.type}</p>
            <p className="text-sm leading-7 text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : draws.length === 0 ? (
        <div className="birdie-card-elevated p-12 text-center text-muted-foreground">No draws yet. Create one to get started.</div>
      ) : (
        <div className="space-y-5">
          {draws.map((draw) => (
            <div key={draw.id} className="birdie-card-elevated overflow-hidden">
              <div className="flex flex-col gap-4 border-b border-border px-6 py-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="birdie-heading-sm text-foreground">{formatMonth(draw.month)}</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className={`birdie-badge ${statusBadgeColor(draw.status)}`}>{draw.status}</span>
                    <span className="birdie-badge-muted">{draw.draw_type}</span>
                    <span className="text-xs text-muted-foreground">{draw.total_entries || 0} entries</span>
                    <span className="text-xs text-muted-foreground">GBP {draw.pool_total.toFixed(0)} pool</span>
                  </div>
                </div>

                {draw.status !== 'published' ? (
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => toggleDrawType(draw)} className="btn-ghost px-4 py-2 text-xs">
                      <RefreshCw className="h-3.5 w-3.5" />
                      {draw.draw_type}
                    </button>
                    {draw.status === 'draft' && (
                      <button onClick={() => simulate(draw.id, draw.draw_type)} disabled={!!actionLoading} className="btn-ghost px-4 py-2 text-xs">
                        {actionLoading === `sim-${draw.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Eye className="h-3.5 w-3.5" /> Simulate</>}
                      </button>
                    )}
                    {(draw.status === 'draft' || draw.status === 'simulated') && (
                      <button onClick={() => publish(draw.id)} disabled={!!actionLoading} className="btn-gold px-4 py-2 text-xs">
                        {actionLoading === `pub-${draw.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Send className="h-3.5 w-3.5" /> Publish</>}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="birdie-badge-success">
                    <CheckCircle className="mr-1 h-3.5 w-3.5" />
                    Published
                  </div>
                )}
              </div>

              {(draw.winning_numbers || draw.simulation_numbers) && (
                <div className="px-6 py-5">
                  <p className="birdie-label mb-3">
                    {draw.status === 'simulated' ? 'Simulated numbers' : 'Winning numbers'}
                  </p>
                  <div className="mb-5 flex gap-2">
                    {(draw.winning_numbers || draw.simulation_numbers)?.map((num) => (
                      <div key={num} className="draw-ball-sm">
                        {num}
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    {[
                      { label: '5 match', value: draw.five_match_pool },
                      { label: '4 match', value: draw.four_match_pool },
                      { label: '3 match', value: draw.three_match_pool },
                    ].map((pool) => (
                      <div key={pool.label} className="rounded-md bg-muted/55 p-4">
                        <p className="birdie-label mb-2">{pool.label}</p>
                        <p className="text-lg font-semibold text-accent">GBP {pool.value?.toFixed(0) || '0'}</p>
                      </div>
                    ))}
                  </div>

                  {draw.jackpot_carried_forward > 0 && (
                    <p className="mt-3 text-sm text-primary">Jackpot rollover: GBP {draw.jackpot_carried_forward.toFixed(0)} carried forward.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
