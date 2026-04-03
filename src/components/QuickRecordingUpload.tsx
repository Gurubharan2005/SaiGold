'use client'

import { useState, useRef } from 'react'
import { Mic, Upload, X, Loader2, CheckCircle } from 'lucide-react'
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
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (file: File) => {
    setUploading(true)
    setProgress(0)
    setError('')

    try {
      // Step 1: Upload directly to Vercel Blob (bypasses 4.5MB Next.js API limit)
      const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const blob = await upload(
        `recordings/customer_${customerId}/${Date.now()}_${safeFileName}`,
        file,
        {
          access: 'public',
          handleUploadUrl: `/api/customers/${customerId}/recordings/upload`,
          onUploadProgress: (ev) => {
            setProgress(Math.round(ev.percentage))
          },
          clientPayload: JSON.stringify({ label: label.trim() || null }),
        }
      )

      console.log('[Upload] Blob URL:', blob.url)

      // Step 2: Save label + URL to database via API (small JSON, no size issue)
      const autoLabel = label.trim() || `Call – ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`

      const res = await fetch(`/api/customers/${customerId}/recordings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioUrl: blob.url, label: autoLabel }),
      })

      if (!res.ok) {
        const d = await res.json().catch(() => ({ error: 'Save failed' }))
        setError(d.error || 'Failed to save recording')
        return
      }

      setDone(true)
      setLabel('')
      setTimeout(() => { setDone(false); setOpen(false); onUploadDone?.() }, 2000)

    } catch (e: any) {
      console.error('[Upload] Error:', e)
      setError(e.message || 'Upload failed. Please try again.')
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
          cursor: 'pointer', transition: 'all 0.2s'
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
      gap: '8px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Mic size={12} /> Upload Recording for {customerName}
        </span>
        <button onClick={() => { setOpen(false); setError('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '2px' }}>
          <X size={14} />
        </button>
      </div>

      <input
        type="text"
        placeholder="Label (optional, e.g. Follow Up Call)"
        value={label}
        onChange={e => setLabel(e.target.value)}
        style={{ fontSize: '12px', padding: '8px', width: '100%' }}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".mp3,.mp4,.wav,.ogg,.webm,.m4a,.aac,.flac,audio/*"
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f) }}
      />

      {done ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '8px', color: '#10B981', fontWeight: 700, fontSize: '13px' }}>
          <CheckCircle size={16} /> Saved!
        </div>
      ) : uploading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <Loader2 size={13} className="animate-spin" />
            Uploading... {progress > 0 && `${progress}%`}
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
            padding: '9px', background: 'var(--primary-color)', border: 'none',
            borderRadius: '8px', color: '#111', fontWeight: 700, cursor: 'pointer', fontSize: '12px'
          }}
        >
          <Upload size={13} /> Choose Audio File
        </button>
      )}

      {error && (
        <p style={{ margin: 0, fontSize: '11px', color: '#EF4444', lineHeight: 1.4 }}>
          ⚠️ {error}
        </p>
      )}
    </div>
  )
}
