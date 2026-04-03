import { createAdminSupabaseClient } from '@/lib/supabase-server'

export default async function AdminPage() {
  const supabase = createAdminSupabaseClient()

  const [
    { count: totalUsers },
    { count: activeSubscribers },
    { data: pools },
    { data: contributions },
    { count: pendingWinners },
    { data: recentUsers },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('draws').select('pool_total'),
    supabase.from('charity_contributions').select('amount'),
    supabase.from('winners').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('profiles').select('id, full_name, email, role, created_at').order('created_at', { ascending: false }).limit(5),
  ])

  const totalPool = pools?.reduce((sum, draw) => sum + (draw.pool_total || 0), 0) || 0
  const totalCharity = contributions?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0

  const stats = [
    { label: 'Total members', value: totalUsers ?? 0, note: 'All registered profiles' },
    { label: 'Active subscribers', value: activeSubscribers ?? 0, note: 'Eligible for current draw cycles' },
    { label: 'Prize pools', value: `GBP ${totalPool.toFixed(0)}`, note: 'Published draw pool total' },
    { label: 'Charity raised', value: `GBP ${totalCharity.toFixed(0)}`, note: 'Recorded platform contribution' },
    { label: 'Pending winners', value: pendingWinners ?? 0, note: 'Waiting for proof review or payout' },
  ]

  return (
    <div className="page-container max-w-6xl">
      <div className="mb-8">
        <p className="birdie-label mb-2">Admin overview</p>
        <h1 className="birdie-heading-md text-foreground">Platform health and operating view</h1>
        <p className="birdie-body mt-2 max-w-3xl">A cleaner operational snapshot of members, draw pools, charity totals, and recent activity across Birdie.</p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.label} className="birdie-card-elevated p-5">
            <p className="birdie-label mb-3">{stat.label}</p>
            <p className="text-3xl font-semibold text-foreground">{stat.value}</p>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">{stat.note}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="birdie-card-elevated overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2 className="birdie-heading-sm text-foreground">Recent signups</h2>
            <p className="birdie-body mt-1">Latest members entering the platform.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full birdie-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers?.map((user) => (
                  <tr key={user.id}>
                    <td className="font-medium text-foreground">{user.full_name}</td>
                    <td className="text-muted-foreground">{user.email}</td>
                    <td>
                      <span className={user.role === 'admin' ? 'birdie-badge-gold' : 'birdie-badge-muted'}>
                        {user.role}
                      </span>
                    </td>
                    <td className="text-muted-foreground">{new Date(user.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="birdie-card-elevated p-5">
            <p className="birdie-label mb-3">Current admin focus</p>
            <ul className="space-y-3">
              {[
                `Review ${pendingWinners ?? 0} pending winner${pendingWinners === 1 ? '' : 's'}`,
                `Monitor ${activeSubscribers ?? 0} active subscription${activeSubscribers === 1 ? '' : 's'}`,
                `Track GBP ${totalCharity.toFixed(0)} in charity impact`,
              ].map((item) => (
                <li key={item} className="rounded-md bg-muted/55 px-4 py-3 text-sm text-foreground">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="birdie-card-elevated p-5">
            <p className="birdie-label mb-3">Operational summary</p>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-foreground">Prize pool trend</p>
                <p className="mt-1 text-sm text-muted-foreground">Total published pools currently stand at GBP {totalPool.toFixed(0)}.</p>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Member base</p>
                <p className="mt-1 text-sm text-muted-foreground">{totalUsers ?? 0} total members with {activeSubscribers ?? 0} active subscribers.</p>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Charity impact</p>
                <p className="mt-1 text-sm text-muted-foreground">Recorded giving has reached GBP {totalCharity.toFixed(0)} so far.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
