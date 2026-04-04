import { prisma } from '@/lib/prisma'
import { CheckCircle, AlertCircle, Clock, FileText, UserPlus, ArrowRight, Phone, Target, ExternalLink } from 'lucide-react'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'
import Link from 'next/link'
import { format } from 'date-fns'
import QuickStatusActions from '@/components/QuickStatusActions'
import CompactSalesToolbar from '@/components/CompactSalesToolbar'
import PipelineCard from '@/components/PipelineCard'
import { User as UserIcon } from 'lucide-react'

export const revalidate = 15;

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const session = token ? await decrypt(token) : null

  // ----------------------------------------------------
  // ROLE REDIRECTS
  // ----------------------------------------------------
  const { redirect } = await import('next/navigation')
  if (session?.role === 'MAINTENANCE') {
    redirect('/dashboard/maintenance')
  }
  if (session?.role === 'FOLLOW_UP_STAFF') {
    redirect('/dashboard/followup')
  }

  // ----------------------------------------------------
  // MANAGER & SALESMAN VIEW (Full Access)
  // ----------------------------------------------------
  if (session?.role === 'MANAGER' || session?.role === 'SALESMAN') {
    const { Prisma } = await import('@prisma/client')
    const KanbanBoard = (await import('@/components/KanbanBoard')).default
    const LiveLeadsRefresh = (await import('@/components/LiveLeadsRefresh')).default

    const COLUMN_META = [
      { key: 'ACCEPTED',  label: 'Accepted',  color: '#10B981', bg: 'rgba(16,185,129,0.08)' },
      { key: 'FOLLOW_UP', label: 'Follow Up', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
      { key: 'REJECTED',  label: 'Rejected',  color: '#EF4444', bg: 'rgba(239,68,68,0.08)'  },
    ]

    const [accepted, followUp, rejected, waiting, dueCustomers] = await Promise.all([
      prisma.customer.findMany({ where: { status: 'ACCEPTED' }, take: 40, orderBy: { updatedAt: 'desc' }, include: { assignedTo: { select: { name: true } } } }),
      prisma.customer.findMany({ where: { status: 'FOLLOW_UP' }, take: 40, orderBy: { updatedAt: 'desc' }, include: { assignedTo: { select: { name: true } } } }),
      prisma.customer.findMany({ where: { status: 'REJECTED' }, take: 40, orderBy: { updatedAt: 'desc' }, include: { assignedTo: { select: { name: true } } } }),
      prisma.customer.count({ where: { status: 'WAITING' } }),
      prisma.customer.count({ where: { status: 'DUE' } }),
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: 0 }}>All Leads Overview</h1>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>Monitor branch branch performance.</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <span className="badge badge-waiting">{waiting} Pending</span>
            <span className="badge badge-accepted">{accepted.length} Accepted</span>
            <span className="badge badge-waiting" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>{followUp.length} Follow Up</span>
            <span className="badge badge-rejected">{rejected.length} Rejected</span>
            {dueCustomers > 0 && <span className="badge" style={{ background: 'rgba(244,63,94,0.1)', color: '#F43F5E' }}>{dueCustomers} Due</span>}
          </div>
        </div>

        {/* Kanban */}
        <KanbanBoard columns={columns} isManager={true} />
      </div>
    )
  }



  // ----------------------------------------------------
  // CALLER STAFF VIEW (Stage 1 of Pipeline)
  // ----------------------------------------------------
  const CallerCard = (await import('@/components/CallerCard')).default
  const LiveLeadsRefresh = (await import('@/components/LiveLeadsRefresh')).default

  // Fresh leads — never called yet
  const freshLeads = await prisma.customer.findMany({
    where: { 
      assignedToId: String(session?.id), 
      status: 'WAITING',
      lastCalledAt: null
    },
    take: 50,
    orderBy: { assignedAt: 'desc' },
    select: { id: true, name: true, phone: true, status: true, lastCalledAt: true }
  })

  // Called leads — called but not yet resolved (sent to follow-up or rejected)
  const calledLeads = await prisma.customer.findMany({
    where: { 
      assignedToId: String(session?.id), 
      status: 'WAITING',
      lastCalledAt: { not: null }
    },
    take: 50,
    orderBy: { lastCalledAt: 'desc' },
    select: { id: true, name: true, phone: true, status: true, lastCalledAt: true }
  })

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
      <LiveLeadsRefresh />

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: 0 }}>Caller Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '4px 0 0 0' }}>Call leads, add recordings, and send confirmed customers to the Follow-Up team.</p>
        </div>
      </div>

      {/* SECTION 1: FRESH LEADS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Target size={20} color="var(--primary-color)" /> Fresh Leads
          </h2>
          <span className="badge badge-waiting">{freshLeads.length} New</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
          {freshLeads.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '48px', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--surface-color)', border: '1px dashed var(--border-color)', borderRadius: '16px' }}>
              <CheckCircle size={36} color="var(--primary-color)" style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
              <p style={{ margin: 0, fontWeight: 600 }}>All fresh leads attended!</p>
              <p style={{ margin: '8px 0 0 0', fontSize: '13px' }}>New leads from Meta Ads appear here instantly.</p>
            </div>
          ) : (
            freshLeads.map(lead => <CallerCard key={lead.id} lead={lead} section="NEW" />)
          )}
        </div>
      </div>

      {/* SECTION 2: CALLED — AWAITING RESOLUTION */}
      {calledLeads.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Phone size={20} color="#EF4444" /> Called — Awaiting Resolution
            </h2>
            <span className="badge" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>{calledLeads.length}</span>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>These leads have been called. Send them to Follow-Up Staff or Reject.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
            {calledLeads.map(lead => <CallerCard key={lead.id} lead={lead} section="CALLED" />)}
          </div>
        </div>
      )}
    </div>
  )
}
