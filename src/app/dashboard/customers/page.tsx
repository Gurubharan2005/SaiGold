import { prisma } from '@/lib/prisma'
import { Plus, Search, FileSpreadsheet, Phone, MapPin, User } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const session = token ? await decrypt(token) : null
  const { tab } = await searchParams
  const currentTab = tab || 'new'

  // Contextual Security: Managers see everything. Staff see ONLY the customers they manually registered or are assigned to.
  const baseWhere: any = { 
     status: currentTab === 'new' 
       ? { in: ['WAITING', 'ACCEPTED'] }
       : { in: ['PROCESSING', 'DUE', 'CLOSED'] }
  }
  if (session?.role !== 'MANAGER') {
    baseWhere.OR = [
      { createdById: String(session?.id) },
      { assignedToId: String(session?.id) }
    ]
  }

  const customers = await prisma.customer.findMany({
    where: baseWhere,
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <h1 style={{ fontSize: '28px', margin: 0 }}>Customer Directory</h1>
          <div style={{ display: 'flex', gap: '8px', background: 'var(--surface-color)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <Link 
              href="/dashboard/customers?tab=new" 
              style={{ padding: '8px 16px', borderRadius: '6px', textDecoration: 'none', color: currentTab === 'new' ? 'var(--bg-color)' : 'var(--text-secondary)', background: currentTab === 'new' ? 'var(--primary-color)' : 'transparent', fontWeight: 600, fontSize: '13px' }}
            >
              New Customers
            </Link>
            <Link 
              href="/dashboard/customers?tab=ongoing" 
              style={{ padding: '8px 16px', borderRadius: '6px', textDecoration: 'none', color: currentTab === 'ongoing' ? 'var(--bg-color)' : 'var(--text-secondary)', background: currentTab === 'ongoing' ? 'var(--primary-color)' : 'transparent', fontWeight: 600, fontSize: '13px' }}
            >
              Ongoing Customers
            </Link>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          {session?.role === 'MANAGER' && (
            <a href="/api/export" className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', textDecoration: 'none', color: 'var(--text-color)' }}>
              <FileSpreadsheet size={18} /> Export Excel
            </a>
          )}
          <Link href="/dashboard/customers/new" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', textDecoration: 'none' }}>
            <Plus size={18} /> New Customer
          </Link>
        </div>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {/* Simple Toolbar */}
        <div style={{ padding: '16px', display: 'flex', gap: '16px', borderBottom: '1px solid var(--border-color)', background: 'var(--surface-color)' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
            <Search size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            <input 
              type="text" 
              placeholder="Search by name or phone..." 
              style={{ paddingLeft: '38px', width: '100%', height: '40px' }}
            />
          </div>
          <select style={{ height: '40px', padding: '0 16px', minWidth: '160px' }}>
            <option value="">All Statuses</option>
            <option value="PROCESSING">Processing</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="DUE">Due</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>

        {/* Datatable */}
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Customer Data</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Status</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Loan Info</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Creation Date</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                 <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No active customers found. Accept a Meta Lead or add a new customer manually.
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
                  <td style={{ padding: '16px' }}>
                    <span className={`badge badge-${c.status.toLowerCase()}`}>{c.status}</span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--primary-color)' }}>
                      {c.loanAmount ? `₹${c.loanAmount.toLocaleString()}` : '-'}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {c.goldWeight ? `${c.goldWeight}g` : 'No weight listed'}
                    </div>
                  </td>
                  <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                    {format(new Date(c.createdAt), 'MMM dd, yyyy')}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', alignItems: 'center' }}>
                      <a href={`tel:${c.phone}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-color)', fontSize: '13px', textDecoration: 'none', background: 'var(--surface-color)', padding: '6px 12px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                        <Phone size={14} color="var(--primary-color)" /> Call
                      </a>
                      <Link href={`/dashboard/customers/${c.id}`} style={{ color: 'var(--primary-color)', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>
                        View Details →
                      </Link>
                    </div>
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
