'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { AlertCircle, ArrowRight, Calendar, Heart, Target, Trophy } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { formatDate, formatMonth, statusBadgeColor, tierLabel } from '@/lib/utils'
import { Surface } from '@/components/ui/layout'
import type { Draw, GolfScore, Profile, Subscription, Winner } from '@/types'

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }
const stagger = { visible: { transition: { staggerChildren: 0.08 } } }

export default function DashboardPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [scores, setScores] = useState<GolfScore[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [nextDraw, setNextDraw] = useState<Draw | null>(null)
  const [winnings, setWinnings] = useState<Winner[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const [profileRes, scoresRes, subRes, drawRes, winnersRes] = await Promise.all([
        supabase.from('profiles').select('*, charities(id,name,short_description)').eq('id', user.id).single(),
        supabase.from('golf_scores').select('*').eq('user_id', user.id).order('played_at', { ascending: false }).limit(5),
        supabase.from('subscriptions').select('*').eq('user_id', user.id).eq('status', 'active').maybeSingle(),
        supabase.from('draws').select('*').eq('status', 'published').order('month', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('winners').select('*, draws(month)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
      ])

      setProfile(profileRes.data as Profile)
      setScores(scoresRes.data || [])
      setSubscription(subRes.data as Subscription)
      setNextDraw(drawRes.data as Draw)
      setWinnings((winnersRes.data as Winner[]) || [])
      setLoading(false)
    }

    fetchData()
  }, [])

  const totalWon = winnings.reduce((sum, winner) => sum + winner.prize_amount, 0)
  const charity = (profile as any)?.charities

  if (loading) {
    return (
      <div className="page-container flex h-64 items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="page-container">
      <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-8">
        <motion.div variants={fadeUp} className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <Surface className="overflow-hidden rounded-[34px] border-white/8 bg-[linear-gradient(140deg,rgba(201,168,76,0.12)_0%,rgba(12,26,20,0.9)_30%,rgba(17,24,39,0.92)_100%)] p-8 md:p-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl space-y-4">
                <p className="text-xs uppercase tracking-[0.28em] text-gold-light/80">Member dashboard</p>
                <h1 className="text-4xl font-semibold tracking-tight text-ivory md:text-5xl">
                  Welcome back, {profile?.full_name?.split(' ')[0] || 'Player'}.
                </h1>
                <p className="text-sm leading-8 text-ivory-dim">
                  Keep your latest rounds active, monitor your subscription, and follow how your membership supports the cause you chose.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[24px] border border-white/10 bg-white/[0.05] px-5 py-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-ivory-dim/75">Latest draw</p>
                  <p className="mt-2 text-2xl font-semibold text-ivory">
                    {nextDraw ? formatMonth(nextDraw.month) : 'Awaiting first draw'}
                  </p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/[0.05] px-5 py-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-ivory-dim/75">Total won</p>
                  <p className="mt-2 text-2xl font-semibold text-ivory">GBP {totalWon.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {!subscription && (
              <div className="mt-8 flex flex-col gap-4 rounded-[28px] border border-amber-300/18 bg-amber-300/10 p-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-200" />
                  <div>
                    <p className="font-semibold text-ivory">No active subscription</p>
                    <p className="mt-1 text-sm text-ivory-dim">Activate a plan to enter monthly draws and track prize history.</p>
                  </div>
                </div>
                <Link href="/signup" className="btn-gold w-full justify-center md:w-auto">
                  Subscribe now
                </Link>
              </div>
            )}
          </Surface>

          <Surface className="rounded-[34px] border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.02)_100%)] p-8">
            <p className="text-xs uppercase tracking-[0.28em] text-gold-light/80">Published pool</p>
            <h2 className="mt-4 text-3xl font-semibold text-ivory">
              {nextDraw ? `GBP ${nextDraw.pool_total.toFixed(0)}` : 'No draw yet'}
            </h2>
            <p className="mt-3 text-sm leading-8 text-ivory-dim">
              {nextDraw
                ? `Most recent published results are from ${formatMonth(nextDraw.month)}.`
                : 'Published draw results will appear here once the first monthly draw is completed.'}
            </p>

            <div className="mt-8 rounded-[26px] border border-white/8 bg-black/15 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-ivory-dim/75">Member status</p>
              <div className="mt-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-ivory">{subscription ? 'Subscription active' : 'Subscription inactive'}</p>
                  <p className="mt-1 text-sm text-ivory-dim">
                    {subscription ? `Renews ${formatDate(subscription.current_period_end!)}` : 'Join a plan to reactivate draw access.'}
                  </p>
                </div>
                {subscription?.status && (
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusBadgeColor(subscription.status)}`}>
                    {subscription.status}
                  </span>
                )}
              </div>
            </div>

            <Link href="/draws" className="btn-ghost mt-8 w-full justify-center sm:w-auto">
              View draw history
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Surface>
        </motion.div>

        <motion.div variants={fadeUp} className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: 'Subscription',
              value: subscription ? `${subscription.plan[0].toUpperCase()}${subscription.plan.slice(1)}` : 'Inactive',
              badge: subscription?.status,
              icon: Calendar,
              sub: subscription ? `Renews ${formatDate(subscription.current_period_end!)}` : 'No active plan',
            },
            {
              label: 'Scores logged',
              value: `${scores.length}`,
              icon: Target,
              sub: scores[0] ? `Latest score: ${scores[0].score}` : 'No scores yet',
            },
            {
              label: 'Total won',
              value: `GBP ${totalWon.toFixed(0)}`,
              icon: Trophy,
              sub: `${winnings.length} prize${winnings.length !== 1 ? 's' : ''} recorded`,
            },
            {
              label: 'Charity contribution',
              value: `${profile?.charity_percentage || 10}%`,
              icon: Heart,
              sub: charity?.name || 'No charity selected',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-[30px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.02)_100%)] p-6"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold/12 text-gold-light">
                <stat.icon className="h-5 w-5" />
              </div>
              <p className="mt-5 text-3xl font-semibold tracking-tight text-ivory">{stat.value}</p>
              <p className="mt-2 text-sm font-medium text-ivory-dim">{stat.label}</p>
              {stat.badge && (
                <span className={`mt-4 inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusBadgeColor(stat.badge)}`}>
                  {stat.badge}
                </span>
              )}
              <p className="mt-3 text-xs leading-6 text-ivory-dim/80">{stat.sub}</p>
            </div>
          ))}
        </motion.div>

        <motion.div variants={fadeUp} className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <Surface className="rounded-[34px] border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.02)_100%)] p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-gold-light/80">My scores</p>
                <h3 className="mt-2 text-3xl font-semibold text-ivory">Latest five rounds</h3>
              </div>
              <Link href="/scores" className="text-sm font-semibold text-gold-light transition-colors hover:text-gold">
                Manage
              </Link>
            </div>

            {scores.length === 0 ? (
              <div className="mt-8 rounded-[28px] border border-dashed border-white/10 px-6 py-10 text-center">
                <p className="text-sm text-ivory-dim">No scores logged yet.</p>
                <Link href="/scores" className="mt-3 inline-flex text-sm font-semibold text-gold-light hover:text-gold">
                  Add your first score
                </Link>
              </div>
            ) : (
              <div className="mt-8 space-y-3">
                {scores.map((score, index) => (
                  <div
                    key={score.id}
                    className="flex items-center justify-between rounded-[26px] border border-white/8 bg-black/15 px-4 py-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_30%,#f4d98d,#b88a33_75%)] text-lg font-semibold text-[#111827]">
                        {score.score}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-ivory">Stableford score</p>
                        <p className="text-xs text-ivory-dim">{formatDate(score.played_at)}</p>
                      </div>
                    </div>

                    {index === 0 && (
                      <span className="rounded-full border border-gold/20 bg-gold/10 px-3 py-1 text-xs font-medium text-gold-light">
                        Latest
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Surface>

          <Surface className="rounded-[34px] border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.02)_100%)] p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-gold-light/80">Winnings</p>
                <h3 className="mt-2 text-3xl font-semibold text-ivory">Recent prize history</h3>
              </div>
              <p className="text-sm text-ivory-dim">
                Total: <span className="font-semibold text-gold-light">GBP {totalWon.toFixed(2)}</span>
              </p>
            </div>

            {winnings.length === 0 ? (
              <div className="mt-8 rounded-[28px] border border-dashed border-white/10 px-6 py-10 text-center">
                <p className="text-sm text-ivory-dim">No winnings yet.</p>
                <p className="mt-2 text-xs text-ivory-dim/80">Your verified draw wins will appear here.</p>
              </div>
            ) : (
              <div className="mt-8 space-y-3">
                {winnings.map((winner) => (
                  <div
                    key={winner.id}
                    className="flex items-center justify-between rounded-[26px] border border-white/8 bg-black/15 px-4 py-4"
                  >
                    <div>
                      <p className="text-sm font-semibold text-ivory">{tierLabel(winner.tier)}</p>
                      <p className="text-xs text-ivory-dim">{formatMonth((winner as any).draws?.month)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gold-light">GBP {winner.prize_amount.toFixed(2)}</p>
                      <span className={`mt-1 inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusBadgeColor(winner.status)}`}>
                        {winner.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Surface>
        </motion.div>

        {charity && (
          <motion.div variants={fadeUp}>
            <Surface className="rounded-[34px] border-white/8 bg-[linear-gradient(135deg,rgba(83,131,100,0.18)_0%,rgba(255,255,255,0.03)_100%)] p-8 md:p-10">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                <div className="max-w-3xl">
                  <p className="text-xs uppercase tracking-[0.28em] text-emerald-200/80">Your charity</p>
                  <h3 className="mt-3 text-4xl font-semibold text-ivory">{charity.name}</h3>
                  <p className="mt-4 text-sm leading-8 text-ivory-dim">{charity.short_description}</p>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="rounded-[26px] border border-emerald-300/18 bg-emerald-300/10 px-6 py-5 text-center">
                    <p className="text-3xl font-semibold text-emerald-200">{profile?.charity_percentage}%</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.24em] text-emerald-100/80">Contribution</p>
                  </div>
                  <Link href="/charity" className="btn-gold w-full justify-center sm:w-auto">
                    Manage charity
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </Surface>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
