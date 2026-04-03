import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'
import { redirect } from 'next/navigation'
import KanbanBoard from '@/components/KanbanBoard'
import { LeadCard } from '@/components/LeadCard'
import { StaffLeadActions } from '@/components/StaffLeadActions'
import QuickRecordingUpload from '@/components/QuickRecordingUpload'
import { User } from 'lucide-react'
import LiveLeadsRefresh from '@/components/LiveLeadsRefresh'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

const COLUMN_META = [
  { key: 'ACCEPTED',  label: 'Accepted',  color: '#10B981', bg: 'rgba(16,185,129,0.08)' },
  { key: 'FOLLOW_UP', label: 'Follow Up', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
  { key: 'REJECTED',  label: 'Rejected',  color: '#EF4444', bg: 'rgba(239,68,68,0.08)'  },
]

export default async function LeadsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const session = token ? await decrypt(token) : null
  if (!session?.id) redirect('/')

  const isManager = session.role === 'MANAGER'
  const baseWhere: Prisma.CustomerWhereInput = {}
  if (!isManager) baseWhere.assignedToId = String(session.id)

  const [accepted, followUp, rejected, waiting] = await Promise.all([
    prisma.customer.findMany({ where: { ...baseWhere, status: 'ACCEPTED' }, orderBy: { updatedAt: 'desc' }, include: { assignedTo: { select: { name: true } } } }),
    prisma.customer.findMany({ where: { ...baseWhere, status: 'FOLLOW_UP' }, orderBy: { updatedAt: 'desc' }, include: { assignedTo: { select: { name: true } } } }),
    prisma.customer.findMany({ where: { ...baseWhere, status: 'REJECTED' }, orderBy: { updatedAt: 'desc' }, include: { assignedTo: { select: { name: true } } } }),
    prisma.customer.findMany({ where: { ...baseWhere, status: { in: ['WAITING', 'NO_RESPONSE', 'DUE'] } }, orderBy: { updatedAt: 'desc' }, include: { assignedTo: { select: { name: true } } } }),
  ])

  const columns = [
    { ...COLUMN_META[0], leads: accepted },
    { ...COLUMN_META[1], leads: followUp },
    { ...COLUMN_META[2], leads: rejected },
  ]

  return (
    <div className="fade-in">
      <LiveLeadsRefresh />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', margin: 0 }}>{isManager ? 'All Leads Overview' : 'My Leads'}</h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
            {isManager ? 'Monitor all staff leads.' : 'Your assigned leads by status.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span className="badge badge-waiting">{waiting.length} Pending</span>
          <span className="badge badge-accepted">{accepted.length} Accepted</span>
          <span className="badge badge-waiting" style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}>{followUp.length} Follow Up</span>
          <span className="badge badge-rejected">{rejected.length} Rejected</span>
        </div>
      </div>

      {/* Pending / New leads */}
      {waiting.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', background: '#F59E0B', borderRadius: '50%', display: 'inline-block', flexShrink: 0 }} />
            New / Pending ({waiting.length})
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
            {waiting.map(lead => (
              <LeadCard key={lead.id} customer={lead}>
                <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {isManager ? (
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <User size={12} /> {lead.assignedTo?.name || 'Unassigned'}
                    </div>
                  ) : (
                    <StaffLeadActions leadId={lead.id} />
                  )}
                  <QuickRecordingUpload customerId={lead.id} customerName={lead.name} />
                </div>
              </LeadCard>
            ))}
          </div>
        </div>
      )}

      {/* 3-Column Kanban (responsive) */}
      <KanbanBoard columns={columns} isManager={isManager} />
    </div>
  )
}
