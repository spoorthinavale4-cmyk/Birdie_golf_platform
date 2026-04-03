import Link from 'next/link'
import { ArrowRight, Trophy } from 'lucide-react'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { formatMonth } from '@/lib/utils'
import { Container, Section, Surface } from '@/components/ui/layout'

export default async function PublicDrawsPage() {
  const supabase = createAdminSupabaseClient()
  const { data: draws } = await supabase
    .from('draws')
    .select('*')
    .eq('status', 'published')
    .order('month', { ascending: false })
    .limit(6)

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#020617_0%,#111827_100%)] text-white">
      <header className="border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
        <Container className="flex items-center justify-between py-4">
          <Link href="/" className="font-display text-2xl font-bold text-gold">
            Birdie
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/charities" className="btn-ghost hidden md:inline-flex">
              Charities
            </Link>
            <Link href="/login" className="btn-gold">
              Sign in
            </Link>
          </div>
        </Container>
      </header>

      <Section>
        <Container className="space-y-12">
          <div className="max-w-3xl space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-200/80">Monthly competition</p>
            <h1 className="text-5xl font-bold tracking-tight text-white md:text-6xl">Draw results</h1>
            <p className="text-base leading-8 text-slate-300">
              Every published draw stays visible so members can review winning numbers, prize pools, and monthly rollover details.
            </p>
          </div>

          {!draws || draws.length === 0 ? (
            <Surface className="py-16 text-center">
              <Trophy className="mx-auto h-12 w-12 text-slate-500" />
              <p className="mt-4 text-sm text-slate-300">No draws published yet.</p>
              <p className="mt-2 text-xs text-slate-500">The first results will appear after the initial monthly draw.</p>
            </Surface>
          ) : (
            <div className="space-y-6">
              {draws.map((draw) => (
                <Surface key={draw.id} className="space-y-6">
                  <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-3xl font-bold text-white">{formatMonth(draw.month)}</h2>
                      <p className="mt-2 text-sm text-slate-300">{draw.total_entries} entries in the {draw.draw_type} draw</p>
                    </div>
                    <div className="rounded-2xl bg-amber-400/10 px-5 py-4 text-center">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-200/80">Pool total</p>
                      <p className="mt-1 text-2xl font-bold text-amber-300">GBP {draw.pool_total?.toFixed(0) || 0}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Winning numbers</p>
                    <div className="flex flex-wrap gap-3">
                      {draw.winning_numbers?.map((num: number) => (
                        <div
                          key={num}
                          className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-lg font-semibold text-slate-950 shadow-lg shadow-amber-500/20"
                        >
                          {num}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {[
                      { label: '5 match', value: draw.five_match_pool },
                      { label: '4 match', value: draw.four_match_pool },
                      { label: '3 match', value: draw.three_match_pool },
                    ].map((pool) => (
                      <div key={pool.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{pool.label}</p>
                        <p className="mt-2 text-xl font-bold text-amber-300">GBP {pool.value?.toFixed(0) || 0}</p>
                      </div>
                    ))}
                  </div>

                  {draw.jackpot_carried_forward > 0 && (
                    <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-4 text-sm text-amber-200">
                      Jackpot rollover: GBP {draw.jackpot_carried_forward.toFixed(0)} carried into the next draw.
                    </div>
                  )}
                </Surface>
              ))}
            </div>
          )}

          <div className="flex justify-center">
            <Link href="/signup" className="btn-gold">
              Join Birdie
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Container>
      </Section>
    </div>
  )
}
