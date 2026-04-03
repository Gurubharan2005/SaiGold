'use client'

import { useState, useRef, useEffect } from 'react'
import { Phone, Mic, Square, Loader2, CheckCircle } from 'lucide-react'

interface Props {
  phone: string
  customerId: string
  customerName: string
}

type State = 'idle' | 'recording' | 'uploading' | 'done' | 'error'

export default function CallWithRecord({ phone, customerId, customerName }: Props) {
  const [state, setState] = useState<State>('idle')
  const [seconds, setSeconds] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []

      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = e => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.start(1000)
      setState('recording')
      setSeconds(0)
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
    } catch {
      setErrorMsg('Mic access denied. Please allow microphone permission.')
      setState('error')
    }
  }

  const handleCallClick = () => {
    // Open phone dialer
    window.location.href = `tel:${phone}`
    // Start recording after brief delay (give dialer time to open)
    setTimeout(() => startRecording(), 1500)
  }

  const stopAndUpload = async () => {
    if (!mediaRecorderRef.current) return

    // Stop timer
    if (timerRef.current) clearInterval(timerRef.current)
    const duration = seconds

    // Stop recording
    mediaRecorderRef.current.stop()
    streamRef.current?.getTracks().forEach(t => t.stop())

    setState('uploading')

    // Wait for final chunk
    await new Promise(resolve => setTimeout(resolve, 500))

    const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
    const now = new Date()
    const label = `Call – ${now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} ${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`

    const form = new FormData()
    form.append('file', blob, `call-${Date.now()}.webm`)
    form.append('label', label)
    form.append('durationSec', String(duration))

    try {
      const res = await fetch(`/api/customers/${customerId}/recordings`, { method: 'POST', body: form })
      if (res.ok) {
        setState('done')
        setTimeout(() => setState('idle'), 3000)
      } else {
        const d = await res.json()
        setErrorMsg(d.error || 'Upload failed')
        setState('error')
      }
    } catch {
      setErrorMsg('Upload failed. Please try again.')
      setState('error')
    }
  }

  if (state === 'recording') {
    return (
      <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
        {/* Recording indicator */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '12px',
          background: 'rgba(239,68,68,0.12)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '12px',
          animation: 'pulse 1.5s infinite',
          fontSize: '13px',
          fontWeight: 600,
          color: '#EF4444'
        }}>
          <span style={{
            display: 'inline-block',
            width: '8px',
            height: '8px',
            background: '#EF4444',
            borderRadius: '50%',
            animation: 'pulse 1s infinite'
          }} />
          <Mic size={14} />
          REC {formatTime(seconds)}
        </div>
        {/* Stop button */}
        <button
          onClick={stopAndUpload}
          title="Stop & Save Recording"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '12px 16px',
            background: '#EF4444',
            border: 'none',
            borderRadius: '12px',
            color: '#fff',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '13px'
          }}
        >
          <Square size={14} fill="white" /> Stop & Save
        </button>
      </div>
    )
  }

  if (state === 'uploading') {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        padding: '12px', background: 'var(--surface-hover)', borderRadius: '12px',
        color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600
      }}>
        <Loader2 size={16} className="animate-spin" /> Saving recording...
      </div>
    )
  }

  if (state === 'done') {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        padding: '12px', background: 'rgba(16,185,129,0.1)', borderRadius: '12px',
        color: '#10B981', fontSize: '13px', fontWeight: 700
      }}>
        <CheckCircle size={16} /> Recording saved! ✓
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <p style={{ margin: 0, fontSize: '12px', color: '#EF4444', textAlign: 'center' }}>{errorMsg}</p>
        <button onClick={() => setState('idle')} style={{
          padding: '8px', background: 'var(--surface-hover)', border: '1px solid var(--border-color)',
          borderRadius: '8px', cursor: 'pointer', fontSize: '12px', color: 'var(--text-secondary)'
        }}>
          Dismiss
        </button>
      </div>
    )
  }

  // Default idle state — Call button
  return (
    <button
      onClick={handleCallClick}
      style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '8px',
        padding: '12px',
        background: 'var(--surface-hover)',
        border: '1px solid var(--border-color)',
        color: 'var(--text-color)',
        borderRadius: '12px',
        fontWeight: 600,
        cursor: 'pointer',
        fontSize: '14px',
        transition: 'background 0.2s',
        width: '100%'
      }}
    >
      <Phone size={18} color="var(--primary-color)" /> Call
    </button>
  )
}
