import { ArrowLeft, Edit, Phone, MapPin, Calendar, CreditCard, Hash, FileText, Download, Lock, Check } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import CustomerStatusSelect from '@/components/CustomerStatusSelect'
import CustomerSalesControl from '@/components/CustomerSalesControl'
import DocumentUploader from '@/components/DocumentUploader'
import DeleteDocumentButton from '@/components/DeleteDocumentButton'
import CloseLoanButton from '@/components/CloseLoanButton'
import DueDateSelector from '@/components/DueDateSelector'
import FinishUploadButton from '@/components/FinishUploadButton'
import ProfilePhotoUploader from '@/components/ProfilePhotoUploader'
import { EditProfileModalTrigger } from '@/components/EditProfileModalTrigger'
import { cookies } from 'next/headers'

import { decrypt } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function CustomerDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      documents: true,
      assignedTo: true,
    }
  })

  if (!customer) {
    return <div className="p-8 text-center text-zinc-500">Customer not found</div>
  }

  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const session = token ? await decrypt(token) : null
  const isManager = session?.role === 'MANAGER'

  return (
    <div className="fade-in max-w-4xl">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <ProfilePhotoUploader customerId={customer.id} initialPhotoUrl={customer.photoUrl} />
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Link href="/dashboard/customers" style={{ color: 'var(--text-secondary)', paddingRight: '8px', borderRight: '1px solid var(--border-color)' }} className="hover-opacity">
                <ArrowLeft size={24} />
              </Link>
              <h1 style={{ fontSize: '32px', margin: 0, fontWeight: 700, letterSpacing: '-0.5px' }}>{customer.name}</h1>
              <div className={`badge badge-${customer.status.toLowerCase()}`}>{customer.status}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--text-secondary)', fontSize: '13px' }}>
               <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={14} /> {customer.phone}</span>
               <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={14} /> {customer.branch || 'Headquarters'}</span>
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          {isManager && <EditProfileModalTrigger customer={customer} />}
          <CloseLoanButton customerId={customer.id} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Main Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="card">
            <h2 style={{ fontSize: '18px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '16px' }}>General Information</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', color: 'var(--text-secondary)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Phone size={16} /> Phone Number
                </div>
                <div style={{ color: 'var(--text-color)', fontWeight: 500 }}>{customer.phone}</div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <MapPin size={16} /> Branch Location
                </div>
                <div style={{ color: 'var(--text-color)', fontWeight: 500 }}>{customer.branch || 'Not specified'}</div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Calendar size={16} /> Created On
                </div>
                <div style={{ color: 'var(--text-color)', fontWeight: 500 }}>{format(new Date(customer.createdAt), 'MMMM dd, yyyy')}</div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Hash size={16} /> Customer ID
                </div>
                <div style={{ color: 'var(--text-color)', fontWeight: 500, fontSize: '12px' }}>{customer.id}</div>
              </div>
              <DueDateSelector customerId={customer.id} initialDate={customer.dueDate?.toISOString() || null} />
            </div>
          </div>

          <div className="card">
            <h2 style={{ fontSize: '18px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '16px' }}>Loan & Gold Details</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', color: 'var(--text-secondary)' }}>
              <div>
                <span style={{ display: 'block', marginBottom: '4px' }}>Requested Loan Amount</span>
                <span style={{ color: 'var(--primary-color)', fontWeight: 600, fontSize: '20px' }}>
                  {customer.loanAmount ? `₹${customer.loanAmount.toLocaleString()}` : '-'}
                </span>
              </div>
              <div>
                <span style={{ display: 'block', marginBottom: '4px' }}>Estimated Gold Weight</span>
                <span style={{ color: 'var(--text-color)', fontWeight: 600, fontSize: '20px' }}>
                  {customer.goldWeight ? `${customer.goldWeight} grams` : '-'}
                </span>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 style={{ fontSize: '18px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '16px' }}>Notes & Activity</h2>
            <p style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
              {customer.notes || 'No notes available for this customer.'}
            </p>
          </div>

        </div>

        {/* Sidebar Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="card">
            <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Workflow Stage</h3>
            <CustomerStatusSelect customerId={customer.id} currentStatus={customer.status} />
          </div>

          {/* New Sales Action Engine */}
          <CustomerSalesControl
             customerId={customer.id}
             priority={customer.priority}
             callStatus={customer.callStatus}
             branch={customer.branch}
             followUpDate={customer.followUpDate?.toISOString() || null}
             followUpNotes={customer.followUpNotes}
             phone={customer.phone}
          />

          <div className="card">
            <h3 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
              Compliance Documents
              {customer.status === 'ACCEPTED' && (
                <span className="badge badge-accepted">{customer.documents.length} Files</span>
              )}
            </h3>

            {/* Document Rendering Matrix */}
            
            {/* Case 1: Staff looking at a Locked Customer with Documents */}
            {!isManager && customer.status !== 'ACCEPTED' && customer.documents.length > 0 && (
              <div style={{ padding: '24px 16px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ background: '#10B981', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
                  <Check size={24} color="#FFF" />
                </div>
                <h4 style={{ margin: '0 0 4px 0', color: '#10B981', fontSize: '16px' }}>Documents Uploaded Successfully</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
                  Files are secured and hidden. Awaiting final manual verification from the Sales Manager.
                </p>
              </div>
            )}

            {/* Case 2: Staff looking at a Locked Customer with NO Documents (or Manager seeing locked) */}
            {(isManager || (!isManager && customer.documents.length === 0)) && customer.status !== 'ACCEPTED' && (
              <div style={{ padding: '24px 16px', background: 'var(--surface-hover)', borderRadius: '8px', textAlign: 'center', border: '1px dashed var(--border-color)' }}>
                <Lock size={24} color="var(--text-secondary)" style={{ margin: '0 auto 8px auto' }} />
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  New documents can strictly only be uploaded to <strong>ACCEPTED</strong> profiles. Change the status to unlock the uploader.
                </p>
              </div>
            )}

            {/* Rendering the actual visible documents (Always for Manager, Only on ACCEPTED for Staff) */}
            {(isManager || (!isManager && customer.status === 'ACCEPTED')) && customer.documents.length > 0 && (
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {customer.documents.map((doc: any) => (
                  <li key={doc.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '10px', background: 'var(--surface-hover)', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                       <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{doc.documentType}</span>
                       <div style={{ display: 'flex', gap: '12px' }}>
                          <a href={doc.documentUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)' }} title="Download">
                            <Download size={14} />
                          </a>
                          <DeleteDocumentButton documentId={doc.id} />
                       </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', marginTop: '4px' }}>
                      <FileText size={16} color="var(--primary-color)" />
                      <span style={{ fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }} title={doc.documentName}>
                        {doc.documentName}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {/* The Document Uploader Tool (only when ACCEPTED) */}
            {customer.status === 'ACCEPTED' && (
              <>
                <DocumentUploader customerId={customer.id} />
                {!isManager && <FinishUploadButton customerId={customer.id} />}
              </>
            )}
            
          </div>
          
        </div>
      </div>
    </div>
  )
}
