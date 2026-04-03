'use client'

import { useState, useRef } from 'react'
import { Mic, Upload, X, Loader2, CheckCircle, AlertTriangle } from 'lucide-react'

interface Props {
  customerId: string
  customerName: string
  onUploadDone?: () => void
}

export default function QuickRecordingUpload({ customerId, customerName, onUploadDone }: Props) {
  const [open, setOpen] = useState(false)
  const [label, setLabel] = useState('')
  const [stage, setStage] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const xhrRef = useRef<XMLHttpRequest | null>(null)

  const reset = () => {
    setStage('idle')
    setProgress(0)
    setError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleUpload = (file: File) => {
    setStage('uploading')
    setProgress(0)
    setError('')

    const autoLabel = label.trim() ||
      `Call – ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`

    const form = new FormData()
    form.append('file', file)
    form.append('label', autoLabel)

    const xhr = new XMLHttpRequest()
    xhrRef.current = xhr

    // Real-time progress from XHR upload events
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        setProgress(Math.round((e.loaded / e.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status === 200 || xhr.status === 201) {
        setStage('done')
        setLabel('')
        onUploadDone?.()
        setTimeout(() => { reset(); setOpen(false) }, 2000)
      } else {
        let msg = 'Upload failed'
        try {
          const d = JSON.parse(xhr.responseText)
          msg = d.error || msg
        } catch {}
        setStage('error')
        setError(msg)
      }
    }

    xhr.onerror = () => {
      setStage('error')
      setError('Network error. Please check your connection and try again.')
    }

    xhr.ontimeout = () => {
      setStage('error')
      setError('Upload timed out. Try a smaller file or better connection.')
    }

    xhr.timeout = 120000 // 2 minutes max
    xhr.open('POST', `/api/customers/${customerId}/recordings`)
    xhr.send(form)
  }

  const cancelUpload = () => {
    xhrRef.current?.abort()
    reset()
    setOpen(false)
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
          onClick={cancelUpload}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '2px' }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Label — only when idle */}
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

      {/* States */}
      {stage === 'done' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', color: '#10B981', fontWeight: 700, fontSize: '13px' }}>
          <CheckCircle size={16} /> Saved successfully!
        </div>
      )}

      {stage === 'uploading' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Loader2 size={13} className="animate-spin" />
              {progress < 100 ? `Uploading... ${progress}%` : 'Processing...'}
            </span>
            <button onClick={cancelUpload} style={{ fontSize: '10px', color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
          <div style={{ background: 'var(--border-color)', borderRadius: '4px', height: '5px', overflow: 'hidden' }}>
            <div style={{
              background: progress < 100 ? 'var(--primary-color)' : '#10B981',
              height: '100%',
              width: `${progress}%`,
              transition: 'width 0.2s ease'
            }} />
          </div>
        </div>
      )}

      {stage === 'error' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '11px', color: '#EF4444', lineHeight: 1.5 }}>
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
