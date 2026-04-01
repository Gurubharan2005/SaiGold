import { prisma } from '@/lib/prisma'
import { FileText, User, ArrowRight, Clock, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function DetailFillingPipeline() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const session = token ? await decrypt(token) : null

  // The Detail Filling Pipeline strictly pulls 'PROCESSING' customers assigned to the current staff member
  const customers = await prisma.customer.findMany({
    where: { 
      status: 'PROCESSING',
      assignedToId: String(session?.id)
    },
    orderBy: { updatedAt: 'asc' }, // Oldest processing leads first
    include: {
      documents: true
    }
  })

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
        <div style={{ flex: '1 1 300px' }}>
          <h1 style={{ fontSize: '28px', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FileText size={32} color="var(--status-processing)" />
            Detail Filling Pipeline
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
            Customers you have accepted. Fill in their profiling details and upload compliance documents here.
          </p>
        </div>
        
        <div className="badge badge-processing" style={{ scale: '1.1', height: 'fit-content' }}>
           {customers.length} Actionable Leads
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {customers.length === 0 ? (
           <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
             <AlertCircle size={48} color="var(--text-secondary)" strokeWidth={1.5} />
             <p style={{ margin: 0, fontSize: '16px', fontWeight: 500 }}>Your Detail Filling pipeline is entirely clear.</p>
             <Link href="/dashboard" className="btn-secondary" style={{ marginTop: '16px' }}>
               Return to Active Assignments
             </Link>
           </div>
        ) : (
          customers.map((c: any) => (
             <div key={c.id} className="card" style={{ 
               display: 'flex', 
               flexDirection: 'row', 
               flexWrap: 'wrap', 
               justifyContent: 'space-between', 
               alignItems: 'center', 
               gap: '24px',
               padding: '20px'
             }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: '240px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <User size={24} color="var(--status-processing)" />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '18px', color: 'var(--text-primary)' }}>{c.name}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>{c.phone}</div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap', justifyContent: 'flex-end', flex: '1 1 auto' }}>
                   <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                     <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Uploaded Docs</span>
                     <span style={{ fontWeight: 600, color: c.documents.length > 0 ? 'var(--status-accepted)' : 'var(--status-waiting)' }}>
                       {c.documents.length} Files
                     </span>
                   </div>
                   
                   <Link 
                     href={`/dashboard/customers/${c.id}?from=processing`}
                     className="btn-primary"
                     style={{ minWidth: '180px' }}
                   >
                     Fill Details & Upload <ArrowRight size={18} />
                   </Link>
                </div>
             </div>
          ))
        )}
      </div>
    </div>
  )
}
