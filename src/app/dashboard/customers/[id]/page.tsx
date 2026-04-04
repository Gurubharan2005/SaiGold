import { ArrowLeft, Phone, MapPin, Calendar, Hash, FileText, Download, Lock, Check, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Suspense } from 'react'
import nextDynamic from 'next/dynamic'
import CustomerSalesControl from '@/components/CustomerSalesControl'
import DeleteDocumentButton from '@/components/DeleteDocumentButton'
import CloseLoanButton from '@/components/CloseLoanButton'
import RequestClosureButton from '@/components/RequestClosureButton'
import FinishUploadButton from '@/components/FinishUploadButton'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Performance Optimization: Lazy load heavy interactive components
const ProfilePhotoUploader = nextDynamic(() => import('@/components/ProfilePhotoUploader'), {
  loading: () => <div className="w-20 h-20 rounded-2xl bg-zinc-800 animate-pulse" />
})
const EditProfileModalTrigger = nextDynamic(() => import('@/components/EditProfileModalTrigger').then(mod => mod.EditProfileModalTrigger), {
  loading: () => <div className="h-10 w-24 bg-zinc-800 animate-pulse rounded-lg" />
})
const LoanDetailsEditor = nextDynamic(() => import('@/components/LoanDetailsEditor'), {
  loading: () => <div className="h-32 bg-zinc-800 animate-pulse rounded-xl" />
})
const DocumentUploader = nextDynamic(() => import('@/components/DocumentUploader'), {
  loading: () => <div className="h-12 bg-zinc-800 animate-pulse rounded-lg" />
})
const CustomerTimeline = nextDynamic(() => import('@/components/CustomerTimeline'), {
  loading: () => <div className="h-40 bg-zinc-800 animate-pulse rounded-xl" />
})
const CallRecordingsPanel = nextDynamic(() => import('@/components/CallRecordingsPanel'), {
  loading: () => <div className="h-40 bg-zinc-800 animate-pulse rounded-xl" />
})
const SalesVerifyActions = nextDynamic(() => import('@/components/SalesVerifyActions'), {
  loading: () => <div className="h-24 bg-zinc-800 animate-pulse rounded-xl" />
})

export const dynamic = 'force-dynamic'

