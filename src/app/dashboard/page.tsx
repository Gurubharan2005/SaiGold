import { prisma } from '@/lib/prisma'
import { CheckCircle, AlertCircle, Clock, FileText, UserPlus, ArrowRight, Phone, Target } from 'lucide-react'
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
  // MANAGER VIEW
  // ----------------------------------------------------
  if (session?.role === 'MANAGER') {
    const [pendingLeads, dueCustomers] = await Promise.all([
      prisma.customer.count({ where: { status: 'WAITING' } }),
      prisma.customer.count({ where: { status: 'DUE' } }),
    ])

    return (
      <div className="fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '28px', margin: 0 }}>Branch Performance Summary</h1>
          <span style={{ fontSize: '10px', color: 'var(--text-secondary)', background: 'var(--surface-hover)', padding: '4px 8px', borderRadius: '4px' }}>
            Latest Sync: 14:35 UTC
          </span>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '16px', borderRadius: 'var(--border-radius-md)' }}>
              <Clock size={28} color="var(--status-waiting)" />
            </div>
            <div>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>New Leads (Not Yet Called)</p>
              <h2 style={{ margin: 0, fontSize: '28px' }}>{pendingLeads}</h2>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'rgba(244, 63, 94, 0.1)', padding: '16px', borderRadius: 'var(--border-radius-md)' }}>
              <AlertCircle size={28} color="var(--status-due)" />
            </div>
            <div>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>Payments Due Today</p>
              <h2 style={{ margin: 0, fontSize: '28px' }}>{dueCustomers}</h2>
            </div>
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
    select: { id: true, name: true, followUpDate: true, followUpNotes: true, phone: true, priority: true }
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '32px' }}>
        
        {/* ASSIGNED LEADS */}
        <div className="card" style={{ padding: 0, overflow: 'visible', borderRadius: '12px' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--surface-hover)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Target size={18} color="var(--primary-color)" /> My Ongoing Leads
            </h3>
            <span className="badge badge-waiting">{myAssignedLeads.length} Total</span>
          </div>
          <div style={{ maxHeight: '400px', overflowY: 'auto', paddingBottom: '80px' }}>
            {myAssignedLeads.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>You have no active leads assigned currently.</div>
            ) : (
              myAssignedLeads.map((lead) => (
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
        <div className="card" style={{ padding: 0, overflow: 'visible', borderRadius: '12px' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--surface-hover)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="#F59E0B" /> Today's Calling List
            </h3>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>{format(todayStart, 'MMM dd')}</span>
          </div>
          <div style={{ maxHeight: '400px', overflowY: 'auto', paddingBottom: '80px' }}>
            {followUpsToday.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>Great job! You have no more calls scheduled for today.</div>
            ) : (
              followUpsToday.map((f) => (
                <div key={f.id} style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', background: 'rgba(245, 158, 11, 0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '15px', color: '#F59E0B' }}>Follow Up: {f.name}</h4>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Phone size={12}/> {f.phone}
                      </div>
                    </div>
                    <div>
                      <QuickStatusActions customerId={f.id} phone={f.phone} />
                      <div style={{ marginTop: '8px', textAlign: 'right' }}>
                         <Link href={`/dashboard/customers/${f.id}`} style={{ fontSize: '11px', color: 'var(--text-secondary)', textDecoration: 'none' }}>
                           View Details &rarr;
                         </Link>
                      </div>
                    </div>
                  </div>
                  {f.followUpNotes && (
                    <div style={{ fontSize: '13px', color: 'var(--text-color)', background: 'var(--surface-color)', padding: '8px', borderRadius: '4px', borderLeft: '2px solid #F59E0B' }}>
                      {f.followUpNotes}
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
