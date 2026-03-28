import { prisma } from '@/lib/prisma'
import { CheckCircle, AlertCircle, Clock } from 'lucide-react'

// Make this route dynamic to always fetch the latest stats
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const pendingLeads = await prisma.customer.count({ where: { status: 'WAITING' } })
  const activeLoans = await prisma.customer.count({ where: { status: 'ACCEPTED' } })
  const dueCustomers = await prisma.customer.count({ where: { status: 'DUE' } })

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
      
    </div>
  )
}
