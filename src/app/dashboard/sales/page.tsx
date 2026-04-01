import { prisma } from '@/lib/prisma'
import { Search, ShieldCheck, Phone, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'
import ManagerOpsDesk from '@/components/ManagerOpsDesk'

export const dynamic = 'force-dynamic'

export default async function SalesVerificationDesk({ 
  searchParams 
}: { 
  searchParams: Promise<{ [key: string]: string | undefined }> 
}) {
  const { viewUrl, docName, docType, viewAllId, tab } = await searchParams
  const currentTab = tab || 'verifications'
  
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const session = token ? await decrypt(token) : null

  // Data Fetching based on Tab
  const statusFilter = currentTab === 'history' 
    ? 'CLOSED' 
    : currentTab === 'closures' 
      ? 'CLOSE_REQUESTED' 
      : 'VERIFIED'

  const customers = await prisma.customer.findMany({
    where: { 
      status: statusFilter as any
    },
    orderBy: { updatedAt: 'desc' }, // Latest activity first
    include: {
      documents: true,
      assignedTo: { select: { name: true } }
    }
  }) as any[]

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShieldCheck size={32} color="var(--primary-color)" />
          Dedicated Sales Workbench
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
          Focused verification and approval desk for senior sales personnel.
        </p>
      </div>

      <ManagerOpsDesk 
        currentTab={currentTab}
        customers={customers}
        session={session}
        viewUrl={viewUrl}
        docName={docName}
        docType={docType}
        viewAllId={viewAllId}
        baseUrl="/dashboard/sales"
      />
    </div>
  )
}
