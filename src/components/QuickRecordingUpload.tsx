'use client'

import { useState, useRef } from 'react'
import { Mic, Upload, X, Loader2, CheckCircle, AlertTriangle, Bug } from 'lucide-react'
import { upload } from '@vercel/blob/client'

interface Props {
  customerId: string
  customerName: string
  onUploadDone?: () => void
}

export default function QuickRecordingUpload({ customerId, customerName, onUploadDone }: Props) {
  const [open, setOpen] = useState(false)
  const [label, setLabel] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<any>(null)
  const [done, setDone] = useState(false)
  const [showDebug, setShowDebug] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (file: File) => {
    setUploading(true)
    setProgress(0)
    setError(null)
    setDone(false)
    setShowDebug(false)

    try {
      console.log(`[Deep-Investigate][Upload] Starting for ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`)
      
      // Step 1: Direct-to-Blob Upload (Resilient)
      const extension = file.name.split('.').pop() || 'mp3'
      const simplifiedPath = `recordings/customer_${customerId}/${Date.now()}.${extension}`

      const blob = await upload(simplifiedPath, file, {
        access: 'public',
        handleUploadUrl: '/api/recordings/upload-token',
        onUploadProgress: (ev) => {
          setProgress(Math.round(ev.percentage))
        }
      })

      console.log('[Deep-Investigate][Upload] Blob Success:', blob.url)

      // Step 2: Persistent Metadata Save
      const res = await fetch(`/api/customers/${customerId}/recordings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioUrl: blob.url,
          label: label.trim() || `Call - ${new Date().toLocaleDateString('en-IN')}`,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Database handshake failed' }))
        throw new Error(errorData.error || `Server Error ${res.status}`)
      }

      setDone(true)
      setLabel('')
      setTimeout(() => {
        setDone(false)
        setOpen(false)
        onUploadDone?.()
      }, 2000)

    } catch (e: any) {
      console.error('[Deep-Investigate][Upload] Critical Failure:', e)
      // Capture the full error for the debug window
      setError({
        message: e.message || 'Unknown Upload error',
        stack: e.stack,
        type: e.name || 'Error',
        timestamp: new Date().toISOString()
      })
    } finally {
      setUploading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '6px 14px', background: 'rgba(245,158,11,0.1)',
          border: '1px solid rgba(245,158,11,0.3)', borderRadius: '12px',
          fontSize: '12px', fontWeight: 700, color: '#F59E0B',
          cursor: 'pointer', transition: 'all 0.2s', width: 'auto'
        }}
      >
        <Mic size={13} /> Add Recording
      </button>
    )
  }

  return (
    <div className="fade-in" style={{
      background: 'var(--surface-hover)',
      border: '1px solid var(--border-color)',
      borderRadius: '20px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      width: '100%',
      maxWidth: '350px',
      boxShadow: '0 12px 48px rgba(0,0,0,0.3)',
      marginTop: '12px',
      backdropFilter: 'blur(10px)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Mic size={16} /> Recording for {customerName}
        </span>
        <button 
          onClick={() => { setOpen(false); setError(null); setDone(false); }} 
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px' }}
        >
          <X size={20} />
        </button>
      </div>

      {!done && !uploading && (
        <input
          type="text"
          placeholder="What was this call about?"
          value={label}
          onChange={e => setLabel(e.target.value)}
          style={{ 
            fontSize: '14px', padding: '12px 14px', borderRadius: '12px', 
            border: '1px solid var(--border-color)', background: 'var(--surface-color)', 
            width: '100%', color: 'var(--text-primary)' 
          }}
        />
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".mp3, .m4a, .wav, .amr, .aac, audio/*, video/mp4"
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f) }}
      />

      {done ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '16px', color: '#10B981', fontWeight: 800, fontSize: '15px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px' }}>
          <CheckCircle size={20} /> Successfully Saved!
        </div>
      ) : uploading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
              <Loader2 size={16} className="animate-spin" /> {progress < 100 ? `Syncing File...` : 'Finalizing...'}
            </span>
            <span style={{ fontWeight: 800, color: 'var(--primary-color)' }}>{progress}%</span>
          </div>
          <div style={{ background: 'var(--border-color)', borderRadius: '8px', height: '10px', overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(90deg, #F59E0B, #FFB800)', height: '100%', width: `${progress}%`, transition: 'width 0.5s' }} />
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center' }}>Keep window open during sync</p>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            padding: '14px', background: 'var(--primary-color)', border: 'none',
            borderRadius: '14px', color: '#111', fontWeight: 900, cursor: 'pointer', 
            fontSize: '14px', width: '100%', boxShadow: '0 6px 20px rgba(245,158,11,0.25)',
            textTransform: 'uppercase', letterSpacing: '0.5px'
          }}
        >
          <Upload size={18} /> Select Recording
        </button>
      )}

      {error && (
        <div style={{ 
          fontSize: '12px', color: '#EF4444', background: 'rgba(239,68,68,0.1)', 
          padding: '12px', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.2)',
          display: 'flex', flexDirection: 'column', gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontWeight: 800 }}>Sync Error</span>
              <span>{error.message}</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <button 
              onClick={() => { setError(null); fileInputRef.current?.click(); }}
              style={{ background: '#EF4444', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
            >
              Retry Sync
            </button>
            <button 
              onClick={() => setShowDebug(!showDebug)}
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Bug size={12} /> {showDebug ? 'Hide Details' : 'View Technical Details'}
            </button>
          </div>

          {showDebug && (
            <div style={{ 
              marginTop: '8px', padding: '10px', background: '#000', color: '#0f0', 
              fontFamily: 'monospace', fontSize: '10px', borderRadius: '6px', 
              maxHeight: '150px', overflowY: 'auto', whiteSpace: 'pre-wrap', border: '1px solid #333'
            }}>
              {JSON.stringify(error, null, 2)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
