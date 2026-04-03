'use client'

import { motion, useInView } from 'framer-motion'
import { ArrowRight, CalendarDays, Check, ChevronRight, Heart, ShieldCheck, Target, Trophy } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Container, Section, Surface } from '@/components/ui/layout'

function Counter({
  end,
  prefix = '',
  suffix = '',
}: {
  end: number
  prefix?: string
  suffix?: string
}) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  useEffect(() => {
    if (!inView) return

    let start = 0
    const duration = 1400
    const step = end / (duration / 16)

    const timer = setInterval(() => {
      start += step
      if (start >= end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)

    return () => clearInterval(timer)
  }, [end, inView])

  return (
    <span ref={ref}>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  )
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
}

const stagger = {
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
}

const stats = [
  { label: 'Members in play', value: 2840, suffix: '+' },
  { label: 'Monthly prize pool', value: 14000, prefix: 'GBP ' },
  { label: 'Raised for charities', value: 142000, prefix: 'GBP ', suffix: '+' },
]

const principles = [
  {
    title: 'Score-driven entries',
    copy: 'Your latest five Stableford rounds become your numbers for the next draw.',
    icon: Target,
  },
  {
    title: 'Visible prize structure',
    copy: 'Every tier is clear, every result is published, and jackpot rollovers stay transparent.',
    icon: Trophy,
  },
  {
    title: 'Built with trust',
    copy: 'Subscriptions, protected dashboards, and admin workflows give the product real structure.',
    icon: ShieldCheck,
  },
]

const journey = [
  {
    step: '01',
    title: 'Join your plan',
    text: 'Choose monthly or annual membership and set the charity you want your subscription to support.',
  },
  {
    step: '02',
    title: 'Log your rounds',
    text: 'Track your latest five golf scores and keep your entry numbers active each month.',
  },
  {
    step: '03',
    title: 'Follow the draw',
    text: 'See published results, prize tiers, and any winnings from your dashboard.',
  },
]

const prizeTiers = [
  { tier: '5 matches', share: '40%', note: 'Jackpot tier with rollover if no one hits all five.' },
  { tier: '4 matches', share: '35%', note: 'Split across verified winners for the month.' },
  { tier: '3 matches', share: '25%', note: 'A wider winner tier that keeps the draw active.' },
]

const plans = [
  {
    name: 'Monthly',
    price: 'GBP 10',
    cadence: '/month',
    href: '/signup?plan=monthly',
    features: ['One active draw entry each month', 'Five scores in play', 'Minimum 10% to charity', 'Member dashboard access'],
  },
  {
    name: 'Annual',
    price: 'GBP 96',
    cadence: '/year',
    href: '/signup?plan=yearly',
    badge: 'Best value',
    features: ['Everything in Monthly', 'Lower annual cost', 'Longer-term giving impact', 'Cleaner retained membership flow'],
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#07110d] text-ivory">
      <div className="absolute inset-x-0 top-0 -z-10 h-[760px] bg-[radial-gradient(circle_at_top,rgba(201,168,76,0.18),transparent_32%),radial-gradient(circle_at_20%_24%,rgba(101,163,126,0.16),transparent_26%),linear-gradient(180deg,#08100d_0%,#0b1712_38%,#111827_100%)]" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(120deg,rgba(255,255,255,0.02)_0%,transparent_18%,transparent_82%,rgba(255,255,255,0.02)_100%)] opacity-70" />

      <header className="sticky top-0 z-50 border-b border-white/8 bg-[#08100d]/78 backdrop-blur-xl">
        <Container className="flex items-center justify-between py-4">
          <div className="flex items-center gap-8">
            <Link href="/" className="font-display text-3xl font-semibold tracking-wide text-ivory">
              Birdie
            </Link>
            <nav className="hidden items-center gap-8 md:flex">
              <Link href="/charities" className="nav-link">
                Charities
              </Link>
              <Link href="/draw-results" className="nav-link">
                Draw results
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-ghost hidden md:inline-flex">
              Sign in
            </Link>
            <Link href="/signup" className="btn-gold">
              Become a member
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Container>
      </header>

      <Section className="relative pt-14 md:pt-20">
        <Container>
          <div className="grid items-end gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-8">
              <motion.div variants={fadeUp}>
                <span className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-gold-light">
                  <Heart className="h-3.5 w-3.5" />
                  Golf membership with purpose
                </span>
              </motion.div>

              <motion.div variants={fadeUp} className="space-y-6">
                <div className="space-y-4">
                  <p className="max-w-lg text-sm uppercase tracking-[0.34em] text-ivory-dim/75">
                    Premium draw experience. Real charity impact.
                  </p>
                  <h1 className="max-w-4xl text-5xl font-semibold leading-[0.92] text-ivory md:text-7xl">
                    Play better rounds.
                    <span className="block text-gradient-gold">Turn them into something bigger.</span>
                  </h1>
                </div>
                <p className="max-w-2xl text-lg leading-8 text-ivory-dim md:text-xl">
                  Birdie is a golf charity platform where members log scores, enter monthly prize draws, and direct part of every subscription to a cause they care about.
                </p>
              </motion.div>

              <motion.div variants={fadeUp} className="flex flex-col gap-3 sm:flex-row">
                <Link href="/signup" className="btn-gold w-full sm:w-auto">
                  Start your membership
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/draw-results" className="btn-ghost w-full sm:w-auto">
                  View published draws
                </Link>
              </motion.div>

              <motion.div variants={fadeUp} className="grid gap-4 sm:grid-cols-3">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-[28px] border border-white/8 bg-white/[0.035] px-5 py-5 backdrop-blur-sm">
                    <p className="text-3xl font-semibold text-ivory">
                      <Counter end={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                    </p>
                    <p className="mt-2 text-sm text-ivory-dim">{stat.label}</p>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.12 }}
              className="relative"
            >
              <div className="absolute -left-8 top-16 hidden h-28 w-28 rounded-full border border-gold/20 bg-gold/10 blur-3xl lg:block" />
              <Surface className="relative overflow-hidden rounded-[36px] border-[#c9a84c]/18 bg-[linear-gradient(160deg,rgba(12,26,20,0.95)_0%,rgba(15,23,42,0.88)_100%)] p-0">
                <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(201,168,76,0.16),transparent_28%,transparent_72%,rgba(255,255,255,0.04)_100%)]" />
                <div className="relative space-y-8 p-8 md:p-10">
                  <div className="flex items-start justify-between gap-4 border-b border-white/8 pb-8">
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-[0.28em] text-gold-light/80">Member preview</p>
                      <h2 className="text-3xl font-semibold text-ivory md:text-4xl">From scorecard to prize entry</h2>
                    </div>
                    <div className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
                      Live concept
                    </div>
                  </div>

                  <div className="grid gap-5 md:grid-cols-[0.9fr_1.1fr]">
                    <div className="rounded-[28px] border border-white/8 bg-black/20 p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.24em] text-ivory-dim/70">Latest rounds</p>
                          <p className="mt-1 text-sm text-ivory-dim">Your five active entry numbers</p>
                        </div>
                        <CalendarDays className="h-4 w-4 text-gold-light" />
                      </div>

                      <div className="mt-6 grid grid-cols-5 gap-3">
                        {[7, 12, 21, 32, 40].map((number) => (
                          <div
                            key={number}
                            className="flex aspect-square items-center justify-center rounded-full border border-white/10 bg-[radial-gradient(circle_at_30%_30%,#f4d98d,#b88a33_75%)] text-base font-semibold text-[#111827] shadow-[0_14px_24px_rgba(184,138,51,0.25)]"
                          >
                            {number}
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-ivory-dim/70">This month</p>
                        <p className="mt-2 text-2xl font-semibold text-ivory">GBP 14,000 pool</p>
                        <p className="mt-2 text-sm leading-7 text-ivory-dim">
                          Transparent tier splits, published results, and rollover handling for the jackpot.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {[
                        ['Choose a plan', 'Monthly or annual membership with an integrated charity selection.'],
                        ['Log your scores', 'Each Stableford round helps shape your monthly draw entry.'],
                        ['Track your impact', 'Follow prize history, subscription status, and charity contribution in one place.'],
                      ].map(([title, copy]) => (
                        <div key={title} className="rounded-[24px] border border-white/8 bg-white/[0.04] p-5">
                          <div className="flex items-center justify-between gap-4">
                            <p className="text-lg font-semibold text-ivory">{title}</p>
                            <ChevronRight className="h-4 w-4 text-gold-light" />
                          </div>
                          <p className="mt-3 text-sm leading-7 text-ivory-dim">{copy}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Surface>
            </motion.div>
          </div>
        </Container>
      </Section>

      <Section className="pt-8">
        <Container>
          <div className="grid gap-5 lg:grid-cols-3">
            {principles.map((item) => (
              <Surface
                key={item.title}
                className="rounded-[30px] border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.02)_100%)] p-7"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/12 text-gold-light">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-2xl font-semibold text-ivory">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-ivory-dim">{item.copy}</p>
              </Surface>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="border-t border-white/8">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr]">
            <div className="space-y-5">
              <p className="text-xs uppercase tracking-[0.32em] text-gold-light/80">How it works</p>
              <h2 className="section-heading max-w-2xl text-[2.8rem] text-ivory md:text-[4rem]">
                A cleaner member journey from signup to published draw.
              </h2>
              <p className="max-w-xl text-base leading-8 text-ivory-dim">
                The product is designed to feel simple on the surface while still handling the structure you would expect from a real subscription platform.
              </p>
            </div>

            <div className="space-y-4">
              {journey.map((item, index) => (
                <div
                  key={item.step}
                  className="grid gap-5 rounded-[32px] border border-white/8 bg-white/[0.03] p-6 md:grid-cols-[96px_1fr] md:items-start"
                >
                  <div className="flex items-center gap-4 md:block">
                    <p className="font-display text-5xl leading-none text-gold/60">{item.step}</p>
                    {index < journey.length - 1 && <div className="hidden h-14 w-px bg-white/10 md:mx-auto md:mt-4 md:block" />}
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold text-ivory">{item.title}</h3>
                    <p className="mt-3 max-w-2xl text-sm leading-8 text-ivory-dim">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <Section className="border-t border-white/8">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1fr_0.94fr]">
            <Surface className="rounded-[34px] border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.02)_100%)] p-8 md:p-10">
              <p className="text-xs uppercase tracking-[0.3em] text-gold-light/80">Prize structure</p>
              <div className="mt-5 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-xl">
                  <h2 className="text-4xl font-semibold text-ivory md:text-5xl">Clear upside. Clear rules.</h2>
                  <p className="mt-4 text-sm leading-8 text-ivory-dim">
                    Birdie keeps the draw legible: members understand how the pool works, what qualifies as a win, and what happens if the jackpot rolls over.
                  </p>
                </div>
                <div className="rounded-[28px] border border-gold/20 bg-gold/10 px-6 py-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-gold-light/80">Current model</p>
                  <p className="mt-2 text-3xl font-semibold text-ivory">3 winner tiers</p>
                </div>
              </div>

              <div className="mt-8 grid gap-4">
                {prizeTiers.map((tier) => (
                  <div
                    key={tier.tier}
                    className="flex flex-col gap-4 rounded-[28px] border border-white/8 bg-black/15 px-5 py-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-lg font-semibold text-ivory">{tier.tier}</p>
                      <p className="mt-2 text-sm leading-7 text-ivory-dim">{tier.note}</p>
                    </div>
                    <div className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2 text-sm font-semibold uppercase tracking-[0.24em] text-gold-light">
                      {tier.share} of pool
                    </div>
                  </div>
                ))}
              </div>
            </Surface>

            <Surface className="rounded-[34px] border-white/8 bg-[linear-gradient(180deg,rgba(83,131,100,0.18)_0%,rgba(255,255,255,0.03)_100%)] p-8 md:p-10">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/80">Charity impact</p>
              <h2 className="mt-5 text-4xl font-semibold text-ivory md:text-5xl">
                Give every subscription a visible outcome.
              </h2>
              <p className="mt-4 text-sm leading-8 text-ivory-dim">
                Members choose their charity at signup and commit at least 10% of their subscription to that cause. The giving is part of the product, not a bolt-on afterthought.
              </p>

              <div className="mt-8 grid gap-4">
                {[
                  'Charity chosen during signup',
                  'Minimum 10% contribution built into the plan',
                  'Impact remains visible in the member experience',
                ].map((line) => (
                  <div key={line} className="flex items-start gap-3 rounded-[24px] border border-white/8 bg-black/15 px-4 py-4">
                    <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-300/16 text-emerald-200">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    <p className="text-sm leading-7 text-ivory-dim">{line}</p>
                  </div>
                ))}
              </div>

              <Link href="/charities" className="btn-ghost mt-8 w-full justify-center sm:w-auto">
                Explore charities
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Surface>
          </div>
        </Container>
      </Section>

      <Section className="border-t border-white/8">
        <Container>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.3em] text-gold-light/80">Membership plans</p>
              <h2 className="mt-4 text-4xl font-semibold text-ivory md:text-5xl">Two simple ways to join Birdie.</h2>
            </div>
            <p className="max-w-xl text-sm leading-8 text-ivory-dim">
              Both plans keep the core experience intact: score logging, draw access, subscription visibility, and charity support.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-[34px] border p-8 md:p-10 ${
                  plan.badge
                    ? 'border-gold/24 bg-[linear-gradient(180deg,rgba(201,168,76,0.14)_0%,rgba(255,255,255,0.03)_100%)]'
                    : 'border-white/8 bg-white/[0.03]'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-ivory-dim/70">Plan</p>
                    <h3 className="mt-3 text-3xl font-semibold text-ivory">{plan.name}</h3>
                  </div>
                  {plan.badge && (
                    <span className="rounded-full border border-gold/25 bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-gold-light">
                      {plan.badge}
                    </span>
                  )}
                </div>

                <div className="mt-8 flex items-end gap-3">
                  <span className="text-5xl font-semibold tracking-tight text-ivory">{plan.price}</span>
                  <span className="pb-1 text-sm text-ivory-dim">{plan.cadence}</span>
                </div>

                <div className="mt-8 space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3 rounded-[22px] border border-white/8 bg-black/10 px-4 py-4">
                      <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-gold/12 text-gold-light">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                      <p className="text-sm leading-7 text-ivory-dim">{feature}</p>
                    </div>
                  ))}
                </div>

                <Link href={plan.href} className="btn-gold mt-8 w-full">
                  Choose {plan.name.toLowerCase()}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="pb-10">
        <Container>
          <div className="overflow-hidden rounded-[40px] border border-white/8 bg-[linear-gradient(135deg,rgba(201,168,76,0.16)_0%,rgba(10,16,13,0.96)_36%,rgba(12,26,20,0.96)_100%)]">
            <div className="grid gap-8 px-6 py-10 md:px-10 md:py-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gold-light/80">Portfolio-ready product</p>
                <h2 className="mt-4 text-4xl font-semibold text-ivory md:text-5xl">
                  A stronger front door for the Birdie platform.
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-8 text-ivory-dim">
                  Built for golfers who want a clearer member experience and for charities that deserve to be part of the product story from day one.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
                <Link href="/signup" className="btn-gold w-full sm:w-auto">
                  Join Birdie
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/login" className="btn-ghost w-full sm:w-auto">
                  Member sign in
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <footer className="border-t border-white/8 py-10">
        <Container className="flex flex-col gap-6 text-sm text-ivory-dim md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-display text-3xl font-semibold text-ivory">Birdie</p>
            <p className="mt-2 max-w-md text-sm leading-7 text-ivory-dim">
              Golf scores, monthly prize draws, and built-in charity impact in one premium membership flow.
            </p>
          </div>

          <div className="flex flex-wrap gap-5">
            <Link href="/charities" className="transition-colors hover:text-ivory">
              Charities
            </Link>
            <Link href="/draw-results" className="transition-colors hover:text-ivory">
              Draw results
            </Link>
            <Link href="/login" className="transition-colors hover:text-ivory">
              Sign in
            </Link>
          </div>

          <p>{new Date().getFullYear()} Birdie. All rights reserved.</p>
        </Container>
      </footer>
    </div>
  )
}
