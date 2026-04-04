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

export const dynamic = 'force-dynamic'

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ tab?: string, q?: string, search?: string, page?: string }> }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const session = token ? await decrypt(token) : null
  const { tab, q, search, page } = await searchParams
  const currentTab = tab || 'called'
  
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

  // TAB FILTERING LOGIC
  if (currentTab === 'called') {
    baseWhere.callStatus = 'CALLED'
    // Include Processing, Accepted, and Rejected in the main Called view
    baseWhere.status = { 
      in: ['PROCESSING', 'ACCEPTED', 'REJECTED'] 
    }
  } else if (currentTab === 'waiting') {
    baseWhere.status = 'WAITING'
    baseWhere.callStatus = { not: 'CALLED' }
  } else if (currentTab === 'followup') {
    baseWhere.status = 'FOLLOW_UP'
  } else if (currentTab === 'rejected') {
    baseWhere.status = 'REJECTED'
  }

  if (session?.role !== 'MANAGER') {
     // Staff/Salesman/Maintenance only see their assigned leads
     const userFilter = [
       { createdById: String(session?.id) },
       { assignedToId: String(session?.id) },
       { verifiedById: String(session?.id) }
     ]
     if (baseWhere.OR) {
        baseWhere.AND = [
          { OR: baseWhere.OR },
          { OR: userFilter }
        ]
        delete baseWhere.OR
     } else {
        baseWhere.OR = userFilter
     }
  }

  // Fetch paginated constraints securely
  const [totalRecords, customers] = await Promise.all([
    prisma.customer.count({ where: baseWhere }),
    prisma.customer.findMany({
      where: baseWhere,
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE,
      skip: (currentPage - 1) * PAGE_SIZE,
    })
  ])

  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE))

  return (
    <div className="fade-in">
      <DashRealtimeSync intervalMs={10000} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <h1 style={{ fontSize: '28px', margin: 0, textTransform: 'capitalize' }}>
            {currentTab} Customers
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

      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '24px', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }} className="no-scrollbar">
        {[
          { id: 'waiting', label: 'Not Attended', count: 0 },
          { id: 'called', label: 'Called Leads', count: 0 },
          { id: 'followup', label: 'Follow-Ups', count: 0 },
          { id: 'rejected', label: 'Rejected', count: 0 }
        ].map(t => (
          <Link 
            key={t.id}
            href={`/dashboard/customers?tab=${t.id}`}
            style={{ 
              padding: '12px 20px', 
              textDecoration: 'none', 
              color: currentTab === t.id ? 'var(--primary-color)' : 'var(--text-secondary)',
              borderBottom: currentTab === t.id ? '3px solid var(--primary-color)' : '3px solid transparent',
              fontWeight: currentTab === t.id ? 800 : 500,
              fontSize: '14px',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {/* Simple Toolbar */}
        <div style={{ padding: '16px', display: 'flex', gap: '16px', borderBottom: '1px solid var(--border-color)', background: 'var(--surface-color)', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <SearchInput placeholder="Search name or phone..." />
          </div>
          
            <select style={{ height: '40px', padding: '0 16px', minWidth: '160px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-color)' }}>
              <option value="">All Statuses</option>
              <option value="PROCESSING">Processing</option>
              <option value="WAITING">Waiting</option>
              <option value="REJECTED">Rejected</option>
            </select>
        </div>

        {/* Datatable - Hidden on Mobile */}
        <div className="table-container desktop-only">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
          <thead>
            <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Lead Information</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)', width: '100px' }}>Status</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Sales Workbench</th>
              <th className="hide-mobile" style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Created At</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                 <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No customers found for this criteria.
                </td>
              </tr>
            ) : (
              customers.map((c: any) => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }} className="hover-opacity">
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--surface-color)', overflow: 'hidden', border: '1px solid var(--border-color)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {c.photoUrl ? (
                           <img 
                             src={`/api/avatar?url=${encodeURIComponent(c.photoUrl)}`} 
                             alt="Profile" 
                             style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                           />
                        ) : (
                           <User size={20} color="var(--text-secondary)" />
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '15px' }}>{c.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                          <Phone size={12} /> {c.phone}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span className={`badge badge-${c.status.toLowerCase()}`} style={{ fontSize: '10px' }}>{c.status}</span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <CompactSalesToolbar 
                      customerId={c.id} 
                      customerName={c.name} 
                      phone={c.phone} 
                      currentStatus={c.status}
                      showConvert={true}
                    />
                  </td>
                  <td className="hide-mobile" style={{ padding: '16px', fontSize: '14px' }}>
                    <div style={{ color: 'var(--text-secondary)' }}>{format(new Date(c.createdAt), 'MMM dd, yyyy')}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', opacity: 0.7 }}>{format(new Date(c.createdAt), 'hh:mm a')}</div>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <Link href={`/dashboard/customers/${c.id}?from=${currentTab}`} style={{ 
                      color: 'var(--primary-color)', 
                      textDecoration: 'none', 
                      fontSize: '13px', 
                      fontWeight: 700,
                      padding: '8px 12px',
                      background: 'rgba(255,193,7,0.05)',
                      borderRadius: '8px'
                    }}>
                      Profile &rarr;
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>

        {/* Mobile View - Card List */}
        <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column' }}>
          {customers.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>No customers found.</div>
          ) : (
            customers.map((c: any) => (
              <div key={c.id} className="mobile-card" style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--surface-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
                      {c.photoUrl ? (
                         <img 
                           src={`/api/avatar?url=${encodeURIComponent(c.photoUrl)}`} 
                           alt="Profile" 
                           style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
                         />
                      ) : (
                        <User size={20} color="var(--text-secondary)" />
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '16px' }}>{c.name}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <Phone size={12} /> {c.phone}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                     <span className={`badge badge-${c.status.toLowerCase()}`}>{c.status}</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: 'var(--surface-hover)', padding: '12px', borderRadius: '8px', gap: '12px' }}>
                   <div>
                     <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '2px' }}>
                        {currentTab === 'ongoing' ? 'Due Date' : 'Loan Amount'}
                     </div>
                     <div style={{ fontWeight: 700, color: currentTab === 'ongoing' ? 'var(--status-rejected)' : 'var(--primary-color)' }}>
                        {currentTab === 'ongoing' 
                          ? (c.dueDate ? format(new Date(c.dueDate), 'MMM dd') : 'N/A')
                          : (c.loanAmount ? `₹${c.loanAmount.toLocaleString()}` : '-')}
                     </div>
                   </div>
                   <div>
                     <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '2px' }}>
                        {currentTab === 'ongoing' ? 'Amount Due' : 'Gold Weight'}
                     </div>
                     <div style={{ fontWeight: 700 }}>
                         {c.status === 'REJECTED' ? 'REJECTED' : (c.goldWeight ? `${c.goldWeight}g` : '-')}
                      </div>
                    </div>
                   {currentTab === 'ongoing' && (
                     <div style={{ gridColumn: 'span 2' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '2px' }}>Remainder</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontStyle: 'italic' }}>{c.notes || 'No notes'}</div>
                     </div>
                   )}
                </div>

                <div style={{ overflowX: 'auto', paddingBottom: '4px' }} className="no-scrollbar">
                   <CompactSalesToolbar 
                     customerId={c.id} 
                     customerName={c.name} 
                     phone={c.phone} 
                     currentStatus={c.status}
                     showConvert={true}
                   />
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <Link href={`/dashboard/customers/${c.id}?from=${currentTab}`} className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 0', textDecoration: 'none', fontSize: '14px', borderRadius: '8px', fontWeight: 700 }}>
                    Full Profile →
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Global Pagination Overlay */}
        {totalPages > 1 && (
          <div style={{ 
            padding: '16px 24px', 
            borderTop: '1px solid var(--border-color)', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            background: 'var(--surface-color)',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500 }}>
              Showing {totalRecords === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1} to {Math.min(currentPage * PAGE_SIZE, totalRecords)} of {totalRecords} Records
            </span>
            <div style={{ display: 'flex', gap: '12px' }}>
              {currentPage > 1 ? (
                <Link 
                  href={`/dashboard/customers?tab=${currentTab}${activeQuery ? `&search=${encodeURIComponent(activeQuery)}` : ''}&page=${currentPage - 1}`} 
                  className="btn-secondary" 
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', textDecoration: 'none' }}
                >
                  <ChevronLeft size={16} /> Previous
                </Link>
              ) : (
                <button disabled className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', opacity: 0.5, cursor: 'not-allowed' }}>
                  <ChevronLeft size={16} /> Previous
                </button>
              )}
              
              {currentPage < totalPages ? (
                 <Link 
                   href={`/dashboard/customers?tab=${currentTab}${activeQuery ? `&search=${encodeURIComponent(activeQuery)}` : ''}&page=${currentPage + 1}`} 
                   className="btn-primary" 
                   style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', textDecoration: 'none' }}
                 >
                   Next <ChevronRight size={16} />
                 </Link>
               ) : (
                 <button disabled className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', opacity: 0.5, cursor: 'not-allowed' }}>
                   Next <ChevronRight size={16} />
                 </button>
               )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
