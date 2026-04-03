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
  const [stage, setStage] = useState<'idle' | 'uploading' | 'saving' | 'done' | 'error'>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setUploading(false)
    setStage('idle')
    setProgress(0)
    setError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleUpload = async (file: File) => {
    setUploading(true)
    setStage('uploading')
    setProgress(0)
    setError('')

    let blobUrl = ''

    try {
      // ── Step 1: Upload file directly to Vercel Blob ──
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
        }
      )
      blobUrl = blob.url
      console.log('[Upload] Blob URL:', blobUrl)
    } catch (e: any) {
      console.error('[Upload] Blob error:', e)
      setStage('error')
      setError(`Upload failed: ${e.message || 'Could not reach storage. Check your connection.'}`)
      setUploading(false)
      return
    }

    // ── Step 2: Save URL + label to database ──
    setStage('saving')
    const autoLabel = label.trim() ||
      `Call – ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15000) // 15s timeout

      const res = await fetch(`/api/customers/${customerId}/recordings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioUrl: blobUrl, label: autoLabel }),
        signal: controller.signal,
      })
      clearTimeout(timeout)

      if (!res.ok) {
        const d = await res.json().catch(() => ({ error: 'Database save failed' }))
        throw new Error(d.error || `Server error (${res.status})`)
      }

      // ── Success ──
      setStage('done')
      setLabel('')
      onUploadDone?.()
      setTimeout(() => { reset(); setOpen(false) }, 2000)

    } catch (e: any) {
      console.error('[Upload] DB save error:', e)
      setStage('error')
      if (e.name === 'AbortError') {
        setError('Timed out saving to database. File is uploaded — please try again.')
      } else {
        setError(`Saved to storage but DB failed: ${e.message}`)
      }
    } finally {
      setUploading(false)
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
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Mic size={12} /> Upload Recording for {customerName}
        </span>
        <button
          onClick={() => { reset(); setOpen(false) }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '2px' }}
          disabled={uploading}
        >
          <X size={14} />
        </button>
      </div>

      {/* Label input — only show when idle */}
      {stage === 'idle' && (
        <input
          type="text"
          placeholder="Label (optional, e.g. Follow Up Call)"
          value={label}
          onChange={e => setLabel(e.target.value)}
          style={{ fontSize: '12px', padding: '8px', width: '100%' }}
        />
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".mp3,.mp4,.wav,.ogg,.webm,.m4a,.aac,.flac,audio/*"
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f) }}
      />

      {/* Status area */}
      {stage === 'done' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', color: '#10B981', fontWeight: 700, fontSize: '13px' }}>
          <CheckCircle size={16} /> Saved successfully!
        </div>
      )}

      {stage === 'uploading' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <Loader2 size={13} className="animate-spin" />
            Uploading file... {progress}%
          </div>
          <div style={{ background: 'var(--border-color)', borderRadius: '4px', height: '5px', overflow: 'hidden' }}>
            <div style={{ background: 'var(--primary-color)', height: '100%', width: `${progress}%`, transition: 'width 0.3s ease' }} />
          </div>
        </div>
      )}

      {stage === 'saving' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)', padding: '4px 0' }}>
          <Loader2 size={13} className="animate-spin" />
          Saving to database...
        </div>
      )}

      {stage === 'error' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '11px', color: '#EF4444', lineHeight: 1.4 }}>
            <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: '1px' }} />
            {error}
          </div>
          <button
            onClick={reset}
            style={{ fontSize: '11px', padding: '6px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', color: '#EF4444', cursor: 'pointer' }}
          >
            Try Again
          </button>
        </div>
      )}

      {stage === 'idle' && (
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
    </div>
  )
}
