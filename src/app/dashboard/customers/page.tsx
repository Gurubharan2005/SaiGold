import { prisma } from '@/lib/prisma'
import { Plus, Search, FileSpreadsheet, Phone, MapPin, User, ChevronLeft, ChevronRight, Activity } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'
import OngoingQuickUpdate from '@/components/OngoingQuickUpdate'
import SearchInput from '@/components/SearchInput'
import RequestClosureButton from '@/components/RequestClosureButton'
import DashRealtimeSync from '@/components/DashRealtimeSync'
import CompactSalesToolbar from '@/components/CompactSalesToolbar'
import PipelineCard from '@/components/PipelineCard'
import PipelineMobileSwitcher from '@/components/PipelineMobileSwitcher'
import { Target } from 'lucide-react'

export const revalidate = 15

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ tab?: string, q?: string, search?: string, page?: string }> }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const session = token ? await decrypt(token) : null
  const { tab, q, search, page } = await searchParams
  const currentTab = tab || 'waiting'
  
  // Backwards compatibility for the quick-search input component
  const activeQuery = search || q || ''
  
  // Pagination Definitions
  const PAGE_SIZE = 15
  const currentPage = parseInt(page || '1', 10)

  // Contextual Security & Organization
  const baseWhere: any = {}
  
  if (activeQuery) {
    baseWhere.OR = [
      { name: { contains: activeQuery, mode: 'insensitive' } },
      { phone: { contains: activeQuery, mode: 'insensitive' } }
    ]
  }

  const [waitingLeads, followUpLeads, rejectedLeads, convertedLeads] = await Promise.all([
    prisma.customer.findMany({
      where: { 
        assignedToId: String(session?.id), 
        status: 'WAITING',
        ...(activeQuery ? {
          OR: [
            { name: { contains: activeQuery, mode: 'insensitive' } },
            { phone: { contains: activeQuery, mode: 'insensitive' } }
          ]
        } : {})
      },
      take: 40,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, phone: true, status: true, lastCalledAt: true }
    }),
    prisma.customer.findMany({
      where: { 
        assignedToId: String(session?.id), 
        status: 'FOLLOW_UP',
        ...(activeQuery ? {
          OR: [
            { name: { contains: activeQuery, mode: 'insensitive' } },
            { phone: { contains: activeQuery, mode: 'insensitive' } }
          ]
        } : {})
      },
      take: 40,
      orderBy: { updatedAt: 'desc' },
      select: { id: true, name: true, phone: true, status: true, lastCalledAt: true }
    }),
    prisma.customer.findMany({
      where: { 
        assignedToId: String(session?.id), 
        status: 'REJECTED',
        ...(activeQuery ? {
          OR: [
            { name: { contains: activeQuery, mode: 'insensitive' } },
            { phone: { contains: activeQuery, mode: 'insensitive' } }
          ]
        } : {})
      },
      take: 40,
      orderBy: { updatedAt: 'desc' },
      select: { id: true, name: true, phone: true, status: true, lastCalledAt: true }
    }),
    prisma.customer.findMany({
      where: { 
        assignedToId: String(session?.id), 
        status: { in: ['ACCEPTED', 'VERIFIED', 'DUE'] },
        ...(activeQuery ? {
          OR: [
            { name: { contains: activeQuery, mode: 'insensitive' } },
            { phone: { contains: activeQuery, mode: 'insensitive' } }
          ]
        } : {})
      },
      take: 40,
      orderBy: { updatedAt: 'desc' },
      select: { id: true, name: true, phone: true, status: true, loanAmount: true, goldWeight: true }
    })
  ])

  return (
    <div className="fade-in">
      <DashRealtimeSync intervalMs={10000} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <h1 style={{ fontSize: '28px', margin: 0, textTransform: 'capitalize' }}>
            Dashboard
          </h1>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', zIndex: 10 }}>
          {session?.role === 'MANAGER' && (
            <>
              <a href="/api/export" className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', textDecoration: 'none', color: 'var(--text-color)' }}>
                <FileSpreadsheet size={18} /> Export
              </a>
              <Link href="/dashboard/customers/new" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', textDecoration: 'none' }}>
                <Plus size={18} /> New 
              </Link>
            </>
          )}
        </div>
      </div>

      {/* ACTIVE LEADS PIPELINE (HIGH-DENSITY MOBILE-READY SECTION) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
           <Target size={22} color="var(--primary-color)" /> Active Leads Pipeline
        </h2>

        <PipelineMobileSwitcher 
          waitingLeads={waitingLeads} 
          followUpLeads={followUpLeads} 
          rejectedLeads={rejectedLeads} 
        />
      </div>

      {/* CONVERTED LOANS & ACTIVE ACCOUNTS (FINAL STAGE) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '64px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
           <Activity size={22} color="#10B981" /> Converted Loans & Active Accounts
        </h2>

        <div className="card" style={{ padding: 0, borderRadius: '16px' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--surface-hover)', borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}>
            <span className="badge badge-accepted" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', padding: '6px 12px' }}>
              {convertedLeads.length} Active Loans
            </span>
          </div>
          
          {/* DESKTOP TABLE VIEW */}
          <div className="table-container desktop-only">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--surface-color)' }}>
                  <th style={{ padding: '16px', fontWeight: 700, fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Customer</th>
                  <th style={{ padding: '16px', fontWeight: 700, fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Loan Details</th>
                  <th style={{ padding: '16px', fontWeight: 700, fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '16px', fontWeight: 700, fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {convertedLeads.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>No converted loans yet.</td>
                  </tr>
                ) : (
                  convertedLeads.map((c: any) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: 700, fontSize: '15px' }}>{c.name}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{c.phone}</div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: 800, color: 'var(--primary-color)' }}>₹{c.loanAmount?.toLocaleString()}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{c.goldWeight}g Gold</div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span className={`badge badge-${c.status.toLowerCase()}`}>{c.status}</span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <Link href={`/dashboard/customers/${c.id}`} style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 800, fontSize: '13px' }}>
                          View Account &rarr;
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARD VIEW */}
          <div className="mobile-only" style={{ display: 'none' }}>
            {convertedLeads.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-secondary)' }}>No active loans.</div>
            ) : (
              convertedLeads.map((c: any) => (
                <div key={c.id} style={{ padding: '20px', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '16px' }}>{c.name}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{c.phone}</div>
                    </div>
                    <span className={`badge badge-${c.status.toLowerCase()}`}>{c.status}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--surface-hover)', padding: '12px', borderRadius: '8px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Loan Amount</div>
                      <div style={{ fontWeight: 800, color: 'var(--primary-color)' }}>₹{c.loanAmount?.toLocaleString()}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Gold Weight</div>
                      <div style={{ fontWeight: 800 }}>{c.goldWeight}g</div>
                    </div>
                  </div>
                  <Link href={`/dashboard/customers/${c.id}`} style={{ display: 'block', textAlign: 'center', marginTop: '16px', color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 800, fontSize: '14px', padding: '12px', background: 'rgba(255,193,7,0.05)', borderRadius: '8px' }}>
                    View Profile & Master Form
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
