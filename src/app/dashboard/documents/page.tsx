import { prisma } from '@/lib/prisma'
import { Folder, FileText, Download, User as UserIcon, Calendar, ChevronRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import SearchInput from '@/components/SearchInput'

export const dynamic = 'force-dynamic'

export default async function DocumentsOverviewPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> 
}) {
  const resolvedParams = await searchParams
  const query = typeof resolvedParams.q === 'string' ? resolvedParams.q : undefined

  // Fetch strictly the Customers who have at least one legally bound Document uploaded.
  const customersWithDocs = await prisma.customer.findMany({
    where: {
      documents: { some: {} },
      ...(query && { name: { contains: query, mode: 'insensitive' } })
    },
    include: {
      documents: {
        include: { uploadedBy: true },
        orderBy: { uploadedAt: 'desc' }
      }
    },
    orderBy: { updatedAt: 'desc' }
  })

  // Calculate total documents for global metrics
  const totalFiles = customersWithDocs.reduce((acc, curr) => acc + curr.documents.length, 0)

  return (
    <div className="fade-in max-w-5xl">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', margin: 0 }}>Global Documents Vault</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '350px' }}>
           <SearchInput placeholder="Search folders by customer name..." />
           <div className="badge badge-accepted" style={{ whiteSpace: 'nowrap' }}>
             {totalFiles} Files Stored
           </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {customersWithDocs.length === 0 ? (
          <div className="card" style={{ padding: '64px 32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Folder size={48} style={{ margin: '0 auto 16px auto', opacity: 0.5 }} />
            <h2 style={{ color: 'var(--text-color)', marginBottom: '8px' }}>No Folders Found</h2>
            <p>Upload a file to an ACCEPTED customer profile to generate their cloud folder.</p>
          </div>
        ) : (
          customersWithDocs.map((customer) => (
            <details key={customer.id} className="card folder-card" style={{ padding: 0, overflow: 'hidden' }}>
              <summary 
                style={{ 
                  padding: '20px 24px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  cursor: 'pointer',
                  listStyle: 'none',
                  background: 'var(--surface-color)',
                  transition: 'background 0.2s',
                  userSelect: 'none'
                }}
                className="hover-bg-surface-hover"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ background: 'var(--primary-color)', padding: '10px', borderRadius: '8px', color: '#1a1f2c' }}>
                    <Folder size={24} fill="#e5b85a" stroke="none" />
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 600 }}>{customer.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                       <span className={`badge badge-${customer.status.toLowerCase()}`}>{customer.status}</span>
                       <span>• ID: {customer.id.split('-')[0]}</span>
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontWeight: 600 }}>{customer.documents.length} Files</span>
                    <Link href={`/dashboard/customers/${customer.id}`} style={{ color: 'var(--primary-color)', fontSize: '13px', textDecoration: 'none' }}>
                      View Profile
                    </Link>
                  </div>
                  <ChevronRight size={20} color="var(--text-secondary)" className="details-chevron" />
                </div>
              </summary>

              <div style={{ borderTop: '1px solid var(--border-color)', background: 'var(--bg-color)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <th style={{ padding: '12px 24px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '13px' }}>Document / Source</th>
                      <th style={{ padding: '12px 24px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '13px' }}>Uploaded By</th>
                      <th style={{ padding: '12px 24px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '13px' }}>Date Added</th>
                      <th style={{ padding: '12px 24px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customer.documents.map((doc: any) => (
                      <tr key={doc.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }} className="hover-bg-surface-hover">
                        <td style={{ padding: '16px 24px', fontWeight: 500 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span className="badge badge-waiting" style={{ alignSelf: 'flex-start', fontSize: '10px' }}>{doc.documentType}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <FileText size={16} color="var(--primary-color)" />
                              <span style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={doc.documentName}>
                                {doc.documentName}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <UserIcon size={14} /> {doc.uploadedBy ? doc.uploadedBy.name : 'Unknown'}
                           </div>
                        </td>
                        <td style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Calendar size={14} /> {formatDistanceToNow(new Date(doc.uploadedAt), { addSuffix: true })}
                           </div>
                        </td>
                        <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                          <a href={doc.documentUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '13px' }}>
                            <Download size={14} /> Download
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          ))
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .folder-card summary::-webkit-details-marker { display: none; }
        .folder-card[open] summary .details-chevron { transform: rotate(90deg); }
        .details-chevron { transition: transform 0.2s ease-in-out; }
        .hover-bg-surface-hover:hover { background: var(--surface-hover) !important; }
      `}} />
    </div>
  )
}
