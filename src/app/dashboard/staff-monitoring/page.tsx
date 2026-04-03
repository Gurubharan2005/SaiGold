import { prisma } from '@/lib/prisma'
import { User, Activity, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'
import DashRealtimeSync from '@/components/DashRealtimeSync'

export const dynamic = 'force-dynamic'

export default async function StaffMonitoringPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const session = token ? await decrypt(token) : null

  // Extracted outside render to avoid "impure function in render" lint error
  const now = Date.now()
  const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000)

  if (session?.role !== 'MANAGER') {
    return <div className="p-8 text-center text-zinc-500">Access Denied</div>
  }

  // Fetch all Staff members with productivity stats
  const staffData = await prisma.user.findMany({
    where: { role: 'STAFF', isActive: true },
    include: {
      assignedCustomers: {
        select: {
          id: true,
          name: true,
          status: true,
          callStatus: true,
          updatedAt: true
        }
      }
    },
    orderBy: { name: 'asc' }
  })

  // Process data for productivity
  const staffMembers = staffData.map(staff => {
    return {
      ...staff,
      activeLoad: staff.assignedCustomers.filter(c => ['PROCESSING', 'ACCEPTED', 'DUE', 'FOLLOW_UP'].includes(c.status)),
      stats: {
        called: staff.assignedCustomers.filter(c => c.callStatus === 'CALLED').length,
        confirmed: staff.assignedCustomers.filter(c => c.status === 'VERIFIED').length,
        maintained: staff.assignedCustomers.filter(c => c.status === 'MAINTENANCE').length,
      }
    }
  })

  // Fetch Recent Activity (Modified customers in last 24h)
  const recentActivities = await prisma.customer.findMany({
    where: { 
      updatedAt: { gte: oneDayAgo },
      assignedTo: { isNot: null }
    },
    include: { assignedTo: { select: { name: true } } },
    orderBy: { updatedAt: 'desc' },
    take: 15
  })

  return (
    <div className="fade-in">
      <DashRealtimeSync intervalMs={5000} />
      
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Activity size={32} color="var(--primary-color)" />
          Branch Staff Monitor
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
          Real-time view of who is online and which customers they are currently helping.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        
        {/* Staff Operations Grid */}
        <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h2 style={{ fontSize: '18px', margin: 0, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Branch Team members</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {staffMembers.map((staff) => {
              // Now strictly checks if staff pinged within the last 2 minutes for high-accuracy liveness
              const isOnline = staff.locationUpdatedAt && (now - new Date(staff.locationUpdatedAt).getTime() < 2 * 60 * 1000)
              
              return (
                <div key={staff.id} className="card" style={{ padding: '0', overflow: 'hidden' }}>
                  <div style={{ padding: '16px', background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--surface-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
                        <User size={16} color="var(--text-secondary)" />
                      </div>
                      <span style={{ fontWeight: 700 }}>{staff.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isOnline ? '#10B981' : '#6B7280' }} />
                      <span style={{ fontSize: '11px', fontWeight: 600, color: isOnline ? '#10B981' : 'var(--text-secondary)' }}>
                        {isOnline ? 'Active' : 'Offline'}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ padding: '16px' }}>
                    <div style={{ marginBottom: '16px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                       <div style={{ textAlign: 'center', padding: '8px', background: 'rgba(255,193,7,0.1)', borderRadius: '8px', border: '1px solid rgba(255,193,7,0.2)' }}>
                          <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600 }}>CALLED</div>
                          <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--primary-color)' }}>{staff.stats.called}</div>
                       </div>
                       <div style={{ textAlign: 'center', padding: '8px', background: 'rgba(16,185,129,0.1)', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.2)' }}>
                          <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600 }}>CONFIRMED</div>
                          <div style={{ fontSize: '16px', fontWeight: 800, color: '#10B981' }}>{staff.stats.confirmed}</div>
                       </div>
                       <div style={{ textAlign: 'center', padding: '8px', background: 'rgba(59,130,246,0.1)', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.2)' }}>
                          <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600 }}>MAINTAINED</div>
                          <div style={{ fontSize: '16px', fontWeight: 800, color: '#3B82F6' }}>{staff.stats.maintained}</div>
                       </div>
                    </div>

                    <div style={{ marginBottom: '12px', fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Current Active Load:</span>
                      <span className="badge badge-waiting">{staff.activeLoad.length} Leads</span>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {staff.activeLoad.slice(0, 3).map(c => (
                        <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-color)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 600 }}>{c.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{c.status}</div>
                          </div>
                          <Link href={`/dashboard/customers/${c.id}`} style={{ color: 'var(--primary-color)' }}>
                            <ArrowUpRight size={14} />
                          </Link>
                        </div>
                      ))}
                      {staff.activeLoad.length > 3 && (
                        <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-secondary)', paddingTop: '4px' }}>
                          + {staff.activeLoad.length - 3} more active leads
                        </div>
                      )}
                      {staff.activeLoad.length === 0 && (
                        <div style={{ color: 'var(--text-secondary)', fontSize: '13px', fontStyle: 'italic', padding: '8px' }}>
                          No active assignments currently.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Live Activity Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h2 style={{ fontSize: '18px', margin: 0, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Live Action Feed</h2>
          
          <div className="card" style={{ padding: '0', flex: 1, minHeight: '600px' }}>
             <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', fontWeight: 700, fontSize: '14px', background: 'rgba(16, 185, 129, 0.05)', color: '#10B981', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={16} /> Latest Staff Updates
             </div>
             
             <div style={{ padding: '0' }}>
                {recentActivities.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>No recent updates detected.</div>
                ) : (
                  recentActivities.map((activity, idx) => (
                    <div key={activity.id} style={{ padding: '16px', borderBottom: idx === recentActivities.length - 1 ? 'none' : '1px solid var(--border-color)', position: 'relative' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700 }}>{activity.assignedTo?.name || 'System'}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{formatDistanceToNow(new Date(activity.updatedAt))} ago</span>
                       </div>
                       <div style={{ fontSize: '14px' }}>
                          Updated <strong style={{ color: 'var(--primary-color)' }}>{activity.name}</strong> 
                       </div>
                       <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                          <span className={`badge badge-${activity.status.toLowerCase()}`} style={{ fontSize: '10px', padding: '2px 6px' }}>{activity.status}</span>
                          {activity.loanAmount && <span style={{ fontSize: '10px', fontWeight: 600 }}>₹{activity.loanAmount.toLocaleString()}</span>}
                       </div>
                    </div>
                  ))
                )}
             </div>
          </div>
        </div>

      </div>
    </div>
  )
}
