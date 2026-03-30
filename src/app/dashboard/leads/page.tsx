import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { LeadCard } from '@/components/LeadCard'
import { StaffLeadActions } from '@/components/StaffLeadActions'

export const dynamic = 'force-dynamic'

export default async function LeadsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const session = token ? await decrypt(token) : null

  if (!session?.id) {
    redirect('/')
  }

  // Fetch only leads directly assigned to this staff member, excluding ones completely CLOSED
  const leads = await prisma.customer.findMany({
    where: { 
       assignedToId: session.id,
       status: { in: ['WAITING', 'ACCEPTED', 'PROCESSING', 'VERIFIED', 'FOLLOW_UP', 'NO_RESPONSE'] }
    },
    orderBy: { updatedAt: 'desc' }
  })

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', margin: 0 }}>My Active Leads</h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>Customers requiring your immediate attention or follow-up.</p>
        </div>
        <div className="badge badge-waiting">
          {leads.length} Pending
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {leads.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)', gridColumn: '1 / -1', background: 'var(--surface-color)', borderRadius: '12px' }}>
            You have no active leads assigned to you at the moment.
          </div>
        ) : (
          leads.map((lead: any) => (
             <LeadCard key={lead.id} customer={lead}>
                <div style={{ marginTop: '4px' }}>
                   <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Change Status</div>
                   <StaffLeadActions leadId={lead.id} />
                </div>
             </LeadCard>
          ))
        )}
      </div>
    </div>
  )
}
