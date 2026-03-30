import { prisma } from '@/lib/prisma'
import { Search, Phone, User, Clock, MessageSquare, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function SalesModulePage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const session = token ? await decrypt(token) : null

  // Only show ACCEPTED customers for the Sales Module
  const customers = await prisma.customer.findMany({
    where: {
      status: 'ACCEPTED'
    },
    orderBy: {
      updatedAt: 'desc'
    }
  })

  const totalAccepted = customers.length
  const highPriorityCount = customers.filter(c => c.priority === 'HIGH').length

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <TrendingUp size={32} color="var(--status-accepted)" />
            Sales Salesman Module
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
            Manage and follow up with confirmed customer leads to drive conversions.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '16px' }}>
          <div className="card" style={{ padding: '12px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '140px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Confirmed</span>
            <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--status-accepted)' }}>{totalAccepted}</span>
          </div>
          <div className="card" style={{ padding: '12px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '140px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>High Priority</span>
            <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--status-rejected)' }}>{highPriorityCount}</span>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <div style={{ padding: '20px', display: 'flex', gap: '16px', borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <Search size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '14px', top: '12px' }} />
            <input 
              type="text" 
              placeholder="Search sales leads..." 
              style={{ paddingLeft: '44px', width: '100%', height: '44px', borderRadius: '12px' }}
            />
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '18px 24px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '13px', textTransform: 'uppercase' }}>Customer</th>
              <th style={{ padding: '18px 24px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '13px', textTransform: 'uppercase' }}>Loan Details</th>
              <th style={{ padding: '18px 24px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '13px', textTransform: 'uppercase' }}>Last Follow-up</th>
              <th style={{ padding: '18px 24px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '13px', textTransform: 'uppercase' }}>Next Action</th>
              <th style={{ padding: '18px 24px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '13px', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                 <td colSpan={5} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                   <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                     <Clock size={48} strokeWidth={1} />
                     <p>No confirmed customers ready for sales follow-up yet.</p>
                   </div>
                </td>
              </tr>
            ) : (
              customers.map((c: any) => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'all 0.2s ease' }} className="table-row-hover">
                  <td style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--surface-color)', overflow: 'hidden', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {c.photoUrl ? (
                           <img 
                             src={`/api/avatar?url=${encodeURIComponent(c.photoUrl)}`} 
                             alt={c.name} 
                             style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                           />
                        ) : (
                           <User size={22} color="var(--text-secondary)" />
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '15px' }}>{c.name}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>{c.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '20px 24px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--primary-color)', fontSize: '16px' }}>
                      {c.loanAmount ? `₹${c.loanAmount.toLocaleString()}` : 'TBD'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {c.goldWeight ? `${c.goldWeight}g Gold` : 'Weight Pending'}
                    </div>
                  </td>
                  <td style={{ padding: '20px 24px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 500 }}>
                      {format(new Date(c.updatedAt), 'MMM dd, yyyy')}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {format(new Date(c.updatedAt), 'p')}
                    </div>
                  </td>
                  <td style={{ padding: '20px 24px' }}>
                    {c.followUpDate ? (
                      <div style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600 }}>
                        <Clock size={14} />
                        {format(new Date(c.followUpDate), 'MMM dd')}
                      </div>
                    ) : (
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Scheduling required</span>
                    )}
                  </td>
                  <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                      <a 
                        href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        title="WhatsApp Follow-up"
                        style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s' }}
                      >
                        <MessageSquare size={18} color="#10B981" />
                      </a>
                      <a 
                        href={`tel:${c.phone}`} 
                        title="Call Customer"
                        style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}
                      >
                        <Phone size={18} color="var(--primary-color)" />
                      </a>
                      <Link 
                        href={`/dashboard/customers/${c.id}`} 
                        style={{ marginLeft: '8px', padding: '8px 16px', borderRadius: '10px', background: 'var(--primary-color)', color: 'white', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}
                      >
                        View Details
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .table-row-hover:hover {
          background: rgba(255, 255, 255, 0.01) !important;
          transform: translateY(-1px);
        }
      `}} />
    </div>
  )
}
