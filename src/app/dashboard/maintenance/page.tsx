import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Phone, IndianRupee } from 'lucide-react'
import CallRecordingsPanel from '@/components/CallRecordingsPanel'

export const dynamic = 'force-dynamic'

export default async function MaintenancePage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const session = token ? await decrypt(token) : null

  // Restrict access to Maintenance and Managers
  if (session?.role !== 'MAINTENANCE' && session?.role !== 'MANAGER') {
    redirect('/dashboard')
  }

  const confirmedCustomers = await prisma.customer.findMany({
    where: { status: 'MAINTENANCE' },
    orderBy: { updatedAt: 'desc' },
  })

  return (
    <div className="fade-in">
       <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', margin: 0 }}>Maintenance Desk</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Managing confirmed customers and tracking converted loan balances.</p>
       </div>

       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {confirmedCustomers.length === 0 ? (
            <div className="card" style={{ gridColumn: '1 / -1', padding: '64px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No confirmed customers in the maintenance queue.
            </div>
          ) : (
            confirmedCustomers.map(customer => (
              <div key={customer.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: 'rgba(16, 185, 129, 0.03)', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                       <h2 style={{ fontSize: '20px', margin: 0, letterSpacing: '-0.5px' }}>{customer.name}</h2>
                       <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Phone size={14} /> {customer.phone}
                       </p>
                    </div>
                    <div style={{ textAlign: 'right', background: 'var(--bg-color)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)', minWidth: '160px' }}>
                       <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', fontWeight: 600 }}>Loan Amount to be Paid</div>
                       <div style={{ fontSize: '22px', fontWeight: 800, color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                          <IndianRupee size={18} /> {customer.loanAmount?.toLocaleString('en-IN') || '0'}
                       </div>
                    </div>
                 </div>

                 <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '10px' }}>
                    <CallRecordingsPanel customerId={customer.id} isManager={session.role === 'MANAGER'} />
                 </div>
              </div>
            ))
          )}
       </div>
    </div>
  )
}
