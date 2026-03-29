import { prisma } from '@/lib/prisma'
import { CheckCircle, AlertCircle, Clock, FileText, UserPlus, Target, Navigation, ArrowRight, Phone } from 'lucide-react'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'
import ClientBulkAssignTable from '@/components/ClientBulkAssignTable'
import Link from 'next/link'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const session = token ? await decrypt(token) : null

  // ----------------------------------------------------
  // MANAGER VIEW
  // ----------------------------------------------------
  if (session?.role === 'MANAGER') {
    const pendingLeads = await prisma.customer.count({ where: { status: 'WAITING' } })
    const activeLoans = await prisma.customer.count({ where: { status: 'PROCESSING', priority: 'HIGH' } })
    const dueCustomers = await prisma.customer.count({ where: { status: 'DUE' } })

    const activeStaffList = await prisma.user.findMany({
      where: { role: 'STAFF', isActive: true },
      select: { id: true, name: true }
    })

    const recentCustomers = await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, phone: true, status: true, loanAmount: true,
        createdById: true, createdAt: true,
        assignedTo: { select: { id: true, name: true } }
      },
      take: 50
    })

    return (
      <div className="fade-in">
        <h1 style={{ fontSize: '28px', marginBottom: '24px' }}>Overview</h1>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '16px', borderRadius: 'var(--border-radius-md)' }}>
              <Clock size={28} color="var(--status-waiting)" />
            </div>
            <div>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>Pending System Leads</p>
              <h2 style={{ margin: 0, fontSize: '28px' }}>{pendingLeads}</h2>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '16px', borderRadius: 'var(--border-radius-md)' }}>
              <CheckCircle size={28} color="#EF4444" />
            </div>
            <div>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>High Priority Processing</p>
              <h2 style={{ margin: 0, fontSize: '28px' }}>{activeLoans}</h2>
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
        
        <ClientBulkAssignTable 
          customers={recentCustomers} 
          activeStaffList={activeStaffList} 
          userRole={'MANAGER'} 
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
      status: { notIn: ['CLOSED', 'REJECTED'] } 
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

         <Link href="/dashboard/customers?tab=ongoing" style={{ textDecoration: 'none' }}>
           <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', background: 'var(--surface-color)', border: '1px solid var(--border-color)', transition: 'all 0.2s' }}>
             <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '16px', borderRadius: '50%' }}>
               <Navigation size={24} color="#3B82F6" />
             </div>
             <div>
               <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-color)' }}>Ongoing Pipelines</h3>
               <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>Jump directly back into operations</p>
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
                    <Link href={`/dashboard/customers/${lead.id}`} style={{ padding: '6px 12px', background: 'var(--surface-hover)', borderRadius: '6px', color: 'var(--text-color)', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
                      Open
                    </Link>
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
