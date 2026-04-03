'use client'

import React from 'react'
import { CheckCircle2, User, FileText, ShieldCheck, FileKey, XCircle, Phone } from 'lucide-react'
import Link from 'next/link'
import SalesVerifyActions from '@/components/SalesVerifyActions'
import DocumentViewer from '@/components/DocumentViewer'
import CloseLoanButton from '@/components/CloseLoanButton'
import DashRealtimeSync from '@/components/DashRealtimeSync'

interface CustomerDocument {
  id: string
  documentType: string
  documentName: string
  documentUrl: string
}

interface Customer {
  id: string
  name: string
  phone: string
  loanAmount: number | null
  goldWeight: number | null
  assignedTo?: { name: string } | null
  documents: CustomerDocument[]
}

interface Session {
  id: string | number
  role: string
}

interface ManagerOpsDeskProps {
  currentTab: string
  customers: Customer[]
  session: Session | null
  viewUrl?: string
  docName?: string
  docType?: string
  viewAllId?: string
  baseUrl: string // e.g., "/dashboard" or "/dashboard/sales"
}

export default function ManagerOpsDesk({ 
  currentTab, 
  customers, 
  session, 
  viewUrl, 
  docName, 
  docType, 
  viewAllId,
  baseUrl
}: ManagerOpsDeskProps) {
  
  // Handle Bulk View if viewAllId is present
  const bulkCustomer = viewAllId ? customers.find(c => c.id === viewAllId) : null

  return (
    <div style={{ marginTop: '32px' }}>
      <DashRealtimeSync intervalMs={10000} />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h2 style={{ fontSize: '20px', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldCheck size={24} color="var(--primary-color)" />
          Operations & Verification Desk
        </h2>

        <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '12px' }}>
           <Link 
             href={`${baseUrl}?tab=verifications`} 
             style={{ textDecoration: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, background: currentTab === 'verifications' ? '#3B82F6' : 'transparent', color: currentTab === 'verifications' ? '#FFF' : 'var(--text-secondary)', border: currentTab === 'verifications' ? 'none' : '1px solid var(--border-color)' }}
           >
              Verifications ({currentTab === 'verifications' ? customers.length : '...'})
           </Link>
           <Link 
             href={`${baseUrl}?tab=closures`} 
             style={{ textDecoration: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, background: currentTab === 'closures' ? '#EF4444' : 'transparent', color: currentTab === 'closures' ? '#FFF' : 'var(--text-secondary)', border: currentTab === 'closures' ? 'none' : '1px solid var(--border-color)' }}
           >
              Approvals ({currentTab === 'closures' ? customers.length : '...'})
           </Link>
           <Link 
             href={`${baseUrl}?tab=history`} 
             style={{ textDecoration: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, background: currentTab === 'history' ? '#10B981' : 'transparent', color: currentTab === 'history' ? '#FFF' : 'var(--text-secondary)', border: currentTab === 'history' ? 'none' : '1px solid var(--border-color)' }}
           >
              History ({currentTab === 'history' ? customers.length : '...'})
           </Link>
        </div>
      </div>

      {bulkCustomer ? (
         <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '16px', 
              background: 'var(--surface-color)', 
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              position: 'sticky',
              top: '80px',
              zIndex: 100,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
            }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Link href={`${baseUrl}?tab=${currentTab}`} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                     Back to Desk
                  </Link>
                  <div style={{ fontWeight: 700 }}>{bulkCustomer.name}&apos;s All Documents</div>
               </div>
               <div className="badge badge-waiting">{bulkCustomer.documents.length} Files</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
               {bulkCustomer.documents.map((doc: CustomerDocument, idx: number) => (
                  <div key={doc.id} style={{ border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'hidden' }}>
                     <div style={{ padding: '12px 16px', background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 600 }}>{idx + 1}. {doc.documentType}</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{doc.documentName}</span>
                     </div>
                     <div style={{ height: '70vh', minHeight: '500px' }}>
                        <DocumentViewer url={doc.documentUrl} name={doc.documentName} type={doc.documentType} />
                     </div>
                  </div>
               ))}
            </div>
         </div>
      ) : viewUrl ? (
        <DocumentViewer url={viewUrl} name={docName} type={docType} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {customers.length === 0 ? (
             <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
               <CheckCircle2 size={48} color="#10B981" strokeWidth={1.5} />
               <p style={{ margin: 0, fontSize: '16px', fontWeight: 500 }}>
                 {currentTab === 'history' 
                   ? 'No archived closure history found.' 
                   : currentTab === 'closures' 
                     ? 'No pending closure requests.' 
                     : 'No pending verification requests.'}
               </p>
             </div>
          ) : (
            customers.map((c: Customer) => (
               <div key={c.id} className="card" style={{ 
                 display: 'flex', 
                 flexDirection: 'row', 
                 flexWrap: 'wrap', 
                 gap: '24px', 
                 position: 'relative', 
                 overflow: 'hidden',
                 padding: '24px',
                 border: currentTab === 'closures' ? '1px solid var(--status-rejected)' : '1px solid var(--border-color)',
                 background: currentTab === 'closures' ? 'rgba(239, 68, 68, 0.02)' : 'var(--surface-color)'
               }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: currentTab === 'closures' ? 'var(--status-rejected)' : 'var(--status-waiting)' }} />
                  
                  <div style={{ 
                    flex: '1 1 300px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '16px',
                    paddingLeft: '12px',
                    borderRight: '1px solid var(--border-color)',
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

                        <div style={{ display: 'flex', gap: '8px' }}>
                           <a href={`tel:${c.phone}`} className="btn-secondary" style={{ padding: '8px', borderRadius: '50%', color: 'var(--primary-color)' }} title="Call Customer">
                             <Phone size={18} />
                           </a>
                        </div>
                     </div>

                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '12px', background: 'var(--surface-hover)', padding: '16px', borderRadius: '8px' }}>
                     <div>
                       <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Loan Amount</span>
                       <div style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{c.loanAmount ? `₹${c.loanAmount.toLocaleString()}` : '-'}</div>
                     </div>
                     <div>
                       <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gold Weight</span>
                       <div style={{ fontWeight: 600 }}>{c.goldWeight ? `${c.goldWeight}g` : '-'}</div>
                     </div>
                     <div style={{ gridColumn: 'span 2' }}>
                       <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Initial Handled By</span>
                       <div style={{ fontWeight: 600, color: 'white' }}>{c.assignedTo?.name || 'Unknown'}</div>
                     </div>
                   </div>

                   {currentTab === 'history' ? (
                     <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', padding: '12px', borderRadius: '8px', fontSize: '13px', border: '1px solid rgba(16, 185, 129, 0.2)', textAlign: 'center', fontWeight: 600 }}>
                           LOAN CLOSED: This record is archived.
                        </div>
                     </div>
                   ) : currentTab === 'closures' ? (
                     <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                           <strong>CLOSURE REQUESTED:</strong> Staff has flagged this loan for permanent closure.
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <div style={{ flex: 1 }}>
                            <CloseLoanButton 
                              customerId={c.id} 
                              isSalesman={session?.role === 'SALESMAN'} 
                            />
                          </div>
                        </div>
                     </div>
                   ) : (
                      <SalesVerifyActions customerId={c.id} fromTab="ongoing" />
                   )}
                   
                   <Link 
                     href={`/dashboard/customers/${c.id}?from=ongoing`}
                     style={{ display: 'block', textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'none', marginTop: '8px' }}
                     className="hover-opacity"
                   >
                     View Comprehensive Customer Profile
                   </Link>
                </div>

                <div style={{ flex: '2 1 400px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileKey size={18} color="var(--primary-color)" /> Sealed Documents ({c.documents.length})
                      </h3>
                      {c.documents.length > 0 && (
                        <Link 
                          href={`${baseUrl}?tab=${currentTab}&viewAllId=${c.id}`} 
                          className="btn-primary" 
                          style={{ padding: '6px 12px', fontSize: '12px', background: 'var(--status-waiting)', border: 'none' }}
                        >
                          View All (In-Page)
                        </Link>
                      )}
                   </div>
                   {c.documents.length === 0 ? (
                     <div style={{ padding: '24px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '8px', border: '1px dashed rgba(239, 68, 68, 0.2)', display: 'flex', gap: '12px', alignItems: 'center' }}>
                       <XCircle size={24} color="#EF4444" />
                       <p style={{ margin: 0, fontSize: '13px', color: '#EF4444' }}>No documents uploaded.</p>
                     </div>
                   ) : (
                     <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                       {c.documents.map((doc: CustomerDocument) => (
                          <div key={doc.id} style={{ padding: '12px', background: 'var(--surface-hover)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                               <FileText size={16} color="var(--primary-color)" />
                               <span style={{ fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.documentType}</span>
                             </div>
                             <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                               {doc.documentName}
                             </div>
                             <Link 
                               href={`${baseUrl}?tab=${currentTab}&viewUrl=${encodeURIComponent(doc.documentUrl)}&docName=${encodeURIComponent(doc.documentName)}&docType=${encodeURIComponent(doc.documentType)}`}
                               className="btn-secondary"
                               style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', padding: '8px' }}
                             >
                               Inspect
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