export default async function CustomerDetailsPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ from?: string }>
}) {
  const { id } = await params
  const { from } = await searchParams
  
  // Performance Optimization: Explicit select to reduce JSON payload size
  const customer = await prisma.customer.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      phone: true,
      status: true,
      photoUrl: true,
      branch: true,
      loanAmount: true,
      goldWeight: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
      priority: true,
      callStatus: true,
      followUpDate: true,
      followUpNotes: true,
      documents: {
        select: {
          id: true,
          documentName: true,
          documentUrl: true,
          documentType: true,
        }
      },
      assignedTo: {
        select: {
          id: true,
          name: true,
        }
      }
    }
  })

  if (!customer) {
    return <div className="p-8 text-center text-zinc-500">Customer not found</div>
  }

  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const session = token ? await decrypt(token) : null
  const isManager = session?.role === 'MANAGER'
  const isSalesman = session?.role === 'SALESMAN'

  // Contextual back link: where did we come from?
  const backHref = from === 'processing' 
    ? '/dashboard/detail-filling' 
    : from 
      ? `/dashboard/customers?tab=${from}` 
      : '/dashboard/customers'

  return (
    <div className="fade-in max-w-4xl" style={{ paddingBottom: '100px' }}>
      
      {/* 1. TOP STICKY NAVIGATION BAR */}
      <div style={{ 
        marginBottom: '24px', 
        position: 'sticky', 
        top: '0', 
        zIndex: 100, 
        padding: '16px 0',
        background: 'var(--background-color)', // match page background
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center'
      }}>
        <Link 
          href={backHref} 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            color: 'var(--text-secondary)', 
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 600,
            padding: '10px 20px',
            background: 'var(--surface-color)',
            borderRadius: '100px',
            border: '1px solid var(--border-color)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            transition: 'all 0.2s'
          }}
          className="hover-opacity"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <Suspense fallback={<div className="w-20 h-20 rounded-2xl bg-zinc-800 animate-pulse" />}>
            <ProfilePhotoUploader customerId={customer.id} initialPhotoUrl={customer.photoUrl} />
          </Suspense>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '28px', margin: 0, fontWeight: 800, letterSpacing: '-0.5px' }}>{customer.name}</h1>
              <div className={`badge badge-${customer.status.toLowerCase()}`}>{customer.status}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--text-secondary)', fontSize: '13px' }}>
               <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={14} /> {customer.phone}</span>
               <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={14} /> {customer.branch || 'Headquarters'}</span>
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px', alignItems: 'center' }}>
          {(isManager || customer.status === 'PROCESSING') && (
            <Suspense fallback={<div className="h-10 w-24 bg-zinc-800 animate-pulse rounded-lg" />}>
              <EditProfileModalTrigger customer={customer as any} />
            </Suspense>
          )}
          
          {/* CLOSURE WORKFLOW ENGINE */}
          {isManager ? (
            // Manager can always see the delete button if they want, 
            // but we highlight it when requested
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {(customer.status as string) === 'CLOSE_REQUESTED' && (
                <span className="badge badge-rejected" style={{ padding: '8px 12px', borderRadius: '6px' }}>
                  Closure Approval Requested
                </span>
              )}
              <CloseLoanButton customerId={customer.id} />
             </div>
          ) : (
             // Staff can only request closure if loan is active
             (customer.status === 'ACCEPTED' || customer.status === 'DUE') ? (
               <RequestClosureButton customerId={customer.id} />
             ) : (customer.status as string) === 'CLOSE_REQUESTED' ? (
               <span className="badge badge-rejected" style={{ padding: '10px 16px', borderRadius: '8px', fontWeight: 600 }}>
                  Waiting for Manager Approval...
               </span>
             ) : null
          )}
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
        gap: '24px',
        alignItems: 'start'
      }}>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                  <Calendar size={14} /> Created {format(new Date(customer.createdAt), 'MMM dd, yyyy')}
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Hash size={16} /> Customer ID
                </div>
                <div style={{ color: 'var(--text-color)', fontWeight: 500, fontSize: '12px' }}>{customer.id}</div>
              </div>
            </div>
          </div>

            <div style={{ marginTop: '16px' }}>
              <Suspense fallback={<div className="h-32 bg-zinc-800 animate-pulse rounded-xl" />}>
                <LoanDetailsEditor 
                  customerId={customer.id} 
                  initialAmount={customer.loanAmount} 
                  initialWeight={customer.goldWeight} 
                  disabled={customer.status !== 'PROCESSING' && !isManager} 
                />
              </Suspense>
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
          
          {/* New Sales Action Engine (Simplified to Notes only) */}
          <CustomerSalesControl
             customerId={customer.id}
             priority={customer.priority}
             callStatus={customer.callStatus}
             branch={customer.branch}
             followUpDate={customer.followUpDate?.toISOString() || null}
             followUpNotes={customer.followUpNotes}
             phone={customer.phone}
             hideLeadAttributes={true}
             hideFollowUp={true}
          />

          {!isManager && customer.status !== 'PROCESSING' && (
            <div className="card" style={{ border: '1px dashed #F59E0B', background: 'rgba(245, 158, 11, 0.05)', textAlign: 'center' }}>
              <Lock size={20} color="#F59E0B" style={{ margin: '0 auto 12px auto' }} />
              <p style={{ fontSize: '13px', color: '#F59E0B', margin: 0, fontWeight: 600 }}>
                Detailed data entry is locked. <br />
                 Please ensure this lead is in the &quot;Detail Filling Option&quot; (Processing) to enable profile editing and uploads.
              </p>
            </div>
          )}

          <div className="card">
            <h3 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
              Compliance Documents
              {customer.status === 'PROCESSING' && (
                <span className="badge badge-accepted">{customer.documents.length} Files</span>
              )}
            </h3>

            {/* Document Rendering Matrix */}
            
            {/* Case 1: Staff looking at a Sealed Customer (Docs are hidden for them) */}
            {!isManager && !isSalesman && customer.status !== 'PROCESSING' && customer.status !== 'ACCEPTED' && customer.documents.length > 0 && (
              <div style={{ padding: '24px 16px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ background: '#10B981', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
                  <Check size={24} color="#FFF" />
                </div>
                <h4 style={{ margin: '0 0 4px 0', color: '#10B981', fontSize: '16px' }}>Documents Sealed</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
                  Verification is pending or complete. You no longer have view/edit access to this compliance folder.
                </p>
              </div>
            )}

            {/* Case 2: Anyone looking at a Locked Customer with NO Documents */}
            {customer.status !== 'PROCESSING' && customer.status !== 'ACCEPTED' && customer.status !== 'VERIFIED' && customer.documents.length === 0 && (
              <div style={{ padding: '24px 16px', background: 'var(--surface-hover)', borderRadius: '8px', textAlign: 'center', border: '1px dashed var(--border-color)' }}>
                <Lock size={24} color="var(--text-secondary)" style={{ margin: '0 auto 8px auto' }} />
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  This folder is currently <strong>locked</strong>. Documents can only be uploaded during the <strong>Detail Filling</strong> state.
                </p>
              </div>
            )}

            {/* Document List Rendering (Always visible for Manager/Salesman, Only on PROCESSING or ACCEPTED for Staff) */}
            {(isManager || isSalesman || (!isManager && !isSalesman && (customer.status === 'PROCESSING' || customer.status === 'ACCEPTED'))) && customer.documents.length > 0 && (
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {customer.documents.map((doc) => (
                  <li key={doc.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '10px', background: 'var(--surface-hover)', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                       <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{doc.documentType}</span>
                       <div style={{ display: 'flex', gap: '12px' }}>
                          <a href={doc.documentUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)' }} title="Download">
                            <Download size={14} />
                          </a>
                          {/* Disable delete if not in PROCESSING */}
                          {customer.status === 'PROCESSING' && <DeleteDocumentButton documentId={doc.id} />}
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

            {/* The Document Uploader Tool (only when PROCESSING) */}
            {customer.status === 'PROCESSING' && (
                <Suspense fallback={<div className="h-12 bg-zinc-800 animate-pulse rounded-lg" />}>
                  <DocumentUploader customerId={customer.id} />
                </Suspense>
            )}
            
          </div>
          
        </div>
      </div>

      {/* Audit Timeline Injection */}
      <Suspense fallback={<div className="h-40 bg-zinc-800 animate-pulse rounded-xl" />}>
        <CustomerTimeline customer={customer as any} />
      </Suspense>

      {/* Call Recordings */}
      <Suspense fallback={<div className="h-40 bg-zinc-800 animate-pulse rounded-xl" />}>
        <CallRecordingsPanel customerId={customer.id} isManager={isManager} />
      </Suspense>

      {/* FINAL ACTION: SEND TO SALESMAN (Only for Processing Leads) */}
      {customer.status === 'PROCESSING' && (
        <div className="card" style={{ 
          marginTop: '32px', 
          border: '2px solid var(--primary-color)', 
          background: 'rgba(255, 193, 7, 0.05)', 
          textAlign: 'center',
          padding: '32px'
        }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '20px' }}>Uploads Complete?</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
            Verify all compliance documents (Gold photo, ID proofs) before sending to the salesman for verification.
          </p>
          <div style={{ maxWidth: '300px', margin: '0 auto' }}>
            <FinishUploadButton customerId={customer.id} fromTab={from} />
          </div>
        </div>
      )}

      {/* SALESMAN ACTION: VERIFY & SEND TO MAINTENANCE (Only for Verified Leads) */}
      {isSalesman && (customer.status === 'VERIFIED' || customer.status === 'PROCESSING') && (
        <Suspense fallback={<div className="h-24 bg-zinc-800 animate-pulse rounded-xl" />}>
          <SalesVerifyActions customerId={customer.id} fromTab={from} />
        </Suspense>
      )}
    </div>
  )
}
