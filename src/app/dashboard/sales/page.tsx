import { prisma } from '@/lib/prisma'
import { CheckCircle2, Search, User, FileText, Download, ShieldCheck, FileKey, XCircle, Phone, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'
import SalesVerifyActions from '@/components/SalesVerifyActions'
import DocumentViewer from '@/components/DocumentViewer'

export const dynamic = 'force-dynamic'

export default async function SalesVerificationDesk({ 
  searchParams 
}: { 
  searchParams: Promise<{ [key: string]: string | undefined }> 
}) {
  const { viewUrl, docName, docType } = await searchParams
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const session = token ? await decrypt(token) : null

  // The Sales Verification Desk strictly pulls 'VERIFIED' customers (i.e. staff has uploaded documents and pushed them to sales)
  const customers = await prisma.customer.findMany({
    where: { status: 'VERIFIED' },
    orderBy: { updatedAt: 'asc' }, // Oldest first for FIFO verification
    include: {
      documents: true,
      assignedTo: { select: { name: true } }
    }
  })

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
        <div style={{ flex: '1 1 300px' }}>
          <h1 style={{ fontSize: '28px', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ShieldCheck size={32} color="var(--primary-color)" />
            Sales Verification Desk
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
            Review sealed compliance documents to verify customers and unlock them for final processing.
          </p>
        </div>
        
        <div className="badge badge-waiting" style={{ scale: '1.1', height: 'fit-content' }}>
           {customers.length} Pending Verifications
        </div>
      </div>

      {viewUrl ? (
        <DocumentViewer url={viewUrl} name={docName} type={docType} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {customers.length === 0 ? (
             <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
               <CheckCircle2 size={48} color="#10B981" strokeWidth={1.5} />
               <p style={{ margin: 0, fontSize: '16px', fontWeight: 500 }}>All queues clear. No pending verification requests.</p>
             </div>
          ) : (
            customers.map((c: any) => (
               <div key={c.id} className="card" style={{ 
                 display: 'flex', 
                 flexDirection: 'row', 
                 flexWrap: 'wrap', 
                 gap: '24px', 
                 position: 'relative', 
                 overflow: 'hidden',
                 padding: '24px'
               }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: 'var(--status-waiting)' }} />
                  
                  {/* Customer Details Map */}
                  <div style={{ 
                    flex: '1 1 300px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '16px',
                    paddingLeft: '12px',
                    borderRight: '1px solid var(--border-color)',
                    // Remove border on mobile
                    borderBottom: '1px solid var(--border-color)',
                    paddingBottom: '24px'
                  }} className="sales-card-left">
                     <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                           <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--surface-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <User size={20} color="var(--text-secondary)" />
                           </div>
                           <div>
                             <div style={{ fontWeight: 700, fontSize: '18px' }}>{c.name}</div>
                             <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{c.phone}</div>
                           </div>
                        </div>

                        {/* Communication Quick Actions */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                           <a 
                             href={`tel:${c.phone}`} 
                             className="btn-secondary" 
                             style={{ padding: '8px', borderRadius: '50%', color: 'var(--primary-color)' }}
                             title="Call Customer"
                           >
                             <Phone size={18} />
                           </a>
                           <a 
                             href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}`} 
                             target="_blank" 
                             rel="noopener noreferrer" 
                             className="btn-secondary" 
                             style={{ padding: '8px', borderRadius: '50%', color: '#25D366' }}
                             title="WhatsApp Message"
                           >
                             <MessageSquare size={18} />
                           </a>
                        </div>
                     </div>

                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '12px', background: 'var(--surface-hover)', padding: '16px', borderRadius: '8px' }}>
                     <div>
                       <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Loan Requested</span>
                       <div style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{c.loanAmount ? `₹${c.loanAmount.toLocaleString()}` : '-'}</div>
                     </div>
                     <div>
                       <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gold Weight</span>
                       <div style={{ fontWeight: 600 }}>{c.goldWeight ? `${c.goldWeight}g` : '-'}</div>
                     </div>
                     <div style={{ gridColumn: 'span 2' }}>
                       <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Handled By</span>
                       <div style={{ fontWeight: 600, color: 'white' }}>{c.assignedTo?.name || 'Unknown'}</div>
                     </div>
                   </div>

                   <SalesVerifyActions customerId={c.id} salesmanId={String(session?.id)} />
                   
                   <Link 
                     href={`/dashboard/customers/${c.id}`}
                     style={{ display: 'block', textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'none', marginTop: '8px' }}
                     className="hover-opacity"
                   >
                     View Comprehensive Customer Profile
                   </Link>
                </div>

                {/* Secure Document Render Container */}
                <div style={{ flex: '2 1 400px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                   <h3 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                     <FileKey size={18} color="var(--primary-color)" /> Sealed Documents ({c.documents.length})
                   </h3>
                   {c.documents.length === 0 ? (
                     <div style={{ padding: '24px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '8px', border: '1px dashed rgba(239, 68, 68, 0.2)', display: 'flex', gap: '12px', alignItems: 'center' }}>
                       <XCircle size={24} color="#EF4444" />
                       <p style={{ margin: 0, fontSize: '13px', color: '#EF4444' }}>Warning: The Staff member sealed this folder without uploading any documentation.</p>
                     </div>
                   ) : (
                     <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                       {c.documents.map((doc: any) => (
                          <div key={doc.id} style={{ padding: '12px', background: 'var(--surface-hover)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                               <FileText size={16} color="var(--primary-color)" />
                               <span style={{ fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.documentType}</span>
                             </div>
                             <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                               {doc.documentName}
                             </div>
                             <Link 
                               href={`?viewUrl=${encodeURIComponent(doc.documentUrl)}&docName=${encodeURIComponent(doc.documentName)}&docType=${encodeURIComponent(doc.documentType)}`}
                               className="btn-primary"
                               style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', padding: '8px' }}
                             >
                               View In-Page
                             </Link>
                          </div>
                       ))}
                     </div>
                   )}
                </div>
             </div>
          ))
        )}
        </div>
      )}
    </div>
  )
}
