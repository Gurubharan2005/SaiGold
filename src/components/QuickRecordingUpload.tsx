'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, Upload, X, Loader2, CheckCircle, AlertTriangle, Terminal, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react'
import { upload } from '@vercel/blob/client'

interface Props {
  customerId: string
  customerName: string
  onUploadDone?: () => void
}

/**
 * ENTERPRISE SIGNED UPLOAD COMPONENT
 * Architecture: Frontend → Handshake (/api/upload-audio) → Signed Token → Blob
 * This avoids all serverless body limits and is fully secure.
 */
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

    addLog(`Initiating Enterprise sync for ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)...`)

    try {
      /**
       * STEP 1: Handshake
       * Frontend → API (/api/upload-audio)
       */
      addLog('Step 1: Requesting Signed Upload Handshake...')
      const extension = file.name.split('.').pop() || 'mp3'
      const simplifiedPath = `recordings/customer_${customerId}/${Date.now()}.${extension}`

      const blob = await upload(simplifiedPath, file, {
        access: 'private',
        contentType: file.type || 'audio/mpeg',
        handleUploadUrl: '/api/upload-audio', // Pointing to the new 'Enterprise Safe' endpoint
        onUploadProgress: (ev) => {
          setProgress(Math.round(ev.percentage))
          if (ev.percentage === 0) addLog('Step 2: Handshake Success! Signed token received.')
          if (ev.percentage % 25 === 0 && ev.percentage > 0) {
            addLog(`Step 3: Transferring bits... ${Math.round(ev.percentage)}% complete`)
          }
        }
      })

      addLog('Step 4: Secure storage transfer success! Finalizing metadata...')

      /**
       * STEP 2: Database Sync
       * Save results to Neon PostgreSQL
       */
      const res = await fetch(`/api/customers/${customerId}/recordings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioUrl: blob.url,
          label: label.trim() || `Call - ${new Date().toLocaleDateString('en-IN')}`,
        }),
      })

      if (!res.ok) {
        const d = await res.json().catch(() => ({ error: 'Database Handshake Failed' }))
        throw new Error(d.error || `Server Error ${res.status}`)
      }

      addLog('Step 5: SYNC COMPLETED! Data is secure.')
      setDone(true)
      setLabel('')
      
      setTimeout(() => {
        setDone(false)
        setOpen(false)
        setShowLogs(false)
        onUploadDone?.()
      }, 3000)

    } catch (e: any) {
      addLog(`CRITICAL ERROR during handshake/sync: ${e.message}`)
      console.error('[Enterprise-Sync] Failure:', e)
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
          padding: '6px 14px', background: 'rgba(56,189,248,0.1)',
          border: '1px solid rgba(56,189,248,0.3)', borderRadius: '12px',
          fontSize: '12px', fontWeight: 700, color: '#38BDF8',
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
      boxShadow: '0 20px 80px rgba(0,0,0,0.6)',
      marginTop: '16px',
      borderTop: '4px solid #38BDF8',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2 }}>
        <span style={{ fontSize: '15px', fontWeight: 900, color: '#38BDF8', display: 'flex', alignItems: 'center', gap: '10px', letterSpacing: '0.5px' }}>
          <ShieldCheck size={18} /> ENTERPRISE SYNC
        </span>
        <button 
          onClick={() => { setOpen(false); setError(null); setDone(false); setShowLogs(false); }} 
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '6px' }}
        >
          <X size={20} />
        </button>
      </div>

      {!done && !uploading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Call Reference Note</label>
          <input
            type="text"
            placeholder="e.g. Call regarding gold valuation..."
            value={label}
            onChange={e => setLabel(e.target.value)}
            style={{ 
              fontSize: '15px', padding: '14px', borderRadius: '14px', 
              border: '2px solid var(--border-color)', background: 'rgba(255,255,255,0.03)', 
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '24px', color: '#10B981', fontWeight: 900, fontSize: '16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.2)', transition: 'all 0.5s scale(1.05)' }}>
          <CheckCircle size={24} /> SECURELY SYNCED
        </div>
      ) : uploading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '14px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#38BDF8', fontWeight: 800 }}>
              <Loader2 size={18} className="animate-spin" /> {progress < 100 ? `SYNCING...` : 'HANDSHAKE...'}
            </span>
            <span style={{ fontWeight: 900, color: 'var(--text-primary)' }}>{progress}%</span>
          </div>
          <div style={{ background: 'rgba(56,189,248,0.05)', borderRadius: '12px', height: '12px', overflow: 'hidden', border: '1px solid rgba(56,189,248,0.1)' }}>
            <div style={{ background: 'linear-gradient(90deg, #38BDF8, #0ea5e9)', height: '100%', width: `${progress}%`, transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 0 15px rgba(56,189,248,0.4)' }} />
          </div>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
            padding: '18px', background: '#38BDF8', border: 'none',
            borderRadius: '16px', color: '#111', fontWeight: 900, cursor: 'pointer', 
            fontSize: '15px', width: '100%', boxShadow: '0 10px 30px rgba(56,189,248,0.3)',
            textTransform: 'uppercase', transition: 'all 0.2s', letterSpacing: '1px'
          }}
        >
          <Upload size={20} /> Start Secure Upload
        </button>
      )}

      {/* Live Sync Log Console */}
      {(uploading || logs.length > 0) && (
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <button 
            onClick={() => setShowLogs(!showLogs)}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: 0, fontWeight: 700 }}
          >
            <Terminal size={14} /> SECURITY CONSOLE {showLogs ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          
          {showLogs && (
            <div style={{ 
              marginTop: '12px', padding: '14px', background: 'rgba(0,0,0,0.8)', color: '#38BDF8', 
              fontFamily: '"JetBrains Mono", "Fira Code", monospace', fontSize: '10px', borderRadius: '16px', 
              maxHeight: '140px', overflowY: 'auto', whiteSpace: 'pre-wrap', border: '1px solid rgba(56,189,248,0.1)',
              lineHeight: '1.5'
            }}>
              {logs.map((log, i) => (
                <div key={i} style={{ marginBottom: '4px', borderLeft: '2px solid rgba(56,189,248,0.3)', paddingLeft: '8px' }}>{log}</div>
              ))}
              <div ref={logEndRef} />
            </div>
          )}
        </div>
      )}

      {error && (
        <div style={{ 
          fontSize: '13px', color: '#F87171', background: 'rgba(248,113,113,0.05)', 
          padding: '18px', borderRadius: '18px', border: '1px solid rgba(248,113,113,0.1)',
          display: 'flex', flexDirection: 'column', gap: '12px', transition: 'all 0.3s'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px' }}>SECURITY ABORT</span>
              <span>{error.message}</span>
            </div>
          </div>
          {error.message?.toLowerCase().includes('logout') ? (
            <button 
              onClick={async () => {
                document.cookie = 'session-active=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
                localStorage.removeItem('isLoggedIn')
                await fetch('/api/auth/logout', { method: 'POST' })
                window.location.replace('/')
              }}
              style={{ background: '#F87171', border: 'none', color: '#fff', padding: '12px', borderRadius: '12px', fontSize: '12px', fontWeight: 900, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px', width: '100%' }}
            >
              Log Out & Refresh Session
            </button>
          ) : (
            <button 
              onClick={() => { setError(null); fileInputRef.current?.click(); }}
              style={{ background: '#F87171', border: 'none', color: '#fff', padding: '12px', borderRadius: '12px', fontSize: '12px', fontWeight: 900, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px' }}
            >
              Retry Handshake
            </button>
          )}
        </div>
      )}
    </div>
  )
}
