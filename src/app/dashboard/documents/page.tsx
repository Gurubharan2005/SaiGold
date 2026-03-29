import { prisma } from '@/lib/prisma'
import { FileText, Download, User as UserIcon, Calendar } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function DocumentsOverviewPage() {
  // Fetch all documents across the entire CRM, along with who uploaded them and which customer they belong to
  const documents = await prisma.customerDocument.findMany({
    orderBy: { uploadedAt: 'desc' },
    include: {
      customer: true,
      uploadedBy: true,
    }
  })

  return (
    <div className="fade-in max-w-5xl">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', margin: 0 }}>Global Documents Vault</h1>
        <div className="badge badge-accepted">
          {documents.length} Files Stored
        </div>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>File Source</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Customer Profile</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Uploaded By</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Date Added</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No documents have been uploaded to Vercel Blob yet. Attach a file on an ACCEPTED Customer profile!
                </td>
              </tr>
            ) : (
              documents.map((doc: any) => (
                <tr key={doc.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px', fontWeight: 500 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span className="badge badge-waiting" style={{ alignSelf: 'flex-start', fontSize: '10px' }}>{doc.documentType}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={16} color="var(--primary-color)" />
                        <span style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={doc.documentName}>
                          {doc.documentName}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    {doc.customer ? (
                       <Link href={`/dashboard/customers/${doc.customerId}`} style={{ color: 'var(--text-color)', textDecoration: 'none', fontWeight: 500 }}>
                         {doc.customer.name}
                       </Link>
                    ) : (
                      <span style={{ color: 'var(--status-rejected)' }}>Orphaned File</span>
                    )}
                  </td>
                  <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <UserIcon size={14} /> {doc.uploadedBy ? doc.uploadedBy.name : 'Unknown'}
                     </div>
                  </td>
                  <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} /> {formatDistanceToNow(new Date(doc.uploadedAt), { addSuffix: true })}
                     </div>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <a href={doc.documentUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '13px' }}>
                      <Download size={14} /> Download File
                    </a>
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
