'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, Upload, X, Loader2, CheckCircle, AlertTriangle, Terminal, ChevronDown, ChevronUp } from 'lucide-react'
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
  const [logs, setLogs] = useState<string[]>([])
  const [showLogs, setShowLogs] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const logEndRef = useRef<HTMLDivElement>(null)

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`])
  }

  useEffect(() => {
    if (showLogs) logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs, showLogs])

  const handleUpload = async (file: File) => {
    setUploading(true)
    setProgress(0)
    setError(null)
    setDone(false)
    setLogs([])
    setShowLogs(true)

    addLog(`Initiating sync for ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)...`)

    try {
      // Step 1: Handshake with Edge Runtime
      addLog('Step 1: Requesting secure Edge handshake...')
      const extension = file.name.split('.').pop() || 'mp3'
      const simplifiedPath = `recordings/customer_${customerId}/${Date.now()}.${extension}`

      const blob = await upload(simplifiedPath, file, {
        access: 'public',
        handleUploadUrl: '/api/recordings/upload-token',
        onUploadProgress: (ev) => {
          setProgress(Math.round(ev.percentage))
          if (ev.percentage % 20 === 0) {
            addLog(`Step 2: Uploading bits... ${Math.round(ev.percentage)}% complete`)
          }
        }
      })

      addLog('Step 3: Storage success! Finalizing metadata...')

      // Step 2: Persistent Metadata Sync
      const res = await fetch(`/api/customers/${customerId}/recordings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioUrl: blob.url,
          label: label.trim() || `Call - ${new Date().toLocaleDateString('en-IN')}`,
        }),
      })

      if (!res.ok) {
        const d = await res.json().catch(() => ({ error: 'Sync Handshake Failed' }))
        throw new Error(d.error || `Server Error ${res.status}`)
      }

      addLog('Step 4: Sync complete! Database updated.')
      setDone(true)
      setLabel('')
      
      setTimeout(() => {
        setDone(false)
        setOpen(false)
        setShowLogs(false)
        onUploadDone?.()
      }, 2500)

    } catch (e: any) {
      addLog(`CRITICAL ERROR: ${e.message}`)
      console.error('[Nuclear-Sync] Failure:', e)
      setError({
        message: e.message || 'Sync failed',
        trace: e.stack,
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
      background: 'var(--surface-color)',
      border: '1px solid var(--border-color)',
      borderRadius: '24px',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      width: '100%',
      maxWidth: '400px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      marginTop: '16px',
      borderTop: '4px solid var(--primary-color)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '15px', fontWeight: 900, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Mic size={18} style={{ color: 'var(--primary-color)' }} /> SYNC RECORDING
        </span>
        <button 
          onClick={() => { setOpen(false); setError(null); setDone(false); setShowLogs(false); }} 
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '6px' }}
        >
          <X size={20} />
        </button>
      </div>

      {!done && !uploading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Call Subject / Note</label>
          <input
            type="text"
            placeholder="e.g. Follow-up about Loan Agreement"
            value={label}
            onChange={e => setLabel(e.target.value)}
            style={{ 
              fontSize: '15px', padding: '14px', borderRadius: '14px', 
              border: '2px solid var(--border-color)', background: 'var(--surface-hover)', 
              width: '100%', color: 'var(--text-primary)', outline: 'none'
            }}
          />
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".mp3, .m4a, .wav, .amr, .aac, audio/*, video/mp4"
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f) }}
      />

      {done ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '20px', color: '#10B981', fontWeight: 900, fontSize: '16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '16px' }}>
          <CheckCircle size={22} /> SYNC COMPLETED
        </div>
      ) : uploading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '14px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary-color)', fontWeight: 700 }}>
              <Loader2 size={18} className="animate-spin" /> {progress < 100 ? `UPLOADING...` : 'FINALIZING...'}
            </span>
            <span style={{ fontWeight: 900, color: 'var(--text-primary)' }}>{progress}%</span>
          </div>
          <div style={{ background: 'var(--border-color)', borderRadius: '10px', height: '14px', overflow: 'hidden', padding: '3px' }}>
            <div style={{ background: 'var(--primary-color)', height: '100%', width: `${progress}%`, transition: 'width 0.4s', borderRadius: '6px' }} />
          </div>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
            padding: '16px', background: 'var(--primary-color)', border: 'none',
            borderRadius: '16px', color: '#111', fontWeight: 900, cursor: 'pointer', 
            fontSize: '15px', width: '100%', boxShadow: '0 8px 24px rgba(245,158,11,0.3)',
            textTransform: 'uppercase'
          }}
        >
          <Upload size={20} /> CHOOSE AUDIO FILE
        </button>
      )}

      {/* Live Technical Log */}
      {(uploading || logs.length > 0) && (
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
          <button 
            onClick={() => setShowLogs(!showLogs)}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: 0 }}
          >
            <Terminal size={14} /> LIVE SYNC LOG {showLogs ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          
          {showLogs && (
            <div style={{ 
              marginTop: '10px', padding: '12px', background: '#000', color: '#10B981', 
              fontFamily: 'monospace', fontSize: '10px', borderRadius: '12px', 
              maxHeight: '120px', overflowY: 'auto', whiteSpace: 'pre-wrap', border: '1px solid #111'
            }}>
              {logs.map((log, i) => (
                <div key={i} style={{ marginBottom: '2px' }}>{log}</div>
              ))}
              <div ref={logEndRef} />
            </div>
          )}
        </div>
      )}

      {error && (
        <div style={{ 
          fontSize: '13px', color: '#EF4444', background: 'rgba(239,68,68,0.1)', 
          padding: '16px', borderRadius: '16px', border: '1px solid rgba(239,68,68,0.2)',
          display: 'flex', flexDirection: 'column', gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontWeight: 900, textTransform: 'uppercase' }}>SYNC FAILED</span>
              <span>{error.message}</span>
            </div>
          </div>
          <button 
            onClick={() => { setError(null); fileInputRef.current?.click(); }}
            style={{ background: '#EF4444', border: 'none', color: '#fff', padding: '10px', borderRadius: '10px', fontSize: '12px', fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase' }}
          >
            RETRY SYNC NOW
          </button>
        </div>
      )}
    </div>
  )
}
