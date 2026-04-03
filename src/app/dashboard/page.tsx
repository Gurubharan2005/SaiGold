import { prisma } from '@/lib/prisma'
import { CheckCircle, AlertCircle, Clock, FileText, UserPlus, ArrowRight, Phone, Target, ExternalLink } from 'lucide-react'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'
import Link from 'next/link'
import { format } from 'date-fns'
import QuickStatusActions from '@/components/QuickStatusActions'

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

  const myAssignedLeads = await prisma.customer.findMany({
    where: { 
      assignedToId: String(session?.id), 
      status: { in: ['WAITING', 'ACCEPTED', 'DUE'] }
    },
    orderBy: { assignedAt: 'desc' },
    select: { id: true, name: true, phone: true, status: true, priority: true }
  })


  const followUpsToday = await prisma.customer.findMany({
    where: {
      assignedToId: String(session?.id),
      status: { notIn: ['CLOSED', 'REJECTED', 'PROCESSING', 'VERIFIED'] },
      OR: [
        { followUpDate: { gte: todayStart, lte: todayEnd } },
        { status: 'FOLLOW_UP' }
      ]
    },
    select: { id: true, name: true, followUpDate: true, followUpNotes: true, phone: true, status: true, priority: true }
  })

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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '32px' }}>
        
        {/* ASSIGNED LEADS */}
        <div className="card" style={{ padding: 0, overflow: 'visible', borderRadius: '12px' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--surface-hover)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Target size={18} color="var(--primary-color)" /> My Ongoing Leads
            </h3>
            <span className="badge badge-waiting">{myAssignedLeads.length} Total</span>
          </div>
          <div style={{ maxHeight: '600px', overflowY: 'auto', paddingBottom: '120px' }}>
            {myAssignedLeads.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>You have no active leads assigned currently.</div>
            ) : (
              myAssignedLeads.map((lead) => (
                 <div key={lead.id} style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                     <div style={{ minWidth: 0, flex: 1 }}>
                       <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-color)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.name}</h4>
                       <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                         <Phone size={12} color="var(--primary-color)" /> {lead.phone}
                       </p>
                     </div>
                     <span className={`badge badge-${lead.status.toLowerCase()}`} style={{ fontSize: '11px', fontWeight: 800 }}>{lead.status}</span>
                   </div>
                   
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                     <QuickStatusActions customerId={lead.id} customerName={lead.name} phone={lead.phone} />
                     {['ACCEPTED', 'PROCESSING', 'VERIFIED', 'CLOSED'].includes(lead.status) && (
                       <Link href={`/dashboard/customers/${lead.id}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 700, padding: '4px 0' }}>
                         <ExternalLink size={14} /> Full Customer Profile &rarr;
                       </Link>
                     )}
                   </div>
                 </div>
              ))
            )}
          </div>
        </div>


        {/* TODAY'S FOLLOW UPS */}
        <div className="card" style={{ padding: 0, overflow: 'visible', borderRadius: '12px' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--surface-hover)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="#F59E0B" /> Today's Calling List
            </h3>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>{format(todayStart, 'MMM dd')}</span>
          </div>
          <div style={{ maxHeight: '600px', overflowY: 'auto', paddingBottom: '120px' }}>
            {followUpsToday.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>Great job! You have no more calls scheduled for today.</div>
            ) : (
              followUpsToday.map((f) => (
                <div key={f.id} style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', background: 'rgba(245, 158, 11, 0.05)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ margin: 0, fontSize: '16px', color: '#F59E0B', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Follow Up: {f.name}</h4>
                      <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Phone size={13} /> {f.phone}
                      </div>
                    </div>
                    {['ACCEPTED', 'PROCESSING', 'VERIFIED', 'CLOSED'].includes(f.status || '') && (
                      <Link href={`/dashboard/customers/${f.id}`} style={{ fontSize: '12px', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600, background: 'var(--surface-color)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                        Details &rarr;
                      </Link>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1 }}>
                      <QuickStatusActions customerId={f.id} customerName={f.name} phone={f.phone} />
                    </div>
                  </div>

                  {f.followUpNotes && (
                    <div style={{ fontSize: '13px', color: 'var(--text-color)', background: 'var(--surface-color)', padding: '10px', borderRadius: '8px', borderLeft: '3px solid #F59E0B', fontStyle: 'italic' }}>
                      &ldquo;{f.followUpNotes}&rdquo;
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  )
}
