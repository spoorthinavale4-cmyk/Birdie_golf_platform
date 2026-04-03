'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowRight, Eye, EyeOff, Loader2, ShieldCheck, Target, Trophy } from 'lucide-react'
import { createClient } from '@/lib/supabase'

const signInNotes = [
  {
    title: 'Manage your scores',
    copy: 'Keep your latest rounds active and ready for the next draw cycle.',
    icon: Target,
  },
  {
    title: 'Track draw history',
    copy: 'See published results, prize tiers, and any winnings from your member dashboard.',
    icon: Trophy,
  },
  {
    title: 'Protected workspace',
    copy: 'Subscriptions, charity choices, and admin actions sit behind a trusted account flow.',
    icon: ShieldCheck,
  },
]

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#07110d] px-6 py-10 text-ivory">
      <div className="absolute inset-x-0 top-0 -z-10 h-[560px] bg-[radial-gradient(circle_at_top,rgba(201,168,76,0.18),transparent_34%),radial-gradient(circle_at_18%_22%,rgba(101,163,126,0.13),transparent_28%),linear-gradient(180deg,#08100d_0%,#0c1712_44%,#111827_100%)]" />

      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between pb-8">
          <Link href="/" className="font-display text-3xl font-semibold tracking-wide text-ivory">
            Birdie
          </Link>
          <Link href="/signup" className="btn-ghost hidden md:inline-flex">
            Create account
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <div className="rounded-[36px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.02)_100%)] p-8 md:p-10">
              <p className="text-xs uppercase tracking-[0.32em] text-gold-light/80">Member access</p>
              <h1 className="mt-5 max-w-xl text-5xl font-semibold leading-[0.95] text-ivory md:text-6xl">
                Return to your Birdie workspace.
              </h1>
              <p className="mt-5 max-w-xl text-sm leading-8 text-ivory-dim">
                Sign in to manage your scores, keep track of monthly draws, and follow the charity impact connected to your subscription.
              </p>
            </div>

            <div className="grid gap-4">
              {signInNotes.map((item) => (
                <div key={item.title} className="rounded-[28px] border border-white/8 bg-white/[0.03] p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold/12 text-gold-light">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-4 text-2xl font-semibold text-ivory">{item.title}</h2>
                  <p className="mt-2 text-sm leading-7 text-ivory-dim">{item.copy}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
            className="rounded-[36px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(250,248,242,0.98)_100%)] p-7 text-slate-900 shadow-[0_36px_100px_rgba(2,6,23,0.28)] md:p-9"
          >
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Sign in</p>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950">Welcome back</h2>
              <p className="text-sm text-slate-500">Use your member credentials to continue.</p>
            </div>

            <form onSubmit={handleLogin} className="mt-8 space-y-6">
              <div>
                <label className="input-label">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="input-field"
                />
              </div>

              <div>
                <label className="input-label">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    className="input-field pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-red-600">
                  {error}
                </motion.p>
              )}

              <button type="submit" disabled={loading} className="btn-gold w-full justify-center py-3.5">
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-500">
              No account yet?{' '}
              <Link href="/signup" className="font-semibold text-amber-700 transition-colors hover:text-amber-800">
                Join Birdie
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
