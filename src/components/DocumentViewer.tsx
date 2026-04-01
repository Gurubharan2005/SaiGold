'use client'

import { ArrowLeft, Download, FileText, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default function DocumentViewer({ url, name, type }: { url: string, name?: string, type?: string }) {
  const isImage = url.match(/\.(jpeg|jpg|gif|png|webp)/i) || type?.toLowerCase().includes('photo') || type?.toLowerCase().includes('image')
  const isPdf = url.match(/\.pdf/i) || type?.toLowerCase().includes('pdf')

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)', minHeight: '600px' }}>
      {/* Viewer Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '16px 24px', 
        background: 'var(--surface-color)', 
        borderBottom: '1px solid var(--border-color)',
        borderRadius: '12px 12px 0 0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link 
            href="/dashboard/sales" 
            className="btn-secondary" 
            style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}
          >
            <ArrowLeft size={18} /> Back to Desk
          </Link>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 700, fontSize: '16px' }}>{type || 'Document Preview'}</span>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{name || 'Compliance File'}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
           <a href={url} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ padding: '8px 12px', fontSize: '13px', gap: '8px' }}>
             <ExternalLink size={16} /> Open Original
           </a>
           <a href={url} download={name || 'document'} className="btn-primary" style={{ padding: '8px 16px', fontSize: '13px', gap: '8px' }}>
             <Download size={16} /> Download
           </a>
        </div>
      </div>

      {/* Main Viewer Area */}
      <div style={{ 
        flex: 1, 
        background: '#000', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        overflow: 'hidden',
        borderRadius: '0 0 12px 12px',
        position: 'relative'
      }}>
        {isImage ? (
          <img 
            src={url} 
            alt={name || 'Document'} 
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
          />
        ) : isPdf ? (
          <iframe 
            src={`${url}#toolbar=0`} 
            style={{ width: '100%', height: '100%', border: 'none' }} 
            title="PDF Viewer"
          />
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
             <FileText size={48} strokeWidth={1} />
             <p>Preview not available for this file type.</p>
             <a href={url} target="_blank" rel="noopener noreferrer" className="btn-primary">Download to View</a>
          </div>
        )}
      </div>
    </div>
  )
}
