import { prisma } from '@/lib/prisma'
import { Plus, Search, FileSpreadsheet, Phone, MapPin, User, ChevronLeft, ChevronRight } from 'lucide-react'
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
import { Target } from 'lucide-react'

export const dynamic = 'force-dynamic'

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

  const [waitingLeads, followUpLeads, rejectedLeads] = await Promise.all([
    prisma.customer.findMany({
      where: { assignedToId: String(session?.id), status: 'WAITING' },
      orderBy: { createdAt: 'desc' },
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '1200px', overflowY: 'auto', paddingRight: '4px' }}>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '1200px', overflowY: 'auto', paddingRight: '4px' }}>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '1200px', overflowY: 'auto', paddingRight: '4px' }}>
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
