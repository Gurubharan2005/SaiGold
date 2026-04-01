import { prisma } from '@/lib/prisma'
import { CheckCircle, AlertCircle, Clock, FileText, UserPlus, ArrowRight, Phone, Target } from 'lucide-react'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'
import Link from 'next/link'
import { format } from 'date-fns'
import QuickStatusActions from '@/components/QuickStatusActions'

import ManagerOpsDesk from '@/components/ManagerOpsDesk'

export const dynamic = 'force-dynamic';

export default async function DashboardPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ [key: string]: string | undefined }> 
}) {
  const { tab, viewUrl, docName, docType, viewAllId } = await searchParams
  const currentTab = tab || 'verifications'

  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const session = token ? await decrypt(token) : null

  // ----------------------------------------------------
  // MANAGER VIEW
  // ----------------------------------------------------
  if (session?.role === 'MANAGER') {
    const pendingLeads = await prisma.customer.count({ where: { status: 'WAITING' } })
    const dueCustomers = await prisma.customer.count({ where: { status: 'DUE' } })

    // Fetch Operations Desk Data
    const statusFilter = currentTab === 'history' 
      ? 'CLOSED' 
      : currentTab === 'closures' 
        ? 'CLOSE_REQUESTED' 
        : 'VERIFIED'

    const opsCustomers = await prisma.customer.findMany({
      where: { status: statusFilter as any },
      orderBy: { updatedAt: 'desc' },
      include: {
        documents: true,
        assignedTo: { select: { name: true } }
      }
    }) as any[]

    // Fetch Live Active Operations (Staff & Salesman activity)
    const activeOperations = await prisma.customer.findMany({
      where: { 
        status: { in: ['PROCESSING', 'ACCEPTED', 'VERIFIED', 'CLOSE_REQUESTED'] as any[] } 
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        assignedTo: { select: { name: true } }
      },
      take: 5
    }) as any[]

    return (
      <div className="fade-in">
        <h1 style={{ fontSize: '28px', marginBottom: '24px' }}>Branch Overview</h1>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '16px', borderRadius: 'var(--border-radius-md)' }}>
              <Clock size={28} color="var(--status-waiting)" />
            </div>
            <div>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>Awaiting Initial Connect</p>
              <h2 style={{ margin: 0, fontSize: '28px' }}>{pendingLeads}</h2>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'rgba(244, 63, 94, 0.1)', padding: '16px', borderRadius: 'var(--border-radius-md)' }}>
              <AlertCircle size={28} color="var(--status-due)" />
            </div>
            <div>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>Due Customers</p>
              <h2 style={{ margin: 0, fontSize: '28px' }}>{dueCustomers}</h2>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
           <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <Target size={18} color="var(--primary-color)" /> Live Team Pulse
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                 {activeOperations.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>No active handling currently tracked.</p>
                 ) : (
                    activeOperations.map(op => (
                       <div key={op.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'var(--surface-hover)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                          <div>
                             <div style={{ fontWeight: 600, fontSize: '14px' }}>{op.name}</div>
                             <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{op.assignedTo?.name || 'Unassigned'}</div>
                          </div>
                          <span className={`badge badge-${op.status.toLowerCase().replace('_', '-')}`} style={{ fontSize: '10px', padding: '4px 8px' }}>
                             {op.status}
                          </span>
                       </div>
                    ))
                 )}
              </div>
              <Link href="/dashboard/staff-monitoring" style={{ display: 'block', marginTop: '16px', textAlign: 'center', fontSize: '12px', color: 'var(--primary-color)', textDecoration: 'none' }}>
                 View Full Operational Monitor →
              </Link>
           </div>
        </div>

        <ManagerOpsDesk 
          currentTab={currentTab}
          customers={opsCustomers}
          session={session}
          viewUrl={viewUrl}
          docName={docName}
          docType={docType}
          viewAllId={viewAllId}
          baseUrl="/dashboard"
        />
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
      status: { notIn: ['CLOSED', 'REJECTED', 'PROCESSING', 'VERIFIED', 'ACCEPTED'] } 
    },
    orderBy: { assignedAt: 'desc' },
    select: { id: true, name: true, phone: true, status: true, priority: true }
  })


  const followUpsToday = await prisma.customer.findMany({
    where: {
      assignedToId: String(session?.id),
      followUpDate: { gte: todayStart, lte: todayEnd },
      status: { notIn: ['CLOSED', 'REJECTED'] }
    },
    select: { id: true, name: true, followUpDate: true, followUpNotes: true, phone: true, priority: true }
  })

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* HEADER OVERVIEW */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '28px', margin: 0 }}>Staff Workspace</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Manage assignments and organize priorities actively.</p>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
         <Link href="/dashboard/customers/new" style={{ textDecoration: 'none' }}>
           <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', background: 'var(--surface-color)', border: '1px solid var(--border-color)', transition: 'all 0.2s', ':hover': { borderColor: 'var(--primary-color)' } } as any}>
             <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: '50%' }}>
               <UserPlus size={24} color="#10B981" />
             </div>
             <div>
               <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-color)' }}>Quick Add Customer</h3>
               <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>Manually insert walk-ins instantly</p>
             </div>
           </div>
         </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '32px' }}>
        
        {/* ASSIGNED LEADS */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--surface-hover)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Target size={18} color="var(--primary-color)" /> My Active Assignments
            </h3>
            <span className="badge badge-waiting">{myAssignedLeads.length} Total</span>
          </div>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {myAssignedLeads.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>You have no active leads assigned currently.</div>
            ) : (
              myAssignedLeads.map(lead => (
                <div key={lead.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--border-color)' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '15px' }}>{lead.name}</h4>
                    <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={12}/> {lead.phone}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className={`badge badge-${lead.status.toLowerCase()}`}>{lead.status}</span>
                    <QuickStatusActions customerId={lead.id} phone={lead.phone} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>


        {/* TODAY'S FOLLOW UPS */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--surface-hover)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="#F59E0B" /> Follow-Ups Today
            </h3>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>{format(todayStart, 'MMM dd')}</span>
          </div>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {followUpsToday.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>You possess no required follow-ups for today.</div>
            ) : (
              followUpsToday.map(f => (
                <div key={f.id} style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', background: 'rgba(245, 158, 11, 0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <h4 style={{ margin: 0, fontSize: '15px', color: '#F59E0B' }}>Call: {f.name}</h4>
                    <Link href={`/dashboard/customers/${f.id}`} style={{ padding: '4px 8px', background: 'var(--surface-color)', borderRadius: '4px', textDecoration: 'none', border: '1px solid var(--border-color)', color: 'var(--text-color)' }}>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Phone size={12}/> {f.phone}
                  </div>
                  {f.followUpNotes && (
                    <div style={{ fontSize: '13px', color: 'var(--text-color)', background: 'var(--surface-color)', padding: '8px', borderRadius: '4px', borderLeft: '2px solid #F59E0B' }}>
                      "{f.followUpNotes}"
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
