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

export const dynamic = 'force-dynamic';

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

  // ----------------------------------------------------
  // MANAGER VIEW
  // ----------------------------------------------------
  if (session?.role === 'MANAGER') {
    const { Prisma } = await import('@prisma/client')
    const KanbanBoard = (await import('@/components/KanbanBoard')).default
    const LiveLeadsRefresh = (await import('@/components/LiveLeadsRefresh')).default

    const COLUMN_META = [
      { key: 'ACCEPTED',  label: 'Accepted',  color: '#10B981', bg: 'rgba(16,185,129,0.08)' },
      { key: 'FOLLOW_UP', label: 'Follow Up', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
      { key: 'REJECTED',  label: 'Rejected',  color: '#EF4444', bg: 'rgba(239,68,68,0.08)'  },
    ]

    const [accepted, followUp, rejected, waiting, dueCustomers] = await Promise.all([
      prisma.customer.findMany({ where: { status: 'ACCEPTED' }, orderBy: { updatedAt: 'desc' }, include: { assignedTo: { select: { name: true } } } }),
      prisma.customer.findMany({ where: { status: 'FOLLOW_UP' }, orderBy: { updatedAt: 'desc' }, include: { assignedTo: { select: { name: true } } } }),
      prisma.customer.findMany({ where: { status: 'REJECTED' }, orderBy: { updatedAt: 'desc' }, include: { assignedTo: { select: { name: true } } } }),
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '24px', margin: 0 }}>All Leads Overview</h1>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>Monitor all staff leads across the branch.</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
  // SALESMAN VIEW (Verification Desk)
  // ----------------------------------------------------
  if (session?.role === 'SALESMAN') {
    const pendingVerification = await prisma.customer.findMany({
      where: { status: 'VERIFIED' },
      orderBy: { updatedAt: 'desc' },
      include: { assignedTo: { select: { name: true } } }
    })

    return (
      <div className="fade-in">
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', margin: 0 }}>Verification Desk</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Review and confirm leads sent by branch staff for final loan conversion.</p>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--surface-hover)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="var(--primary-color)" /> Pending Confirmations
            </h3>
            <span className="badge badge-waiting">{pendingVerification.length} Leads</span>
          </div>
          <div>
            {pendingVerification.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>No leads are currently waiting for verification.</div>
            ) : (
              pendingVerification.map((lead) => (
                <div key={lead.id} style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '16px' }}>{lead.name}</h4>
                    <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>Assigned to: {lead.assignedTo?.name || 'Unknown'}</p>
                  </div>
                  <Link href={`/dashboard/customers/${lead.id}`} className="btn-primary" style={{ textDecoration: 'none', fontSize: '13px', padding: '8px 16px' }}>
                    Review Documents &rarr;
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    )
  }

  // ----------------------------------------------------
  // STAFF VIEW
  // ----------------------------------------------------
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const [waitingLeads, followUpLeads, rejectedLeads] = await Promise.all([
    prisma.customer.findMany({
      where: { assignedToId: String(session?.id), status: 'WAITING' },
      orderBy: { assignedAt: 'desc' },
      select: { id: true, name: true, phone: true, status: true }
    }),
    prisma.customer.findMany({
      where: { assignedToId: String(session?.id), status: 'FOLLOW_UP' },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, name: true, phone: true, status: true }
    }),
    prisma.customer.findMany({
      where: { assignedToId: String(session?.id), status: 'REJECTED' },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, name: true, phone: true, status: true }
    })
  ])

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* HEADER OVERVIEW */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '28px', margin: 0 }}>Sales Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Manage your assigned leads and track your daily targets.</p>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      {session?.role === 'MANAGER' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
           <Link href="/dashboard/customers/new" style={{ textDecoration: 'none' }}>
           <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}>
               <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: '50%' }}>
                 <UserPlus size={24} color="#10B981" />
               </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-color)' }}>New Walk-in Entry</h3>
                  <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>Instantly register a customer who visited the branch.</p>
                </div>
             </div>
           </Link>
        </div>
      )}

      {/* ACTIVE LEADS PIPELINE (3-COLUMN SECTION) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
           <Target size={22} color="var(--primary-color)" /> Active Leads Pipeline
        </h2>

        <div className="pipeline-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', alignItems: 'flex-start' }}>
          
          {/* COLUMN 1: NOT ATTENDED */}
          <div className="pipeline-column">
            <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderBottom: '2px solid var(--primary-color)', borderRadius: '8px 8px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontWeight: 800, fontSize: '13px', letterSpacing: '0.05em' }}>NOT ATTENDED</span>
              <span className="badge badge-waiting">{waitingLeads.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '1000px', overflowY: 'auto', paddingRight: '4px' }}>
              {waitingLeads.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', border: '1px dashed var(--border-color)', borderRadius: '12px', fontSize: '13px' }}>No new leads waiting.</div>
              ) : (
                waitingLeads.map(lead => <PipelineCard key={lead.id} lead={lead} column="WAITS" />)
              )}
            </div>
          </div>

          {/* COLUMN 2: FOLLOW-UP */}
          <div className="pipeline-column">
            <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderBottom: '2px solid #F59E0B', borderRadius: '8px 8px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontWeight: 800, fontSize: '13px', letterSpacing: '0.05em' }}>FOLLOW-UP</span>
              <span className="badge badge-waiting" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>{followUpLeads.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '1000px', overflowY: 'auto', paddingRight: '4px' }}>
              {followUpLeads.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', border: '1px dashed var(--border-color)', borderRadius: '12px', fontSize: '13px' }}>No leads in follow-up.</div>
              ) : (
                followUpLeads.map(lead => <PipelineCard key={lead.id} lead={lead} column="FOLLOW" />)
              )}
            </div>
          </div>

          {/* COLUMN 3: REJECTED */}
          <div className="pipeline-column">
            <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderBottom: '2px solid #EF4444', borderRadius: '8px 8px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontWeight: 800, fontSize: '13px', letterSpacing: '0.05em' }}>REJECTED</span>
              <span className="badge badge-rejected">{rejectedLeads.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '1000px', overflowY: 'auto', paddingRight: '4px' }}>
              {rejectedLeads.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', border: '1px dashed var(--border-color)', borderRadius: '12px', fontSize: '13px' }}>No rejected leads.</div>
              ) : (
                rejectedLeads.map(lead => <PipelineCard key={lead.id} lead={lead} column="REJECT" />)
              )}
            </div>
          </div>

        </div>
      </div>

    </div>
  )
}
