import { prisma } from '@/lib/prisma'
import { Activity, Target, Clock, TrendingUp, CheckCircle, User, Award } from 'lucide-react'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AnalyticsDashboard() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const session = token ? await decrypt(token) : null

  // Restrict access: Manager & Salesman have full visibility
  if (session?.role !== 'MANAGER' && session?.role !== 'SALESMAN') {
    redirect('/dashboard')
  }

  // Parallelize metrics fetching to eliminate the "DB Waterfall"
  const [totalLeads, statusCounts, contactedLeads, staffData] = await Promise.all([
    prisma.customer.count(),
    prisma.customer.groupBy({
      by: ['status'],
      _count: { status: true }
    }),
    prisma.customer.findMany({
      where: {
        assignedAt: { not: null },
        firstContactAt: { not: null }
      },
      select: { assignedAt: true, firstContactAt: true }
    }),
    prisma.user.findMany({
      where: { role: 'STAFF' },
      select: {
        id: true,
        name: true,
        email: true,
        assignedCustomers: {
          select: { status: true, responseTime: true }
        }
      },
      orderBy: { name: 'asc' }
    })
  ])

  // Conversion Map
  const metrics = {
    WAITING: 0,
    PROCESSING: 0,
    ACCEPTED: 0,
    VERIFIED: 0,
    CLOSED: 0,
    REJECTED: 0,
    DUE: 0,
    FOLLOW_UP: 0,
    CLOSE_REQUESTED: 0
  }
  
  statusCounts.forEach(stat => {
    metrics[stat.status as keyof typeof metrics] = stat._count.status
  })

  let avgResponseMinutes = 0
  if (contactedLeads.length > 0) {
    const totalDiff = contactedLeads.reduce((acc, lead) => {
      const diff = new Date(lead.firstContactAt!).getTime() - new Date(lead.assignedAt!).getTime()
      return acc + (diff > 0 ? diff : 0) // Guard against negative diffs
    }, 0)
    avgResponseMinutes = Math.round((totalDiff / contactedLeads.length) / 60000)
  }

  // Process Staff Analytics locally
  const staffAnalytics = staffData.map((staff: any) => {
    let converted = 0
    let active = 0
    let validResponseCount = 0
    let responseSum = 0
    const total = staff.assignedCustomers.length

    staff.assignedCustomers.forEach((c: any) => {
      if (c.status === 'ACCEPTED' || c.status === 'CLOSED' || c.status === 'VERIFIED') converted++
      if (c.status === 'PROCESSING' || c.status === 'DUE') active++
      if (c.responseTime !== null) {
        responseSum += c.responseTime
        validResponseCount++
      }
    })

    const avgResponse = validResponseCount > 0 ? Math.round(responseSum / validResponseCount) : null
    return { ...staff, total, converted, active, avgResponse }
  }).sort((a: any, b: any) => b.converted - a.converted)

  return (
    <div className="fade-in max-w-4xl mx-auto">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <TrendingUp size={36} color="var(--primary-color)" />
          Business Growth Dashboard
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '15px' }}>
          Track your lead conversion progress and staff calling speed across the branch.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        {/* KPI 1 */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '16px', borderRadius: '50%' }}>
            <Target size={28} color="#3B82F6" />
          </div>
          <div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600, textTransform: 'uppercase' }}>Total Facebook Leads</p>
            <h2 style={{ margin: 0, fontSize: '32px', fontWeight: 700 }}>{totalLeads}</h2>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '16px', borderRadius: '50%' }}>
            <Clock size={28} color="#F59E0B" />
          </div>
          <div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600, textTransform: 'uppercase' }}>Staff Calling Speed</p>
            <h2 style={{ margin: 0, fontSize: '32px', fontWeight: 700 }}>{avgResponseMinutes} <span style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>min</span></h2>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: '50%' }}>
            <CheckCircle size={28} color="#10B981" />
          </div>
          <div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600, textTransform: 'uppercase' }}>Loans Fully Disbursed</p>
            <h2 style={{ margin: 0, fontSize: '32px', fontWeight: 700 }}>{metrics.CLOSED}</h2>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
        {/* Journey Progress */}
        <div className="card">
           <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px' }}>
             <Activity size={20} color="var(--primary-color)" /> Loan Journey Progress
           </h3>

           <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <PipelineRow label="1. New Leads (To be Called)" count={metrics.WAITING} total={totalLeads} color="#F59E0B" />
              <PipelineRow label="2. Follow-up / In Progress" count={metrics.FOLLOW_UP + metrics.PROCESSING} total={totalLeads} color="#3B82F6" />
              <PipelineRow label="3. Successfully Verified" count={metrics.ACCEPTED + metrics.VERIFIED} total={totalLeads} color="#6366F1" />
              <PipelineRow label="4. Loan Disbursed & Closed" count={metrics.CLOSED} total={totalLeads} color="#10B981" />
              <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <PipelineRow label="Rejected or Lost" count={metrics.REJECTED} total={totalLeads} color="#EF4444" />
              </div>
           </div>
        </div>

        {/* Staff Efficiency Table */}
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
             <Award size={20} color="var(--primary-color)" />
             <h3 style={{ margin: 0, fontSize: '18px' }}>Staff Performance Leaderboard</h3>
          </div>
          <div className="table-container">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '13px' }}>Agent</th>
                  <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center' }}>Total</th>
                  <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center' }}>Success</th>
                  <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center' }}>Speed</th>
                </tr>
              </thead>
              <tbody>
                {staffAnalytics.map((staff: any) => (
                  <tr key={staff.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <User size={16} color="var(--text-secondary)" />
                        </div>
                        <div style={{ fontWeight: 600, fontSize: '14px' }}>{staff.name}</div>
                      </div>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center', fontWeight: 600 }}>{staff.total}</td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                       <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', padding: '4px 8px', borderRadius: '8px', fontSize: '12px', fontWeight: 700 }}>
                         {staff.converted} Done
                       </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      {staff.avgResponse === null ? '--' : `${staff.avgResponse}m`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function PipelineRow({ label, count, total, color }: { label: string, count: number, total: number, color: string }) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 60px', alignItems: 'center', gap: '16px' }}>
      <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-secondary)' }}>{label}</span>
      <div style={{ width: '100%', height: '12px', background: 'var(--surface-hover)', borderRadius: '6px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${percentage}%`, background: color, transition: 'width 1s ease-out', borderRadius: '6px' }} />
      </div>
      <span style={{ fontWeight: 700, fontSize: '14px', textAlign: 'right' }}>{count}</span>
    </div>
  )
}
