import { prisma } from '@/lib/prisma'
import { Plus, Search, FileSpreadsheet, Phone, MapPin, User } from 'lucide-react'
import Link from 'next/link'
import { format, startOfDay, endOfDay } from 'date-fns'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'
import OngoingQuickUpdate from '@/components/OngoingQuickUpdate'
import SearchInput from '@/components/SearchInput'
import RequestClosureButton from '@/components/RequestClosureButton'
import DashRealtimeSync from '@/components/DashRealtimeSync'

export const dynamic = 'force-dynamic'

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ tab?: string, q?: string }> }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const session = token ? await decrypt(token) : null
  const { tab, q } = await searchParams
  const currentTab = tab || 'today'

  // Contextual Security & Organization
  const baseWhere: any = {}
  
  if (q) {
    baseWhere.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { phone: { contains: q, mode: 'insensitive' } }
    ]
  }

  if (currentTab === 'today') {
    if (session?.role === 'MANAGER') {
       // Managers see global leads created today
       baseWhere.createdAt = {
         gte: startOfDay(new Date()),
         lte: endOfDay(new Date())
       }
    } else {
       // Staff specifically see inbound leads assigned to them by manager (WAITING)
       baseWhere.assignedToId = String(session?.id)
       baseWhere.status = 'WAITING'
    }
  } else if (currentTab === 'ongoing') {
    baseWhere.status = { in: ['ACCEPTED', 'DUE'] }
    if (session?.role !== 'MANAGER') {
       baseWhere.OR = [
         { createdById: String(session?.id) },
         { assignedToId: String(session?.id) },
         { verifiedById: String(session?.id) }
       ]
    }
  }

  const customers = await prisma.customer.findMany({
    where: baseWhere,
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="fade-in">
      <DashRealtimeSync intervalMs={10000} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <h1 style={{ fontSize: '28px', margin: 0 }}>
            {currentTab === 'ongoing' ? 'Ongoing Customers' : 'Today\'s Customers'}
          </h1>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', zIndex: 10 }}>
          {session?.role === 'MANAGER' && (
            <a href="/api/export" className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', textDecoration: 'none', color: 'var(--text-color)' }}>
              <FileSpreadsheet size={18} /> Export
            </a>
          )}
          <Link href="/dashboard/customers/new" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', textDecoration: 'none' }}>
            <Plus size={18} /> New 
          </Link>
        </div>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {/* Simple Toolbar */}
        <div style={{ padding: '16px', display: 'flex', gap: '16px', borderBottom: '1px solid var(--border-color)', background: 'var(--surface-color)', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <SearchInput placeholder="Search name or phone..." />
          </div>
          
          {currentTab !== 'ongoing' && (
            <select style={{ height: '40px', padding: '0 16px', minWidth: '160px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-color)' }}>
              <option value="">All Statuses</option>
              <option value="PROCESSING">Processing</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="DUE">Due</option>
              <option value="CLOSED">Closed</option>
            </select>
          )}
        </div>

        {/* Datatable - Hidden on Mobile */}
        <div className="table-container desktop-only">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
          <thead>
            <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Customer Data</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Status & Priority</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {currentTab === 'ongoing' ? 'Due Date' : 'Loan Info'}
              </th>
              <th className="hide-mobile" style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {currentTab === 'ongoing' ? 'Amount to be Paid' : 'Creation Date'}
              </th>
              <th className="hide-mobile" style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {currentTab === 'ongoing' ? 'Remainder / Notes' : 'Response Time'}
              </th>
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
                <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}>
                  <td style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--surface-color)', overflow: 'hidden', border: '1px solid var(--border-color)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                      <div style={{ fontWeight: 600, marginBottom: '4px' }}>{c.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        <Phone size={12} /> {c.phone}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
                    <span className={`badge badge-${c.status.toLowerCase()}`}>{c.status}</span>
                    {currentTab !== 'ongoing' && (
                      <span style={{ 
                         fontSize: '11px', fontWeight: 700, padding: '4px 8px', borderRadius: '4px',
                         background: c.priority === 'HIGH' ? 'rgba(239, 68, 68, 0.1)' : c.priority === 'MEDIUM' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                         color: c.priority === 'HIGH' ? '#EF4444' : c.priority === 'MEDIUM' ? '#F59E0B' : '#10B981',
                         textTransform: 'uppercase'
                      }}>
                        {c.priority} 
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '16px' }}>
                    {currentTab === 'ongoing' ? (
                       <div style={{ fontWeight: 600, color: 'var(--status-rejected)' }}>
                         {c.dueDate ? format(new Date(c.dueDate), 'MMM dd, yyyy') : 'No Date Set'}
                       </div>
                    ) : (
                      <>
                        <div style={{ fontWeight: 600, color: 'var(--primary-color)' }}>
                          {c.loanAmount ? `₹${c.loanAmount.toLocaleString()}` : '-'}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                          {c.goldWeight ? `${c.goldWeight}g` : 'No weight listed'}
                        </div>
                      </>
                    )}
                  </td>
                  <td className="hide-mobile" style={{ padding: '16px', fontSize: '14px' }}>
                    {currentTab === 'ongoing' ? (
                       <div style={{ fontWeight: 700, color: 'var(--primary-color)' }}>
                         {c.loanAmount ? `₹${c.loanAmount.toLocaleString()}` : '-'}
                       </div>
                    ) : (
                       <span style={{ color: 'var(--text-secondary)' }}>{format(new Date(c.createdAt), 'MMM dd, yyyy')}</span>
                    )}
                  </td>
                  <td className="hide-mobile" style={{ padding: '16px', fontSize: '13px', minWidth: '150px' }}>
                     {currentTab === 'ongoing' ? (
                       <div style={{ color: 'var(--text-primary)', fontStyle: 'italic', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                         {c.notes || 'No remainder notes'}
                       </div>
                     ) : (
                        c.responseTime === null ? (
                          <span style={{ color: 'var(--text-secondary)' }}>N/A</span>
                        ) : c.responseTime < 5 ? (
                          <span style={{ color: '#10B981', fontWeight: 600 }}>{c.responseTime} min</span>
                        ) : c.responseTime < 15 ? (
                          <span style={{ color: '#F59E0B', fontWeight: 600 }}>{c.responseTime} min</span>
                        ) : (
                          <span style={{ color: '#EF4444', fontWeight: 600 }}>{c.responseTime} min</span>
                        )
                     )}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', alignItems: 'center' }}>
                      <a href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10B981', fontSize: '13px', textDecoration: 'none', background: 'rgba(16, 185, 129, 0.1)', padding: '6px 10px', borderRadius: '4px', fontWeight: 600 }}>
                        WA
                      </a>
                      <a href={`tel:${c.phone}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-color)', fontSize: '13px', textDecoration: 'none', background: 'var(--surface-color)', padding: '6px 12px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                        <Phone size={14} color="var(--primary-color)" /> Call
                      </a>
                      {currentTab === 'ongoing' && (
                        <>
                          <OngoingQuickUpdate 
                            customerId={c.id} 
                            initialAmount={c.loanAmount} 
                            initialDate={c.dueDate} 
                            initialNotes={c.notes}
                          />
                          <RequestClosureButton customerId={c.id} variant="compact" />
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>

        {/* Mobile View - Card List (Straight Format) */}
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
                     {currentTab !== 'ongoing' && (
                       <span style={{ 
                         fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px',
                         background: c.priority === 'HIGH' ? 'rgba(239, 68, 68, 0.1)' : c.priority === 'MEDIUM' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                         color: c.priority === 'HIGH' ? '#EF4444' : c.priority === 'MEDIUM' ? '#F59E0B' : '#10B981',
                         textTransform: 'uppercase'
                       }}>
                         {c.priority} 
                       </span>
                     )}
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
                        {currentTab === 'ongoing' 
                          ? (c.loanAmount ? `₹${c.loanAmount.toLocaleString()}` : '-')
                          : (c.goldWeight ? `${c.goldWeight}g` : '-')}
                     </div>
                   </div>
                   {currentTab === 'ongoing' && (
                     <div style={{ gridColumn: 'span 2' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '2px' }}>Remainder</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontStyle: 'italic' }}>{c.notes || 'No notes'}</div>
                     </div>
                   )}
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <a href={`tel:${c.phone}`} className="btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 0', textDecoration: 'none', background: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-color)', fontSize: '14px', borderRadius: '8px' }}>
                    <Phone size={16} /> Call
                  </a>
                  {currentTab === 'ongoing' && (
                     <div style={{ flex: 1, display: 'flex', gap: '8px' }}>
                        <OngoingQuickUpdate 
                          customerId={c.id} 
                          initialAmount={c.loanAmount} 
                          initialDate={c.dueDate} 
                          initialNotes={c.notes}
                        />
                        <RequestClosureButton customerId={c.id} variant="compact" />
                     </div>
                  )}
                  {currentTab !== 'ongoing' && (
                    <Link href={`/dashboard/customers/${c.id}?from=${currentTab}`} className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 0', textDecoration: 'none', fontSize: '14px', borderRadius: '8px' }}>
                      View Details →
                    </Link>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
