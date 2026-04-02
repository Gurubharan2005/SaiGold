import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { LeadCard } from '@/components/LeadCard'
import { StaffLeadActions } from '@/components/StaffLeadActions'
import { User, Target } from 'lucide-react'
import LiveLeadsRefresh from '@/components/LiveLeadsRefresh'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

export default async function LeadsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const session = token ? await decrypt(token) : null

  if (!session?.id) {
    redirect('/')
  }

  const isManager = session.role === 'MANAGER'

  // 1. Fetch leads based on role
  // Manager sees ALL Meta (Un-closed) leads
  // Staff/Sales sees only THEIR assigned leads
  const whereClause: Prisma.CustomerWhereInput = {
    status: { in: ['WAITING', 'ACCEPTED', 'PROCESSING', 'VERIFIED', 'FOLLOW_UP', 'NO_RESPONSE'] }
  }

  if (!isManager) {
    whereClause.assignedToId = String(session.id)
  }

  const leads = await prisma.customer.findMany({
    where: whereClause,
    orderBy: { updatedAt: 'desc' },
    include: {
      assignedTo: {
        select: { name: true, role: true }
      }
    }
  })

  return (
    <div className="fade-in">
      <LiveLeadsRefresh />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', margin: 0 }}>
            {isManager ? 'Global Meta Leads' : 'My Active Leads'}
          </h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>
            {isManager 
              ? 'Monitoring the branch distribution and handling status.' 
              : 'Customers requiring your immediate attention or follow-up.'}
          </p>
        </div>
        <div className="badge badge-waiting">
          {leads.length} Active 
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {leads.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)', gridColumn: '1 / -1', background: 'var(--surface-color)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
            <Target size={40} style={{ opacity: 0.2, marginBottom: '16px' }} />
            <p>No active Meta leads found in the system.</p>
          </div>
        ) : (
          leads.map((lead) => (
             <LeadCard key={lead.id} customer={lead}>
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                   
                   {/* Distribution Info for Manager */}
                   {isManager && (
                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', padding: '8px', background: 'var(--surface-hover)', borderRadius: '6px' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                           <User size={14} color="white" />
                        </div>
                        <div style={{ fontSize: '13px' }}>
                           <span style={{ color: 'var(--text-secondary)' }}>Assigned to: </span>
                           <span style={{ fontWeight: 600 }}>{lead.assignedTo?.name || 'Awaiting Auto-Assign'}</span>
                        </div>
                     </div>
                   )}

                   <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {isManager ? 'Lead Operations' : 'Update Status'}
                   </div>
                   <StaffLeadActions leadId={lead.id} />
                </div>
             </LeadCard>
          ))
        )}
      </div>
    </div>
  )
}
