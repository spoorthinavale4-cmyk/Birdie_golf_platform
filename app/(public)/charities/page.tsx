import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ExternalLink } from 'lucide-react'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { Container, Section, Surface } from '@/components/ui/layout'

export default async function CharitiesPage() {
  const supabase = createAdminSupabaseClient()
  const { data: charities } = await supabase
    .from('charities')
    .select('*')
    .eq('active', true)
    .order('featured', { ascending: false })

  const featured = charities?.filter((charity) => charity.featured) || []
  const rest = charities?.filter((charity) => !charity.featured) || []

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#020617_0%,#111827_100%)] text-white">
      <header className="border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
        <Container className="flex items-center justify-between py-4">
          <Link href="/" className="font-display text-2xl font-bold text-gold">
            Birdie
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/draws" className="btn-ghost hidden md:inline-flex">
              Draws
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
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200/80">Where the money goes</p>
            <h1 className="text-5xl font-bold tracking-tight text-white md:text-6xl">Our charities</h1>
            <p className="text-base leading-8 text-slate-300">
              Every subscription sends real money to real causes. Members pick where their contribution goes and can adjust that choice anytime.
            </p>
          </div>

          {featured.length > 0 && (
            <div className="space-y-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-200/80">Featured charities</p>
              <div className="grid gap-6 md:grid-cols-2">
                {featured.map((charity) => (
                  <div key={charity.id} className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70 shadow-xl">
                    {charity.image_url && (
                      <div className="relative h-56">
                        <Image src={charity.image_url} alt={charity.name} fill className="object-cover opacity-80" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent" />
                      </div>
                    )}
                    <div className="space-y-4 p-8">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h2 className="text-2xl font-bold text-white">{charity.name}</h2>
                          <p className="mt-2 text-sm leading-7 text-slate-300">{charity.short_description}</p>
                        </div>
                        <span className="rounded-full bg-amber-400 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-950">
                          Featured
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200/80">Raised</p>
                          <p className="text-3xl font-bold text-emerald-300">GBP {charity.total_contributions?.toFixed(0) || 0}</p>
                        </div>
                        {charity.website_url && (
                          <a
                            href={charity.website_url}
                            target="_blank"
                            rel="noopener"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-amber-300 transition-colors hover:text-amber-200"
                          >
                            Visit site
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {rest.length > 0 && (
            <div className="space-y-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">All charities</p>
              <div className="grid gap-4">
                {rest.map((charity) => (
                  <Surface key={charity.id} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      {charity.image_url && (
                        <div className="relative h-16 w-16 overflow-hidden rounded-2xl">
                          <Image src={charity.image_url} alt={charity.name} fill className="object-cover" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-bold text-white">{charity.name}</h3>
                        <p className="text-sm text-slate-300">{charity.short_description}</p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-xl font-bold text-emerald-300">GBP {charity.total_contributions?.toFixed(0) || 0}</p>
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Raised</p>
                    </div>
                  </Surface>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-center pt-4">
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
