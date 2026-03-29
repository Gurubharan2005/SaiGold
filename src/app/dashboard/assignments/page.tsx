import { prisma } from '@/lib/prisma'
import { Target, Users, CheckCircle, Clock, ShieldCheck, User } from 'lucide-react'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AssignmentsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const session = token ? await decrypt(token) : null

  if (session?.role !== 'MANAGER') {
    redirect('/dashboard')
  }

  // Map deep relational array states evaluating historical and active assignments dynamically perfectly aggregating contexts.
  const staffData = await prisma.user.findMany({
    where: { role: 'STAFF' },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      assignedCustomers: {
        select: { status: true }
      }
    },
    orderBy: { name: 'asc' }
  })

  // Global KPI Metrics
  let totalAssigned = 0
  let totalActive = 0 // Processing + Accepted
  let totalCompleted = 0 // Closed + Rejected

  const analytics = staffData.map(staff => {
    let active = 0
    let completed = 0
    let waiting = 0
    const total = staff.assignedCustomers.length

    staff.assignedCustomers.forEach(c => {
      if (c.status === 'PROCESSING' || c.status === 'ACCEPTED' || c.status === 'DUE') active++
      else if (c.status === 'CLOSED' || c.status === 'REJECTED') completed++
      else if (c.status === 'WAITING') waiting++
    })

    totalAssigned += total
    totalActive += active
    totalCompleted += completed

    return { ...staff, active, completed, waiting, total }
  }).sort((a, b) => b.total - a.total) // Sort by highest load first

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', margin: 0 }}>Assigned Leads Matrix</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Overview of staff workload capacities and ongoing operational loads.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '16px', borderRadius: 'var(--border-radius-md)' }}>
            <Users size={28} color="#3B82F6" />
          </div>
          <div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>Total Pushed Leads</p>
            <h2 style={{ margin: 0, fontSize: '28px' }}>{totalAssigned}</h2>
          </div>
        </div>
        
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '16px', borderRadius: 'var(--border-radius-md)' }}>
            <Clock size={28} color="var(--status-waiting)" />
          </div>
          <div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>Global Active Handling</p>
            <h2 style={{ margin: 0, fontSize: '28px' }}>{totalActive}</h2>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: 'var(--border-radius-md)' }}>
            <Target size={28} color="var(--status-accepted)" />
          </div>
          <div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>Historical Completions</p>
            <h2 style={{ margin: 0, fontSize: '28px' }}>{totalCompleted}</h2>
          </div>
        </div>
      </div>

      {/* Staff Delegation Engine Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Field Agent</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>Total Handled</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>Active Processing</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>Completed</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>System Status</th>
            </tr>
          </thead>
          <tbody>
            {analytics.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No active staff detected in the CRM.
                </td>
              </tr>
            ) : (
              analytics.map((staff) => (
                <tr key={staff.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--surface-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
                      <User size={18} color="var(--text-secondary)" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{staff.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{staff.email}</div>
                    </div>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center', fontWeight: 700, fontSize: '16px' }}>
                    {staff.total}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                     <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', padding: '4px 12px', borderRadius: '12px', fontWeight: 600 }}>
                       {staff.active} Leads
                     </span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                     <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', padding: '4px 12px', borderRadius: '12px', fontWeight: 600 }}>
                       {staff.completed} Resolved
                     </span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    {staff.isActive ? (
                      <span className="badge badge-accepted">Active</span>
                    ) : (
                      <span className="badge badge-due">Revoked</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
