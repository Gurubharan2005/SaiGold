'use client'

import { useState, useRef } from 'react'
import { Mic, Upload, X, Loader2, CheckCircle } from 'lucide-react'

interface Props {
  customerId: string
  customerName: string
}

export default function QuickRecordingUpload({ customerId, customerName }: Props) {
  const [open, setOpen] = useState(false)
  const [label, setLabel] = useState('')
  const [uploading, setUploading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (file: File) => {
    setUploading(true)
    setError('')
    const form = new FormData()
    form.append('file', file)
    const autoLabel = label.trim() || `Call – ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
    form.append('label', autoLabel)

    const res = await fetch(`/api/customers/${customerId}/recordings`, { method: 'POST', body: form })
    if (res.ok) {
      setDone(true)
      setLabel('')
      if (fileInputRef.current) fileInputRef.current.value = ''
      setTimeout(() => { setDone(false); setOpen(false) }, 2000)
    } else {
      const d = await res.json()
      setError(d.error || 'Upload failed')
    }
    setUploading(false)
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
        <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '2px' }}>
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
        accept=".mp3,.mp4,.wav,.ogg,.webm,.m4a,audio/*"
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f) }}
      />

      {done ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '8px', color: '#10B981', fontWeight: 700, fontSize: '13px' }}>
          <CheckCircle size={16} /> Saved!
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            padding: '9px', background: 'var(--primary-color)', border: 'none',
            borderRadius: '8px', color: '#111', fontWeight: 700, cursor: 'pointer', fontSize: '12px'
          }}
        >
          {uploading ? <><Loader2 size={13} className="animate-spin" /> Uploading...</> : <><Upload size={13} /> Choose Audio File</>}
        </button>
      )}

      {error && <p style={{ margin: 0, fontSize: '11px', color: '#EF4444' }}>{error}</p>}
    </div>
  )
}
