'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowRight, Check, Eye, EyeOff, Heart, Loader2, ShieldCheck, Trophy } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import type { Charity } from '@/types'

const supabase = createClient()

const planOptions = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: 'GBP 10/mo',
    description: 'Flexible access with monthly draw entry and charity contribution tracking.',
  },
  {
    id: 'yearly',
    name: 'Annual',
    price: 'GBP 96/yr',
    description: 'Lower annual cost with a steadier giving and membership rhythm.',
    badge: 'Best value',
  },
]

const trustNotes = [
  {
    title: 'Draw-ready experience',
    copy: 'Your latest five scores become your live numbers for the next monthly draw.',
    icon: Trophy,
  },
  {
    title: 'Built-in charity flow',
    copy: 'Members choose their cause during signup, with at least 10% of each plan going to charity.',
    icon: Heart,
  },
  {
    title: 'Protected member area',
    copy: 'Scores, subscriptions, draw history, and admin workflows sit behind a structured product flow.',
    icon: ShieldCheck,
  },
]

export default function SignupClient() {
  const searchParams = useSearchParams()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [status, setStatus] = useState('')
  const [charities, setCharities] = useState<Charity[]>([])
  const [charitiesLoading, setCharitiesLoading] = useState(true)
  const [charitiesError, setCharitiesError] = useState('')

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [plan, setPlan] = useState<'monthly' | 'yearly'>('monthly')
  const [selectedCharity, setSelectedCharity] = useState('')
  const [charityPct, setCharityPct] = useState(10)

  useEffect(() => {
    const urlPlan = searchParams.get('plan')
    if (urlPlan === 'monthly' || urlPlan === 'yearly') {
      setPlan(urlPlan)
    }
  }, [searchParams])

  useEffect(() => {
    async function loadCharities() {
      const { data, error } = await supabase.from('charities').select('*').eq('active', true)

      if (error) {
        console.error('[Signup] Failed to load charities:', error)
        setCharitiesError(error.message)
        setCharitiesLoading(false)
        return
      }

      if (data) {
        setCharities(data)
        if (data.length > 0) {
          setSelectedCharity((current) => current || data[0].id)
        } else {
          setCharitiesError('No charities are available yet. Add one in Supabase before signup can complete.')
        }
      }

      setCharitiesLoading(false)
    }

    loadCharities()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSignup() {
    if (!selectedCharity) {
      setError('Select a charity before continuing.')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')
    setStatus('Creating your account...')

    try {
      const res = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          email,
          password,
          fullName,
          charityId: selectedCharity,
          charityPercentage: charityPct,
        }),
      })

      const payload = await res.json()
      if (!res.ok) {
        throw new Error(payload.error || 'Could not create your account.')
      }

      setStatus('Signing you in...')
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        console.error('[Signup] Sign-in after creation failed:', signInError)
        setSuccess('Account created! Please sign in with your credentials.')
        setLoading(false)
        setStatus('')
        return
      }

      window.location.assign(payload.url || '/dashboard?success=true')
    } catch (err: any) {
      console.error('[Signup] handleSignup error:', err)
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setStatus('')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#07110d] px-6 py-10 text-ivory">
      <div className="absolute inset-x-0 top-0 -z-10 h-[620px] bg-[radial-gradient(circle_at_top,rgba(201,168,76,0.18),transparent_32%),radial-gradient(circle_at_18%_22%,rgba(101,163,126,0.14),transparent_28%),linear-gradient(180deg,#08100d_0%,#0c1712_44%,#111827_100%)]" />

      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between pb-8">
          <Link href="/" className="font-display text-3xl font-semibold tracking-wide text-ivory">
            Birdie
          </Link>
          <Link href="/login" className="btn-ghost hidden md:inline-flex">
            Member sign in
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div className="space-y-6">
            <div className="rounded-[36px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.02)_100%)] p-8 md:p-10">
              <p className="text-xs uppercase tracking-[0.32em] text-gold-light/80">Membership setup</p>
              <h1 className="mt-5 max-w-xl text-5xl font-semibold leading-[0.95] text-ivory md:text-6xl">
                Join the Birdie member experience.
              </h1>
              <p className="mt-5 max-w-xl text-sm leading-8 text-ivory-dim">
                Create your account, choose the plan that fits your rhythm, and connect your subscription to a charity from day one.
              </p>
            </div>

            <div className="grid gap-4">
              {trustNotes.map((item) => (
                <div key={item.title} className="rounded-[28px] border border-white/8 bg-white/[0.03] p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold/12 text-gold-light">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-4 text-2xl font-semibold text-ivory">{item.title}</h2>
                  <p className="mt-2 text-sm leading-7 text-ivory-dim">{item.copy}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[36px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(250,248,242,0.98)_100%)] p-7 text-slate-900 shadow-[0_36px_100px_rgba(2,6,23,0.28)] md:p-9">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Create account</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Start in three steps</h2>
              </div>
              <div className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                Step {step} of 3
              </div>
            </div>

            <div className="mt-7 flex items-center gap-3">
              {[1, 2, 3].map((current) => (
                <div key={current} className="flex flex-1 items-center gap-3">
                  <div
                    className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      step > current
                        ? 'bg-amber-500 text-slate-950'
                        : step === current
                          ? 'border border-amber-500 bg-amber-50 text-amber-700'
                          : 'border border-slate-200 bg-white text-slate-400'
                    }`}
                  >
                    {step > current ? <Check className="h-4 w-4" /> : current}
                  </div>
                  {current < 3 && (
                    <div className={`h-px flex-1 ${step > current ? 'bg-amber-400' : 'bg-slate-200'}`} />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8">
              {step === 1 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-semibold tracking-tight text-slate-950">Account details</h3>
                    <p className="text-sm text-slate-500">Start with the basics for your Birdie member profile.</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="input-label">Full name</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your full name"
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="input-label">Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
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
                          placeholder="Minimum 8 characters"
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
                  </div>

                  {error && <p className="text-sm text-red-600">{error}</p>}

                  <button
                    type="button"
                    onClick={() => {
                      if (!fullName || !email || password.length < 8) {
                        setError('Please fill every field. Password must be at least 8 characters.')
                        return
                      }
                      setError('')
                      setStep(2)
                    }}
                    className="btn-gold w-full justify-center"
                  >
                    Continue to plan
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-semibold tracking-tight text-slate-950">Choose your plan</h3>
                    <p className="text-sm text-slate-500">Pick the membership cadence that fits how often you play.</p>
                  </div>

                  <div className="space-y-4">
                    {planOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setPlan(option.id as 'monthly' | 'yearly')}
                        className={`w-full rounded-[26px] border p-5 text-left transition-all ${
                          plan === option.id
                            ? 'border-amber-400 bg-amber-50 shadow-[0_16px_34px_rgba(245,158,11,0.12)]'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-semibold text-slate-950">{option.name}</span>
                              {option.badge && (
                                <span className="rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-950">
                                  {option.badge}
                                </span>
                              )}
                            </div>
                            <p className="mt-2 text-sm leading-7 text-slate-500">{option.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold text-slate-950">{option.price}</p>
                            <div
                              className={`ml-auto mt-3 flex h-5 w-5 items-center justify-center rounded-full border ${
                                plan === option.id ? 'border-amber-500 bg-amber-500' : 'border-slate-300'
                              }`}
                            >
                              {plan === option.id && <Check className="h-3 w-3 text-slate-950" />}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="btn-ghost flex-1 justify-center border-slate-200 bg-slate-100 text-slate-700 hover:border-slate-300 hover:bg-slate-200 hover:text-slate-900"
                    >
                      Back
                    </button>
                    <button type="button" onClick={() => setStep(3)} className="btn-gold flex-1 justify-center">
                      Continue to charity
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-semibold tracking-tight text-slate-950">Choose a charity</h3>
                    <p className="text-sm text-slate-500">At least 10% of your subscription goes directly to this cause.</p>
                  </div>

                  {charitiesLoading ? (
                    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                      Loading charities...
                    </div>
                  ) : charitiesError ? (
                    <div className="rounded-[24px] border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                      {charitiesError}
                    </div>
                  ) : (
                    <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
                      {charities.map((charity) => (
                        <button
                          key={charity.id}
                          type="button"
                          onClick={() => setSelectedCharity(charity.id)}
                          className={`w-full rounded-[24px] border p-4 text-left transition-all ${
                            selectedCharity === charity.id
                              ? 'border-emerald-500 bg-emerald-50 shadow-[0_14px_30px_rgba(16,185,129,0.12)]'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="font-semibold text-slate-950">{charity.name}</p>
                              <p className="mt-1 text-sm leading-7 text-slate-500">{charity.short_description}</p>
                            </div>
                            <div
                              className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                                selectedCharity === charity.id ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'
                              }`}
                            >
                              {selectedCharity === charity.id && <Check className="h-3 w-3 text-white" />}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="rounded-[26px] bg-slate-50 p-5">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-slate-700">Contribution percentage</label>
                      <span className="text-lg font-semibold text-amber-700">{charityPct}%</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      value={charityPct}
                      onChange={(e) => setCharityPct(Number(e.target.value))}
                      className="mt-4 w-full accent-amber-500"
                    />
                    <div className="mt-3 flex justify-between text-xs text-slate-500">
                      <span>10% minimum</span>
                      <span>100% maximum</span>
                    </div>
                  </div>

                  {!selectedCharity && !charitiesLoading && !charitiesError && (
                    <p className="text-sm text-amber-700">Select a charity to enable Pay and Join.</p>
                  )}

                  {error && <p className="text-sm text-red-600">{error}</p>}
                  {success && <p className="text-sm text-emerald-600">{success}</p>}
                  {status && <p className="text-sm text-slate-600">{status}</p>}

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="btn-ghost flex-1 justify-center border-slate-200 bg-slate-100 text-slate-700 hover:border-slate-300 hover:bg-slate-200 hover:text-slate-900"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleSignup}
                      disabled={loading || charitiesLoading || !!charitiesError || !selectedCharity}
                      className="btn-gold flex-1 justify-center disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-md"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          Pay and join
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <p className="mt-8 text-center text-sm text-slate-500">
              Already a member?{' '}
              <Link href="/login" className="font-semibold text-amber-700 transition-colors hover:text-amber-800">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
