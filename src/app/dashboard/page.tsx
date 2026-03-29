import { prisma } from '@/lib/prisma'
import { CheckCircle, AlertCircle, Clock, FileText, UserPlus, UserCircle, MapPin } from 'lucide-react'
import { format } from 'date-fns'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'
import ClientBulkAssignTable from '@/components/ClientBulkAssignTable'

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
      
      {/* Dynamic Interactive Checkbox Matrix */}
      <ClientBulkAssignTable 
        customers={recentCustomers} 
        activeStaffList={activeStaffList} 
        userRole={session?.role || 'STAFF'} 
      />

    </div>
  )
}
