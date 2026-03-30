import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { LeadCard } from '@/components/LeadCard'
import { User } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AssignmentsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const session = token ? await decrypt(token) : null

  if (session?.role !== 'MANAGER') {
    redirect('/dashboard')
  }

  // Fetch all leads that have been assigned to a staff member
  const assignedLeads = await prisma.customer.findMany({
    where: { assignedToId: { not: null } },
    orderBy: { updatedAt: 'desc' },
    include: { assignedTo: true }
  })

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', margin: 0 }}>Assigned Leads Tracking</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Monitor which leads are currently handled by which staff member.</p>
        </div>
        <div className="badge badge-accepted" style={{ scale: '1.2' }}>
           {assignedLeads.length} Tracked
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {assignedLeads.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)', gridColumn: '1 / -1', background: 'var(--surface-color)', borderRadius: '12px' }}>
            No leads have been assigned to staff yet.
          </div>
        ) : (
          assignedLeads.map((lead: any) => (
             <LeadCard key={lead.id} customer={lead}>
               {/* Show who it belongs to */}
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                  <div style={{ background: '#3B82F6', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <User size={14} color="#FFF" />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Assigned To</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#3B82F6' }}>{lead.assignedTo?.name || 'Unknown Staff'}</div>
                  </div>
               </div>
             </LeadCard>
          ))
        )}
      </div>
    </div>
  )
}
