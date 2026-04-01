'use client'

import { ArrowLeft, Download, FileText, ExternalLink, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export default function DocumentViewer({ url, name, type }: { url: string, name?: string, type?: string }) {
  const [loading, setLoading] = useState(true)
  const isImage = url.match(/\.(jpeg|jpg|gif|png|webp)/i) || type?.toLowerCase().includes('photo') || type?.toLowerCase().includes('image')
  const isPdf = url.match(/\.pdf/i) || type?.toLowerCase().includes('pdf')

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', minHeight: '85vh', maxHeight: '90vh' }}>
      {/* Viewer Header - Responsive Reflow */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '12px 16px', 
        background: 'var(--surface-color)', 
        borderBottom: '1px solid var(--border-color)',
        borderRadius: '12px 12px 0 0',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 200px' }}>
          <Link 
            href="/dashboard/sales" 
            className="btn-secondary" 
            style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}
          >
            <ArrowLeft size={16} /> <span className="hide-mobile">Back</span>
          </Link>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span style={{ fontWeight: 700, fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{type || 'Document'}</span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name || 'File'}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flex: '1 1 auto' }}>
           <a href={url} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ padding: '8px', borderRadius: '8px' }} title="Open Original">
             <ExternalLink size={18} />
           </a>
           <a href={url} download={name || 'document'} className="btn-primary" style={{ padding: '8px 16px', fontSize: '13px', gap: '8px' }}>
             <Download size={16} /> <span>Download</span>
           </a>
        </div>
      </div>

      {/* Main Viewer Area - Flexible Responsive Container */}
      <div style={{ 
        flex: 1, 
        background: '#090e1a', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        overflow: 'hidden',
        borderRadius: '0 0 12px 12px',
        position: 'relative',
        minHeight: '500px'
      }}>
        {loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, background: '#000' }}>
            <RefreshCw className="animate-spin" size={32} color="var(--primary-color)" />
          </div>
        )}

        {isImage ? (
          <img 
            src={url} 
            alt={name || 'Document'} 
            onLoad={() => setLoading(false)}
            key={url}
            style={{ maxWidth: '98%', maxHeight: '98%', objectFit: 'contain', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', borderRadius: '4px' }} 
            onError={(e) => {
              setLoading(false);
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.style.display = 'none';
            }}
          />
        ) : (
          <iframe 
            src={`${url}#toolbar=0&navpanes=0`} 
            onLoad={() => setLoading(false)}
            style={{ width: '100%', height: '100%', border: 'none' }} 
            title="Document Viewer"
          />
        )}

        {/* Fallback Display (Shown if neither image nor iframe works) */}
        {!isImage && !isPdf && !loading && (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '20px' }}>
             <FileText size={48} strokeWidth={1} />
             <p>Direct preview is restricted. Use the buttons above to download or open the file.</p>
          </div>
        )}
      </div>
    </div>
  )
}
