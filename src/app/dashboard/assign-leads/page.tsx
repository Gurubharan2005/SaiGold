import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'
import ClientBulkLeadsTable from '@/components/ClientBulkLeadsTable'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AssignLeadsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const session = token ? await decrypt(token) : null

  // Ensure Only Managers can physically route onto the assignment array bounds
  if (session?.role !== 'MANAGER') {
     redirect('/dashboard')
  }

  // Fetch strictly the active Meta Leads remaining inside the waiting queue
  const leads = await prisma.customer.findMany({
    where: { status: 'WAITING', createdById: null },
    orderBy: { createdAt: 'desc' }
  })

  // Fetch active staff list perfectly mapping available receivers
  const activeStaffList = await prisma.user.findMany({
    where: { role: 'STAFF', isActive: true },
    select: { id: true, name: true }
  })

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
           <h1 style={{ fontSize: '28px', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
             Assign Incoming Leads
           </h1>
           <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>Distribute pure meta webhooks instantly allocating staff resources securely natively smoothly.</p>
        </div>
        <div className="badge badge-waiting" style={{ scale: '1.2' }}>
          {leads.length} Pending
        </div>
      </div>

      <ClientBulkLeadsTable 
        leads={leads} 
        activeStaffList={activeStaffList} 
        userRole={'MANAGER'} 
      />
    </div>
  )
}
