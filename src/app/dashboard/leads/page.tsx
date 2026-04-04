import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { LeadCard } from '@/components/LeadCard'
import { User, Target } from 'lucide-react'
import LiveLeadsRefresh from '@/components/LiveLeadsRefresh'
import nextDynamic from 'next/dynamic'

// Dynamically import heavy client components to reduce initial JS payload
const StaffLeadActions = nextDynamic(() => import('@/components/StaffLeadActions').then(mod => mod.StaffLeadActions), { 
  loading: () => <div className="animate-pulse h-10 bg-zinc-800/50 rounded-lg" /> 
})
const QuickRecordingUpload = nextDynamic(() => import('@/components/QuickRecordingUpload'), { 
  loading: () => <div className="animate-pulse h-12 bg-zinc-800/50 rounded-lg" /> 
})

export const dynamic = 'force-dynamic'

export default async function LeadsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const session = token ? await decrypt(token) : null
  if (!session?.id) redirect('/')

  const isManager = session.role === 'MANAGER'
  if (!isManager) redirect('/dashboard')

  // Performance Optimization: Only select necessary fields to reduce JSON payload size
  const newLeads = await prisma.customer.findMany({
    where: { status: { in: ['WAITING', 'NO_RESPONSE'] } },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      phone: true,
      status: true,
      photoUrl: true,
      loanAmount: true,
      goldWeight: true,
      updatedAt: true,
      followUpDate: true,
      assignedTo: { select: { name: true } }
    }
  })

  return (
    <div className="fade-in">
      <LiveLeadsRefresh />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Target size={24} color="var(--status-waiting)" /> Facebook Ad Leads
          </h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
            New & uncontacted leads from Meta campaigns.
          </p>
        </div>
        <span className="badge badge-waiting">{newLeads.length} Pending</span>
      </div>

      {newLeads.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-secondary)' }}>
          <Target size={48} color="var(--border-color)" style={{ marginBottom: '16px' }} />
          <p style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>All caught up!</p>
          <p style={{ margin: '8px 0 0 0', fontSize: '13px' }}>No pending Facebook Ad leads at the moment.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {newLeads.map(lead => (
            <LeadCard key={lead.id} customer={lead as any}>
              <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={12} /> {lead.assignedTo?.name || 'Unassigned'}
                </div>
                <StaffLeadActions leadId={lead.id} />
                <QuickRecordingUpload customerId={lead.id} customerName={lead.name} />
              </div>
            </LeadCard>
          ))}
        </div>
      )}
    </div>
  )
}
