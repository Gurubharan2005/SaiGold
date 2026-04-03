import { ShieldCheck, User, ArrowRight, Clock, CheckCircle } from 'lucide-react'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function SalesVerificationDesk() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const session = token ? await decrypt(token) : null

  // Fetch Actionable Queues
  const [pendingLeads, historicalLeads] = await Promise.all([
    // 1. Pending Verification: Marked by staff, waiting for salesman
    prisma.customer.findMany({
      where: { status: 'VERIFIED' },
      orderBy: { updatedAt: 'desc' },
      include: { createdBy: true }
    }),
    // 2. History: Already approved by salesman (or sent back to staff)
    prisma.customer.findMany({
      where: { 
        OR: [
          { status: 'MAINTENANCE' },
          { status: 'ACCEPTED' } // In case they were already accepted
        ],
        verifiedById: String(session?.id) 
      },
      orderBy: { verifiedAt: 'desc' },
      take: 20, // Keep the history tidy
      include: { createdBy: true }
    })
  ])

  return (
    <div className="fade-in max-w-6xl">
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', margin: 0, display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 800 }}>
            <ShieldCheck size={32} color="var(--primary-color)" />
            Sales Verification Workbench
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '14px' }}>
            Verify lead documentation and handoff to the Maintenance Desk.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
        
        {/* SECTION A: PENDING VERIFICATION */}
        <div className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--primary-color)' }}>
          <div style={{ background: 'rgba(255, 193, 7, 0.1)', padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Clock size={20} color="var(--status-waiting)" />
            <h2 style={{ fontSize: '18px', margin: 0, fontWeight: 700 }}>Pending Verification ({pendingLeads.length})</h2>
          </div>
          
          <div className="table-container">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)', background: 'var(--surface-hover)' }}>
                  <th style={{ padding: '14px 24px', fontSize: '13px', color: 'var(--text-secondary)' }}>Customer</th>
                  <th style={{ padding: '14px 24px', fontSize: '13px', color: 'var(--text-secondary)' }}>Lead Prepared By</th>
                  <th style={{ padding: '14px 24px', fontSize: '13px', color: 'var(--text-secondary)' }}>Ready Since</th>
                  <th style={{ padding: '14px 24px', fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingLeads.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      All caught up! No leads are currently waiting for verification.
                    </td>
                  </tr>
                ) : (
                  pendingLeads.map((c) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }} className="hover-opacity">
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ fontWeight: 700 }}>{c.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{c.phone}</div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                            <User size={14} color="var(--primary-color)" /> {c.createdBy?.name || 'Automated'}
                         </div>
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {format(new Date(c.updatedAt), 'MMM dd, HH:mm')}
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                        <Link 
                          href={`/dashboard/customers/${c.id}`} 
                          className="btn-primary" 
                          style={{ padding: '6px 14px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
                        >
                           Review <ArrowRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION B: VERIFICATION HISTORY */}
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CheckCircle size={20} color="#10B981" />
            <h2 style={{ fontSize: '18px', margin: 0, fontWeight: 700 }}>Recently Verified (History)</h2>
          </div>
          
          <div className="table-container">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)', background: 'var(--surface-hover)' }}>
                  <th style={{ padding: '14px 24px', fontSize: '13px', color: 'var(--text-secondary)' }}>Customer</th>
                  <th style={{ padding: '14px 24px', fontSize: '13px', color: 'var(--text-secondary)' }}>Status</th>
                  <th style={{ padding: '14px 24px', fontSize: '13px', color: 'var(--text-secondary)' }}>Approved At</th>
                  <th style={{ padding: '14px 24px', fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'right' }}>Audit</th>
                </tr>
              </thead>
              <tbody>
                {historicalLeads.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No history found. Approved leads will appear here.
                    </td>
                  </tr>
                ) : (
                  historicalLeads.map((c) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ fontWeight: 600 }}>{c.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{c.phone}</div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                         <span className={`badge badge-${c.status.toLowerCase()}`} style={{ fontSize: '11px' }}>{c.status}</span>
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {c.verifiedAt ? format(new Date(c.verifiedAt), 'MMM dd, HH:mm') : '-'}
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                        <Link 
                          href={`/dashboard/customers/${c.id}`} 
                          style={{ fontSize: '13px', color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 600 }}
                        >
                           View Profile
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
