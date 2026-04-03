'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, ExternalLink, Loader2, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { formatMonth, tierLabel, statusBadgeColor } from '@/lib/utils'
import type { Winner } from '@/types'

export default function AdminWinnersPage() {
  const supabase = createClient()
  const [winners, setWinners] = useState<Winner[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')

  async function fetchWinners() {
    const { data } = await supabase
      .from('winners')
      .select('*, profiles(full_name, email), draws(month)')
      .order('created_at', { ascending: false })

    setWinners((data as Winner[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchWinners()
  }, [])

  async function updateStatus(id: string, status: string) {
    setActionId(id)
    const updates: Record<string, string> = { status }
    if (status === 'verified') updates.verified_at = new Date().toISOString()
    if (status === 'paid') updates.paid_at = new Date().toISOString()
    await supabase.from('winners').update(updates).eq('id', id)
    await fetchWinners()
    setActionId(null)
  }

  const filtered = filter === 'all' ? winners : winners.filter((winner) => winner.status === filter)

  return (
    <div className="page-container max-w-6xl">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="birdie-label mb-2">Admin winners</p>
          <h1 className="birdie-heading-md text-foreground">Prize review workflow</h1>
          <p className="birdie-body mt-2">Review proof submissions, verify eligible winners, and move payouts through a clean operational flow.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {['all', 'pending', 'verified', 'paid', 'rejected'].map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                filter === item
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card text-muted-foreground hover:text-foreground'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="birdie-card-elevated overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full birdie-table">
              <thead>
                <tr>
                  <th>Winner</th>
                  <th>Draw</th>
                  <th>Tier</th>
                  <th>Prize</th>
                  <th>Status</th>
                  <th>Proof</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((winner) => (
                  <tr key={winner.id}>
                    <td>
                      <p className="font-medium text-foreground">{(winner as any).profiles?.full_name}</p>
                      <p className="text-xs text-muted-foreground">{(winner as any).profiles?.email}</p>
                    </td>
                    <td className="text-muted-foreground">{formatMonth((winner as any).draws?.month)}</td>
                    <td className="text-foreground">{tierLabel(winner.tier)}</td>
                    <td className="font-semibold text-accent">GBP {winner.prize_amount.toFixed(2)}</td>
                    <td>
                      <span className={`birdie-badge ${statusBadgeColor(winner.status)}`}>{winner.status}</span>
                    </td>
                    <td>
                      {winner.proof_url ? (
                        <a href={winner.proof_url} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                          View
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : (
                        <span className="text-sm text-muted-foreground">None</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {actionId === winner.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : (
                          <>
                            {winner.status === 'pending' && (
                              <>
                                <button onClick={() => updateStatus(winner.id, 'verified')} className="text-primary hover:text-primary/80" title="Verify">
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                                <button onClick={() => updateStatus(winner.id, 'rejected')} className="text-destructive hover:text-destructive/80" title="Reject">
                                  <XCircle className="h-4 w-4" />
                                </button>
                              </>
                            )}
                            {winner.status === 'verified' && (
                              <button onClick={() => updateStatus(winner.id, 'paid')} className="btn-gold px-3 py-1.5 text-xs">
                                Mark paid
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                      No {filter === 'all' ? '' : filter} winners found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
