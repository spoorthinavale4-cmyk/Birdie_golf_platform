'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Crown, Heart, LayoutDashboard, LogOut, Menu, Target, Trophy, X } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import type { Profile } from '@/types'
import { cn, getInitials } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/scores', label: 'My Scores', icon: Target },
  { href: '/charity', label: 'My Charity', icon: Heart },
  { href: '/draws', label: 'Draws', icon: Trophy },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    supabase
      .from('profiles')
      .select('*, charities(name), subscriptions(status, plan, current_period_end)')
      .then(({ data }) => {
        if (data?.[0]) setProfile(data[0] as Profile)
      })
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const Sidebar = () => (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/8 px-6 py-7">
        <Link href="/" className="font-display text-3xl font-semibold tracking-wide text-ivory">
          Birdie
        </Link>
        <p className="mt-3 max-w-xs text-sm leading-7 text-ivory-dim">
          Premium member workspace for scores, draws, and charity impact.
        </p>
      </div>

      <nav className="flex-1 space-y-2 px-4 py-5">
        <p className="px-3 pb-2 text-xs uppercase tracking-[0.28em] text-gold-light/75">Navigation</p>

        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href

          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-[22px] px-4 py-3 text-sm font-semibold transition-all duration-200',
                active
                  ? 'border border-gold/20 bg-gold/12 text-ivory shadow-[0_18px_32px_rgba(201,168,76,0.08)]'
                  : 'text-ivory-dim hover:bg-white/[0.04] hover:text-ivory'
              )}
            >
              <span
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-2xl',
                  active ? 'bg-gold text-[#111827]' : 'bg-white/[0.04] text-gold-light'
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              {label}
            </Link>
          )
        })}

        {profile?.role === 'admin' && (
          <Link
            href="/admin"
            onClick={() => setMobileOpen(false)}
            className={cn(
              'mt-5 flex items-center gap-3 rounded-[22px] px-4 py-3 text-sm font-semibold transition-all duration-200',
              pathname.startsWith('/admin')
                ? 'border border-white/15 bg-white/[0.95] text-slate-950'
                : 'border border-amber-300/18 bg-amber-300/10 text-amber-100 hover:border-amber-300/30 hover:bg-amber-300/14'
            )}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10">
              <Crown className="h-4 w-4" />
            </span>
            Admin panel
          </Link>
        )}
      </nav>

      <div className="border-t border-white/8 p-4">
        <div className="rounded-[28px] border border-white/8 bg-white/[0.03] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gold text-sm font-bold text-[#111827]">
              {profile?.full_name ? getInitials(profile.full_name) : '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ivory">{profile?.full_name || 'Member'}</p>
              <p className="truncate text-xs text-ivory-dim">{profile?.email || 'Signed in'}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-ivory-dim transition-colors hover:border-red-400/30 hover:text-red-300"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#07110d] text-ivory">
      <div className="absolute inset-x-0 top-0 -z-10 h-[560px] bg-[radial-gradient(circle_at_top,rgba(201,168,76,0.12),transparent_34%),radial-gradient(circle_at_18%_22%,rgba(101,163,126,0.1),transparent_28%),linear-gradient(180deg,#08100d_0%,#0c1712_42%,#111827_100%)]" />

      <div className="flex min-h-screen">
        <aside className="hidden w-80 flex-shrink-0 border-r border-white/8 bg-[#08100d]/82 backdrop-blur-xl lg:flex">
          <Sidebar />
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button className="absolute inset-0 bg-slate-950/70" onClick={() => setMobileOpen(false)} />
            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              className="absolute inset-y-0 left-0 w-80 border-r border-white/8 bg-[#08100d]/96 backdrop-blur-xl"
            >
              <Sidebar />
            </motion.aside>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-white/8 bg-[#08100d]/74 backdrop-blur-xl">
            <div className="page-container flex items-center justify-between py-4">
              <button
                onClick={() => setMobileOpen(true)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-ivory lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="hidden lg:block">
                <p className="text-xs uppercase tracking-[0.24em] text-gold-light/75">Member workspace</p>
                <p className="mt-1 text-sm text-ivory-dim">Scores, subscriptions, draws, and giving.</p>
              </div>

              <button
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-ivory lg:hidden',
                  !mobileOpen && 'invisible'
                )}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </header>

          <main className="flex-1 py-8 md:py-10">{children}</main>
        </div>
      </div>
    </div>
  )
}
