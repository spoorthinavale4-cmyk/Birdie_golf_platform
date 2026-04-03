'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { Check, CheckCircle, ExternalLink, Heart, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { Surface } from '@/components/ui/layout'
import type { Charity, Profile } from '@/types'

export default function CharityPage() {
  const supabase = createClient()
  const [charities, setCharities] = useState<Charity[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [selected, setSelected] = useState('')
  const [percentage, setPercentage] = useState(10)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: profileData }, { data: charitiesData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('charities').select('*').eq('active', true).order('featured', { ascending: false }),
      ])

      if (profileData) {
        setProfile(profileData as Profile)
        setSelected(profileData.charity_id || '')
        setPercentage(profileData.charity_percentage || 10)
      }
      setCharities(charitiesData || [])
      setLoading(false)
    }

    load()
  }, [])

  async function handleSave() {
    setSaving(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    await supabase
      .from('profiles')
      .update({
        charity_id: selected,
        charity_percentage: percentage,
      })
      .eq('id', user!.id)

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const selectedCharity = charities.find((charity) => charity.id === selected)
  const monthlyAmount = profile ? ((10 / 100) * percentage).toFixed(2) : '0.00'

  return (
    <div className="page-container">
      <div className="space-y-8">
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Surface className="rounded-[34px] border-white/8 bg-[linear-gradient(140deg,rgba(83,131,100,0.18)_0%,rgba(12,26,20,0.9)_30%,rgba(17,24,39,0.92)_100%)] p-8 md:p-10">
            <p className="text-xs uppercase tracking-[0.28em] text-emerald-200/80">Giving back</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-ivory md:text-5xl">My charity</h1>
            <p className="mt-4 max-w-2xl text-sm leading-8 text-ivory-dim">
              Choose the cause connected to your membership and decide how much of your subscription goes directly toward that impact.
            </p>
          </Surface>

          <Surface className="rounded-[34px] border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.02)_100%)] p-8">
            <p className="text-xs uppercase tracking-[0.24em] text-emerald-200/80">Current giving</p>
            <p className="mt-3 text-3xl font-semibold text-ivory">{percentage}%</p>
            <p className="mt-2 text-sm leading-8 text-ivory-dim">Approx. GBP {monthlyAmount} from a monthly plan goes toward your selected charity.</p>
          </Surface>
        </div>

        {selectedCharity && (
          <Surface className="rounded-[34px] border-white/8 bg-[linear-gradient(135deg,rgba(83,131,100,0.18)_0%,rgba(255,255,255,0.03)_100%)] p-8 md:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.24em] text-emerald-200/80">Currently supporting</p>
                <h2 className="text-3xl font-semibold text-ivory">{selectedCharity.name}</h2>
                <p className="max-w-3xl text-sm leading-8 text-ivory-dim">{selectedCharity.short_description}</p>
              </div>
              <div className="rounded-[24px] border border-emerald-300/18 bg-emerald-300/10 px-6 py-5 text-center">
                <p className="text-3xl font-semibold text-emerald-200">{percentage}%</p>
                <p className="mt-1 text-xs uppercase tracking-[0.24em] text-emerald-100/80">GBP {monthlyAmount}/mo</p>
              </div>
            </div>
          </Surface>
        )}

        <Surface className="rounded-[34px] border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.02)_100%)] p-8">
          <div className="flex items-center justify-between gap-4">
            <label className="text-sm font-semibold text-ivory">Contribution percentage</label>
            <span className="text-2xl font-semibold text-gold-light">{percentage}%</span>
          </div>
          <input
            type="range"
            min={10}
            max={100}
            step={5}
            value={percentage}
            onChange={(e) => setPercentage(Number(e.target.value))}
            className="mt-5 w-full accent-amber-400"
          />
          <div className="mt-3 flex justify-between text-xs text-ivory-dim">
            <span>Minimum 10%</span>
            <span>100% donation</span>
          </div>
        </Surface>

        <div className="space-y-4">
          <h2 className="text-3xl font-semibold text-ivory">Choose a charity</h2>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="h-6 w-6 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {charities.map((charity) => (
                <motion.button
                  key={charity.id}
                  onClick={() => setSelected(charity.id)}
                  whileHover={{ y: -2 }}
                  className={`overflow-hidden rounded-[32px] border text-left transition-all ${
                    selected === charity.id
                      ? 'border-emerald-400/35 shadow-[0_24px_80px_rgba(16,185,129,0.14)]'
                      : 'border-white/8'
                  }`}
                >
                  <div className="relative h-48 bg-slate-900">
                    {charity.image_url && <Image src={charity.image_url} alt={charity.name} fill className="object-cover opacity-75" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/10 to-transparent" />
                    <div className="absolute left-4 top-4 flex items-center gap-2">
                      {charity.featured && (
                        <span className="rounded-full bg-gold px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#111827]">
                          Featured
                        </span>
                      )}
                    </div>
                    {selected === charity.id && (
                      <div className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white">
                        <Check className="h-4 w-4" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 bg-[linear-gradient(180deg,rgba(12,26,20,0.92)_0%,rgba(17,24,39,0.92)_100%)] p-6">
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-ivory">{charity.name}</h3>
                      <p className="text-sm leading-8 text-ivory-dim">{charity.short_description}</p>
                    </div>
                    {charity.website_url && (
                      <a
                        href={charity.website_url}
                        target="_blank"
                        rel="noopener"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-200 transition-colors hover:text-emerald-100"
                      >
                        Visit website
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button onClick={handleSave} disabled={saving || !selected} className="btn-gold w-full justify-center sm:w-auto">
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              <>
                <CheckCircle className="h-4 w-4" />
                Saved
              </>
            ) : (
              <>
                <Heart className="h-4 w-4" />
                Save charity
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
