import { prisma } from '@/lib/prisma'
import { CheckCircle, AlertCircle, Clock, FileText, UserPlus, UserCircle, MapPin } from 'lucide-react'
import { format } from 'date-fns'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'
import AssignLeadDropdown from '@/components/AssignLeadDropdown'

// Make this route dynamic to always fetch the latest stats
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const session = token ? await decrypt(token) : null

  const pendingLeads = await prisma.customer.count({ where: { status: 'WAITING' } })
  const activeLoans = await prisma.customer.count({ where: { status: 'ACCEPTED' } })
  const dueCustomers = await prisma.customer.count({ where: { status: 'DUE' } })

  const baseWhere: any = {}
  let activeStaffList: { id: string, name: string }[] = []

  if (session?.role !== 'MANAGER') {
    baseWhere.OR = [
      { createdById: String(session?.id) },
      { assignedToId: String(session?.id) }
    ]
  } else {
    // Only fetch staff members for dispatching if the user is a Manager
    activeStaffList = await prisma.user.findMany({
      where: { role: 'STAFF', isActive: true },
      select: { id: true, name: true }
    })
  }

  const recentCustomers = await prisma.customer.findMany({
    where: baseWhere,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, name: true, phone: true, status: true, loanAmount: true,
      createdById: true, createdAt: true,
      assignedTo: { select: { id: true, name: true } }
    },
    take: 50
  })

  return (
    <div className="fade-in">
      <h1 style={{ fontSize: '28px', marginBottom: '24px' }}>Overview</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        
        {/* Widget 1 */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '16px', borderRadius: 'var(--border-radius-md)' }}>
            <Clock size={28} color="var(--status-waiting)" />
          </div>
          <div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>Pending Meta Leads</p>
            <h2 style={{ margin: 0, fontSize: '28px' }}>{pendingLeads}</h2>
          </div>
        </div>

        {/* Widget 2 */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: 'var(--border-radius-md)' }}>
            <CheckCircle size={28} color="var(--status-accepted)" />
          </div>
          <div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>Active Gold Loans</p>
            <h2 style={{ margin: 0, fontSize: '28px' }}>{activeLoans}</h2>
          </div>
        </div>

        {/* Widget 3 */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(244, 63, 94, 0.1)', padding: '16px', borderRadius: 'var(--border-radius-md)' }}>
            <AlertCircle size={28} color="var(--status-due)" />
          </div>
          <div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>Due Customers</p>
            <h2 style={{ margin: 0, fontSize: '28px' }}>{dueCustomers}</h2>
          </div>
        </div>
      </div>
      
      {/* Global Recent Customers Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--surface-color)' }}>
          <h2 style={{ fontSize: '18px', margin: 0 }}>Recent Global Acquistions</h2>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Customer Data</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Workflow State</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Handling Agent</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Acquisition Origin</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Creation Date</th>
            </tr>
          </thead>
          <tbody>
            {recentCustomers.length === 0 ? (
              <tr>
                 <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No active customers found.
                </td>
              </tr>
            ) : (
              recentCustomers.map((c: any) => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-color)', marginBottom: '4px' }}>{c.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{c.phone}</div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span className={`badge badge-${c.status.toLowerCase()}`}>{c.status}</span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    {c.assignedTo ? (
                       <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <UserCircle size={16} color="var(--primary-color)" />
                          <span style={{ fontSize: '13px', fontWeight: 600 }}>{c.assignedTo.name}</span>
                       </div>
                    ) : session?.role === 'MANAGER' ? (
                       <AssignLeadDropdown customerId={c.id} staffList={activeStaffList} />
                    ) : (
                       <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Unassigned Vault</span>
                    )}
                  </td>
                  <td style={{ padding: '16px' }}>
                    {c.createdById ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                        <UserPlus size={12} /> Custom Added
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: 'rgba(6, 182, 212, 0.15)', color: '#06B6D4', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                        <FileText size={12} /> Meta Lead
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                    {format(new Date(c.createdAt), 'MMM dd, yyyy p')}
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
