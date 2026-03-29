import { prisma } from '@/lib/prisma'
import { Check, X, Phone, MapPin } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'
import ClientBulkLeadsTable from '@/components/ClientBulkLeadsTable'
export const dynamic = 'force-dynamic'

export default async function LeadsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const session = token ? await decrypt(token) : null

  // Fetch all leads that came from Meta Webhook (Waiting Status)
  const leads = await prisma.customer.findMany({
    where: { status: 'WAITING' },
    orderBy: { createdAt: 'desc' }
  })

  // Fetch active staff list for bulk assignment
  const activeStaffList = session?.role === 'MANAGER' 
    ? await prisma.user.findMany({
        where: { role: 'STAFF', isActive: true },
        select: { id: true, name: true }
      })
    : []

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', margin: 0 }}>Incoming Meta Leads</h1>
        <div className="badge badge-waiting">
          {leads.length} Pending
        </div>
      </div>

      <ClientBulkLeadsTable 
        leads={leads} 
        activeStaffList={activeStaffList} 
        userRole={session?.role || 'STAFF'} 
      />
    </div>
  )
}
