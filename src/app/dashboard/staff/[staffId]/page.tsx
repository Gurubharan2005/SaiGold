import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { LeadCard } from '@/components/LeadCard'
import QuickRecordingUpload from '@/components/QuickRecordingUpload'
import { CheckCircle, Clock, XCircle, ArrowLeft, User, Shield, Mic } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const COLUMNS = [
  { key: 'ACCEPTED',  label: 'Accepted',  icon: CheckCircle, color: '#10B981', bg: 'rgba(16,185,129,0.08)' },
  { key: 'FOLLOW_UP', label: 'Follow Up', icon: Clock,        color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
  { key: 'REJECTED',  label: 'Rejected',  icon: XCircle,      color: '#EF4444', bg: 'rgba(239,68,68,0.08)'  },
]

export default async function StaffProfilePage({
  params
}: {
  params: Promise<{ staffId: string }>
}) {
  const { staffId } = await params

  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const session = token ? await decrypt(token) : null

  if (!session?.id || session.role !== 'MANAGER') redirect('/')

  const staff = await prisma.user.findUnique({
    where: { id: staffId },
    select: { id: true, name: true, email: true, role: true, createdAt: true }
  })
  if (!staff) notFound()

  const [accepted, followUp, rejected, waiting] = await Promise.all([
    prisma.customer.findMany({ where: { assignedToId: staffId, status: 'ACCEPTED' }, orderBy: { updatedAt: 'desc' }, include: { assignedTo: { select: { name: true } } } }),
    prisma.customer.findMany({ where: { assignedToId: staffId, status: 'FOLLOW_UP' }, orderBy: { updatedAt: 'desc' }, include: { assignedTo: { select: { name: true } } } }),
    prisma.customer.findMany({ where: { assignedToId: staffId, status: 'REJECTED' }, orderBy: { updatedAt: 'desc' }, include: { assignedTo: { select: { name: true } } } }),
    prisma.customer.findMany({ where: { assignedToId: staffId, status: { in: ['WAITING', 'NO_RESPONSE', 'DUE'] } }, orderBy: { updatedAt: 'desc' }, include: { assignedTo: { select: { name: true } } } }),
  ])

  const total = accepted.length + followUp.length + rejected.length + waiting.length

  const columns = [
    { ...COLUMNS[0], leads: accepted },
    { ...COLUMNS[1], leads: followUp },
    { ...COLUMNS[2], leads: rejected },
  ]

  return (
    <div className="fade-in">
      {/* Back button */}
      <Link href="/dashboard/staff" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '14px', marginBottom: '20px' }}>
        <ArrowLeft size={16} /> Back to Staff
      </Link>

      {/* Staff header */}
      <div className="card" style={{ padding: '20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'var(--surface-hover)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <User size={24} color="var(--primary-color)" />
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '22px', margin: 0 }}>{staff.name}</h1>
          <div style={{ display: 'flex', gap: '12px', marginTop: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Shield size={11} /> {staff.role}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{staff.email}</span>
          </div>
        </div>
        {/* Summary pills */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <span className="badge badge-waiting">{waiting.length} Pending</span>
          <span className="badge badge-accepted">{accepted.length} Accepted</span>
          <span className="badge badge-follow-up">{followUp.length} Follow Up</span>
          <span className="badge badge-rejected">{rejected.length} Rejected</span>
        </div>
      </div>

      {/* Pending section */}
      {waiting.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', background: '#F59E0B', borderRadius: '50%', display: 'inline-block' }} />
            New / Pending ({waiting.length})
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
            {waiting.map(lead => (
              <LeadCard key={lead.id} customer={lead}>
                <div style={{ marginTop: '4px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                  <QuickRecordingUpload customerId={lead.id} customerName={lead.name} />
                </div>
              </LeadCard>
            ))}
          </div>
        </div>
      )}

      {/* 3-Column Kanban */}
      {total === 0 ? (
        <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--surface-color)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
          No leads assigned to {staff.name} yet.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', alignItems: 'start' }}>
          {columns.map(col => {
            const Icon = col.icon
            return (
              <div key={col.key}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', padding: '10px 14px', background: col.bg, border: `1px solid ${col.color}30`, borderRadius: '10px' }}>
                  <Icon size={16} color={col.color} />
                  <span style={{ fontWeight: 700, fontSize: '14px', color: col.color }}>{col.label}</span>
                  <span style={{ marginLeft: 'auto', background: col.color, color: '#fff', borderRadius: '999px', padding: '1px 8px', fontSize: '11px', fontWeight: 700 }}>{col.leads.length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {col.leads.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--surface-color)', borderRadius: '12px', border: '1px dashed var(--border-color)', fontSize: '13px' }}>
                      No {col.label.toLowerCase()} leads
                    </div>
                  ) : (
                    col.leads.map(lead => (
                      <LeadCard key={lead.id} customer={lead}>
                        <div style={{ marginTop: '4px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
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
      )}
    </div>
  )
}
