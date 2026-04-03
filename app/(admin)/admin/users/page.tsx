import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { formatDate, statusBadgeColor, getInitials } from '@/lib/utils'
import AdminUserActions from './actions'

export default async function AdminUsersPage() {
  const supabase = createAdminSupabaseClient()

  const { data: users } = await supabase
    .from('profiles')
    .select('*, subscriptions(status, plan, current_period_end), charities(name)')
    .order('created_at', { ascending: false })

  return (
    <div className="page-container max-w-6xl">
      <div className="mb-8">
        <p className="birdie-label mb-2">Admin users</p>
        <h1 className="birdie-heading-md text-foreground">
          Members <span className="text-accent">({users?.length || 0})</span>
        </h1>
        <p className="birdie-body mt-2">View membership state, charity alignment, and role management in one place.</p>
      </div>

      <div className="birdie-card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full birdie-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Subscription</th>
                <th>Charity</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((user) => {
                const sub = (user as any).subscriptions?.[0]
                return (
                  <tr key={user.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/12 text-xs font-semibold text-accent-foreground">
                          {getInitials(user.full_name)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{user.full_name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                          {user.role === 'admin' && <span className="birdie-badge-gold mt-1">admin</span>}
                        </div>
                      </div>
                    </td>
                    <td>
                      {sub ? (
                        <div>
                          <span className={`birdie-badge ${statusBadgeColor(sub.status)}`}>{sub.status}</span>
                          <p className="mt-1 text-xs text-muted-foreground">{sub.plan}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">No subscription</span>
                      )}
                    </td>
                    <td className="text-sm text-muted-foreground">{(user as any).charities?.name || '—'}</td>
                    <td className="text-sm text-muted-foreground">{formatDate(user.created_at)}</td>
                    <td>
                      <AdminUserActions userId={user.id} currentRole={user.role} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
