import dynamic from 'next/dynamic'

const SignupClient = dynamic(() => import('./signup-client'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.18),transparent_25%),linear-gradient(180deg,#020617_0%,#111827_100%)] px-6 py-16">
      <div className="mx-auto mt-20 w-full max-w-md">
        <div className="space-y-6">
          <div className="text-center">
            <div className="font-display text-3xl font-bold text-gold">Birdie</div>
            <p className="mt-3 text-sm text-slate-300">Create your account and set up your first plan in minutes.</p>
          </div>
          <div className="rounded-2xl bg-white p-8 text-slate-900 shadow-xl shadow-slate-950/30">
            <p className="text-sm text-slate-500">Loading signup...</p>
          </div>
        </div>
      </div>
    </div>
  ),
})

export default function SignupPage() {
  return <SignupClient />
}
