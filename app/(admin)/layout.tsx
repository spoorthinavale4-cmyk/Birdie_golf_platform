'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, Trophy, Heart, Award, BarChart3, Crown, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

const adminNav = [
  { href: '/admin', label: 'Overview', icon: BarChart3, exact: true },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/draws', label: 'Draws', icon: Trophy },
  { href: '/admin/charities', label: 'Charities', icon: Heart },
  { href: '/admin/winners', label: 'Winners', icon: Award },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-background text-foreground md:flex">
      <aside className="hidden w-60 flex-shrink-0 flex-col dark-gradient text-primary-foreground md:flex">
        <div className="border-b border-primary-foreground/10 p-5">
          <div className="flex items-center gap-2">
            <Link href="/" className="font-display text-2xl font-semibold">
              Birdie
            </Link>
            <span className="birdie-badge bg-accent/20 text-accent">Admin</span>
          </div>
          <p className="mt-3 text-sm text-primary-foreground/65">Operational workspace for draws, members, winners, and charities.</p>
        </div>

        <nav className="flex-1 px-3 py-4">
          {adminNav.map(({ href, label, icon: Icon, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'mb-1.5 flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-r-2 border-accent bg-primary-foreground/10 text-primary-foreground'
                    : 'text-primary-foreground/60 hover:bg-primary-foreground/5 hover:text-primary-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-primary-foreground/10 p-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-xs text-primary-foreground/45 transition-colors hover:text-primary-foreground/70">
            <ChevronLeft className="h-3.5 w-3.5" />
            Back to member area
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-border bg-card">
          <div className="page-container flex items-center justify-between py-4">
            <div>
              <p className="birdie-label">Administration</p>
              <p className="mt-1 text-sm text-muted-foreground">Serious controls, same Birdie design system.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="birdie-badge bg-destructive/10 text-destructive">Admin</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground/10 text-xs font-semibold text-foreground">
                <Crown className="h-4 w-4" />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 py-8 md:py-10">{children}</main>
      </div>
    </div>
  )
}
