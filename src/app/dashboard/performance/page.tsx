import { prisma } from '@/lib/prisma'
import { Target, Users, Clock, ShieldCheck, User, CheckCircle } from 'lucide-react'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function PerformanceDashboard() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const session = token ? await decrypt(token) : null

  if (session?.role !== 'MANAGER') {
    redirect('/dashboard')
  }

  // Fetch all Staff mapping historical conversions natively executing payload tracking
  const staffData = await prisma.user.findMany({
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

  // Global KPIs
  let totalAssigned = 0
  let totalConverted = 0
  let totalActive = 0

  const analytics = staffData.map((staff: any) => {
    let converted = 0
    let active = 0
    let validResponseCount = 0
    let responseSum = 0
    const total = staff.assignedCustomers.length

    staff.assignedCustomers.forEach((c: any) => {
      // Net Conversions (Accepted or Closed)
      if (c.status === 'ACCEPTED' || c.status === 'CLOSED') converted++
      // Active Handling Matrix (Processing + Due)
      if (c.status === 'PROCESSING' || c.status === 'DUE') active++
      
      // Response Math
      if (c.responseTime !== null) {
        responseSum += c.responseTime
        validResponseCount++
      }
    })

    const avgResponseTime = validResponseCount > 0 ? Math.round(responseSum / validResponseCount) : null

    totalAssigned += total
    totalConverted += converted
    totalActive += active

    return { ...staff, total, converted, active, avgResponseTime }
  }).sort((a: any, b: any) => b.converted - a.converted) // Map highest converters primarily

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', margin: 0 }}>Staff Performance Analytics</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Monitor efficiency, track average response delays, and locate Top-Tier Conversion Staff organically.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '16px', borderRadius: 'var(--border-radius-md)' }}>
            <Users size={28} color="#3B82F6" />
          </div>
          <div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>Lifetime Assigned Leads</p>
            <h2 style={{ margin: 0, fontSize: '28px' }}>{totalAssigned}</h2>
          </div>
        </div>
        
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: 'var(--border-radius-md)' }}>
            <Target size={28} color="var(--status-accepted)" />
          </div>
          <div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>Global Physical Conversions</p>
            <h2 style={{ margin: 0, fontSize: '28px' }}>{totalConverted}</h2>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Field Agent</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>Total Leads</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>Converted Leads</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>Active Leads</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>Avg Response Time</th>
            </tr>
          </thead>
          <tbody>
            {analytics.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No active staff detected inside the sales engine.
                </td>
              </tr>
            ) : (
              analytics.map((staff: any) => (
                <tr key={staff.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--surface-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
                      <User size={18} color="var(--text-secondary)" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{staff.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{staff.email}</div>
                    </div>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center', fontWeight: 700, fontSize: '16px' }}>
                    {staff.total}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                     <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', padding: '4px 12px', borderRadius: '12px', fontWeight: 600 }}>
                       {staff.converted} Converted
                     </span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                     <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', padding: '4px 12px', borderRadius: '12px', fontWeight: 600 }}>
                       {staff.active} Active
                     </span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center', fontWeight: 600 }}>
                    {staff.avgResponseTime === null ? (
                      <span style={{ color: 'var(--text-secondary)' }}>N/A</span>
                    ) : staff.avgResponseTime < 5 ? (
                      <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><Clock size={16}/> {staff.avgResponseTime} min</span>
                    ) : staff.avgResponseTime < 15 ? (
                      <span style={{ color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><Clock size={16}/> {staff.avgResponseTime} min</span>
                    ) : (
                      <span style={{ color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><Clock size={16}/> {staff.avgResponseTime} min</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
