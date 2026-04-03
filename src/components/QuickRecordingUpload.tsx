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
      // Step 1: Upload directly to Vercel Blob (bypasses 4.5MB server limit)
      // Path format: recordings/customer_ID/TIMESTAMP_FILENAME
      const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const blob = await upload(
        `recordings/customer_${customerId}/${Date.now()}_${safeFileName}`,
        file,
        {
          access: 'public',
          handleUploadUrl: '/api/recordings/upload-token', // Securely get a token for this file
          onUploadProgress: (ev) => {
            setProgress(Math.round(ev.percentage))
          }
        }
      )

      console.log('[Upload] Direct blob upload success:', blob.url)

      // Step 2: Save the URL to our database
      const res = await fetch(`/api/customers/${customerId}/recordings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioUrl: blob.url,
          label: label.trim() || `Call - ${new Date().toLocaleDateString('en-IN')}`,
        }),
      })

      if (!res.ok) {
        const d = await res.json().catch(() => ({ error: 'DB save failed' }))
        throw new Error(d.error || 'Failed to save recording to database.')
      }

      setDone(true)
      setLabel('')
      setTimeout(() => {
        setDone(false)
        setOpen(false)
        onUploadDone?.()
      }, 2000)

    } catch (e: any) {
      console.error('[Upload] Error:', e)
      setError(e.message || 'Upload failed. Please check your connection.')
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title="Add call recording"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '4px',
          padding: '5px 10px', background: 'rgba(245,158,11,0.1)',
          border: '1px solid rgba(245,158,11,0.3)', borderRadius: '999px',
          fontSize: '11px', fontWeight: 700, color: '#F59E0B',
          cursor: 'pointer', transition: 'all 0.2s', width: 'auto'
        }}
      >
        <Mic size={11} /> Add Recording
      </button>
    )
  }

  return (
    <div style={{
      background: 'var(--surface-hover)',
      border: '1px solid var(--border-color)',
      borderRadius: '10px',
      padding: '12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      width: '100%',
      maxWidth: '300px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Mic size={11} /> Recording for {customerName}
        </span>
        <button 
          onClick={() => { setOpen(false); setError(''); setDone(false); }} 
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '2px' }}
        >
          <X size={14} />
        </button>
      </div>

      <input
        type="text"
        placeholder="Call label (optional)"
        value={label}
        onChange={e => setLabel(e.target.value)}
        disabled={uploading}
        style={{ fontSize: '12px', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', width: '100%' }}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,video/mp4"
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f) }}
      />

      {done ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', color: '#10B981', fontWeight: 700, fontSize: '12px' }}>
          <CheckCircle size={14} /> Saved and Ready
        </div>
      ) : uploading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Loader2 size={12} className="animate-spin" /> {progress < 100 ? 'Uploading...' : 'Finalizing...'}
            </span>
            <span>{progress}%</span>
          </div>
          <div style={{ background: 'var(--border-color)', borderRadius: '4px', height: '4px', overflow: 'hidden' }}>
            <div style={{ background: 'var(--primary-color)', height: '100%', width: `${progress}%`, transition: 'width 0.3s' }} />
          </div>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            padding: '8px', background: 'var(--primary-color)', border: 'none',
            borderRadius: '6px', color: '#111', fontWeight: 700, cursor: 'pointer', fontSize: '12px', width: '100%'
          }}
        >
          <Upload size={13} /> {error ? 'Try Again' : 'Select Audio File'}
        </button>
      )}

      {error && (
        <div style={{ fontSize: '10px', color: '#EF4444', display: 'flex', alignItems: 'flex-start', gap: '4px', lineHeight: 1.4 }}>
          <AlertTriangle size={12} style={{ marginTop: '1px', flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
