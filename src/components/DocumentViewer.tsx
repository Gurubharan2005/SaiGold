'use client'

import { ArrowLeft, Download, FileText, ExternalLink, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export default function DocumentViewer({ url, name, type }: { url: string, name?: string, type?: string }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // 1. Sanitize the URL for safe rendering in src attributes
  // First decode any double-encoding, then use encodeURI for characters like spaces
  const sanitizedUrl = encodeURI(decodeURIComponent(url))

  // 2. Refined detection that handles URLs with query params/hashes correctly
  const isImage = sanitizedUrl.match(/\.(jpeg|jpg|gif|png|webp)(\?|#|$)/i) || 
                  type?.toLowerCase().includes('photo') || 
                  type?.toLowerCase().includes('image')

  const isPdf = sanitizedUrl.match(/\.pdf(\?|#|$)/i) || 
                type?.toLowerCase().includes('pdf')

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '400px' }}>
      {/* Viewer Header - Responsive Reflow */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '10px 16px', 
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
           <a href={sanitizedUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ padding: '8px', borderRadius: '8px' }} title="Open Original">
             <ExternalLink size={18} />
           </a>
           <a href={sanitizedUrl} download={name || 'document'} className="btn-primary" style={{ padding: '8px 16px', fontSize: '13px', gap: '8px' }}>
             <Download size={16} /> <span>Download</span>
           </a>
        </div>
      </div>

      {/* Main Viewer Area - Flexible Responsive Container */}
      <div style={{ 
        flex: 1, 
        background: '#04070d', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        overflow: 'hidden',
        borderRadius: '0 0 12px 12px',
        position: 'relative',
        height: 'calc(100vh - 200px)',
      }}>
        {loading && !error && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, background: '#04070d' }}>
            <RefreshCw className="animate-spin" size={32} color="var(--primary-color)" />
          </div>
        )}

        {error ? (
           <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>
              <FileText size={48} strokeWidth={1} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <p style={{ margin: '0 0 16px 0' }}>Security block or invalid format.</p>
              <a href={sanitizedUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">
                Open in New Tab
              </a>
           </div>
        ) : isImage ? (
          <img 
            src={sanitizedUrl} 
            alt={name || 'Document'} 
            onLoad={() => setLoading(false)}
            referrerPolicy="no-referrer"
            key={sanitizedUrl}
            style={{ maxWidth: '98%', maxHeight: '98%', objectFit: 'contain', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', borderRadius: '4px' }} 
            onError={() => {
              setLoading(false);
              setError(true);
            }}
          />
        ) : (
          <iframe 
            src={`${sanitizedUrl}#toolbar=0&navpanes=0`} 
            onLoad={() => setLoading(false)}
            referrerPolicy="no-referrer"
            style={{ width: '100%', height: '100%', border: 'none' }} 
            title="Document Viewer"
            key={sanitizedUrl}
          />
        )}

        {/* Fallback Display - Visual Cue for mobile users */}
        {!loading && !error && (
          <div style={{ position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)', zIndex: 100, width: '90%', maxWidth: '300px' }}>
             <a href={sanitizedUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '8px 16px', borderRadius: '24px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
               <ExternalLink size={14} /> Full Screen Preview
             </a>
          </div>
        )}
      </div>
    </div>
  )
}
