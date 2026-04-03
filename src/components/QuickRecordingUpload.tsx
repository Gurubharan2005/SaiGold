'use client'

import { useState, useRef } from 'react'
import { Mic, Upload, X, Loader2, CheckCircle, AlertTriangle } from 'lucide-react'
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
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (file: File) => {
    setUploading(true)
    setProgress(0)
    setError('')
    setDone(false)

    try {
      console.log(`[Upload] Starting for ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`)
      
      // Step 1: Direct-to-Blob Upload
      // Using a simplified filename to avoid any special character issues on mobile
      const extension = file.name.split('.').pop() || 'mp3'
      const simplifiedPath = `recordings/customer_${customerId}/${Date.now()}.${extension}`

      const blob = await upload(simplifiedPath, file, {
        access: 'public',
        handleUploadUrl: '/api/recordings/upload-token',
        onUploadProgress: (ev) => {
          setProgress(Math.round(ev.percentage))
          console.log(`[Upload] Progress: ${ev.percentage}%`)
        }
      })

      console.log('[Upload] Blob success:', blob.url)

      // Step 2: Save metadata to DB
      // We use a small JSON POST now - very fast
      const res = await fetch(`/api/customers/${customerId}/recordings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioUrl: blob.url,
          label: label.trim() || `Call - ${new Date().toLocaleDateString('en-IN')}`,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'DB Save Failed' }))
        throw new Error(`DB Save Failed: ${errorData.error || res.statusText}`)
      }

      setDone(true)
      setLabel('')
      setTimeout(() => {
        setDone(false)
        setOpen(false)
        onUploadDone?.()
      }, 2000)

    } catch (e: any) {
      console.error('[Upload] Full Error:', e)
      // Display the most helpful error possible
      const msg = e.message || 'Upload failed'
      setError(msg.includes('fetch') ? 'Network error (Check your signal)' : msg)
    } finally {
      setUploading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="btn-primary"
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
      borderRadius: '16px',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      width: '100%',
      maxWidth: '320px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      marginTop: '8px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Mic size={14} /> Recording for {customerName}
        </span>
        <button 
          onClick={() => { setOpen(false); setError(''); setDone(false); }} 
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px' }}
        >
          <X size={18} />
        </button>
      </div>

      {!done && !uploading && (
        <input
          type="text"
          placeholder="What was this call about?"
          value={label}
          onChange={e => setLabel(e.target.value)}
          style={{ 
            fontSize: '13px', padding: '10px 12px', borderRadius: '10px', 
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', color: '#10B981', fontWeight: 700, fontSize: '14px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '10px' }}>
          <CheckCircle size={18} /> Recording Saved!
        </div>
      ) : uploading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '8px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Loader2 size={14} className="animate-spin" /> {progress < 100 ? `Uploading...` : 'Almost done...'}
            </span>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{progress}%</span>
          </div>
          <div style={{ background: 'var(--border-color)', borderRadius: '6px', height: '8px', overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(90deg, var(--primary-color), #F59E0B)', height: '100%', width: `${progress}%`, transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }} />
          </div>
          <p style={{ fontSize: '10px', color: 'var(--text-secondary)', textAlign: 'center' }}>Please don't close this window</p>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: '12px', background: 'var(--primary-color)', border: 'none',
            borderRadius: '12px', color: '#111', fontWeight: 800, cursor: 'pointer', 
            fontSize: '13px', width: '100%', boxShadow: '0 4px 12px rgba(245,158,11,0.2)'
          }}
        >
          <Upload size={16} /> Choose Call Recording
        </button>
      )}

      {error && (
        <div style={{ 
          fontSize: '11px', color: '#EF4444', background: 'rgba(239,68,68,0.1)', 
          padding: '10px', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.2)',
          display: 'flex', alignItems: 'flex-start', gap: '8px'
        }}>
          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontWeight: 700 }}>Upload Error</span>
            <span>{error}</span>
            <button 
              onClick={() => { setError(''); fileInputRef.current?.click(); }}
              style={{ background: 'none', border: 'none', color: '#EF4444', textDecoration: 'underline', padding: 0, fontSize: '10px', cursor: 'pointer', textAlign: 'left', marginTop: '4px' }}
            >
              Click here to try again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
