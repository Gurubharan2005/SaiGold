import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { LeadCard } from '@/components/LeadCard'
import { StaffLeadActions } from '@/components/StaffLeadActions'
import QuickRecordingUpload from '@/components/QuickRecordingUpload'
import { User, CheckCircle, Clock, XCircle, Mic } from 'lucide-react'
import LiveLeadsRefresh from '@/components/LiveLeadsRefresh'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

const COLUMNS = [
  { key: 'ACCEPTED',  label: 'Accepted',  icon: CheckCircle, color: '#10B981', bg: 'rgba(16,185,129,0.08)'  },
  { key: 'FOLLOW_UP', label: 'Follow Up', icon: Clock,        color: '#F59E0B', bg: 'rgba(245,158,11,0.08)'  },
  { key: 'REJECTED',  label: 'Rejected',  icon: XCircle,      color: '#EF4444', bg: 'rgba(239,68,68,0.08)'   },
]

// Also show WAITING leads in a top banner
const WAITING_STATUS = ['WAITING']

export default async function LeadsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const session = token ? await decrypt(token) : null

  if (!session?.id) redirect('/')

  const isManager = session.role === 'MANAGER'

  const baseWhere: Prisma.CustomerWhereInput = {}
  if (!isManager) baseWhere.assignedToId = String(session.id)

  // Fetch leads for each column + waiting
  const [accepted, followUp, rejected, waiting] = await Promise.all([
    prisma.customer.findMany({
      where: { ...baseWhere, status: 'ACCEPTED' },
      orderBy: { updatedAt: 'desc' },
      include: { assignedTo: { select: { name: true } } }
    }),
    prisma.customer.findMany({
      where: { ...baseWhere, status: 'FOLLOW_UP' },
      orderBy: { updatedAt: 'desc' },
      include: { assignedTo: { select: { name: true } } }
    }),
    prisma.customer.findMany({
      where: { ...baseWhere, status: 'REJECTED' },
      orderBy: { updatedAt: 'desc' },
      include: { assignedTo: { select: { name: true } } }
    }),
    prisma.customer.findMany({
      where: { ...baseWhere, status: { in: ['WAITING', 'NO_RESPONSE', 'DUE'] } },
      orderBy: { updatedAt: 'desc' },
      include: { assignedTo: { select: { name: true } } }
    }),
  ])

  const columns = [
    { ...COLUMNS[0], leads: accepted },
    { ...COLUMNS[1], leads: followUp },
    { ...COLUMNS[2], leads: rejected },
  ]

  return (
    <div className="fade-in">
      <LiveLeadsRefresh />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', margin: 0 }}>
            {isManager ? 'All Leads Overview' : 'My Leads'}
          </h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>
            {isManager ? 'Monitor all staff leads across branches.' : 'Your assigned leads by status.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <span className="badge badge-waiting">{waiting.length} New / Pending</span>
          <span className="badge badge-accepted">{accepted.length} Accepted</span>
          <span className="badge badge-follow-up">{followUp.length} Follow Up</span>
          <span className="badge badge-rejected">{rejected.length} Rejected</span>
        </div>
      </div>

      {/* New / Waiting Banner */}
      {waiting.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', background: '#F59E0B', borderRadius: '50%', display: 'inline-block' }} />
            New / Pending ({waiting.length})
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
            {waiting.map(lead => (
              <LeadCard key={lead.id} customer={lead}>
                <div style={{ marginTop: '4px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
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

      {/* 3-Column Kanban */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', alignItems: 'start' }}>
        {columns.map(col => {
          const Icon = col.icon
          return (
            <div key={col.key}>
              {/* Column Header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px',
                padding: '10px 14px', background: col.bg,
                border: `1px solid ${col.color}30`, borderRadius: '10px'
              }}>
                <Icon size={16} color={col.color} />
                <span style={{ fontWeight: 700, fontSize: '14px', color: col.color }}>{col.label}</span>
                <span style={{
                  marginLeft: 'auto', background: col.color, color: '#fff',
                  borderRadius: '999px', padding: '1px 8px', fontSize: '11px', fontWeight: 700
                }}>{col.leads.length}</span>
              </div>

              {/* Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {col.leads.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--surface-color)', borderRadius: '12px', border: '1px dashed var(--border-color)', fontSize: '13px' }}>
                    No {col.label.toLowerCase()} leads
                  </div>
                ) : (
                  col.leads.map(lead => (
                    <LeadCard key={lead.id} customer={lead}>
                      <div style={{ marginTop: '4px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
