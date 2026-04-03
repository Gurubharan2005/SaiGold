'use client'

import { useState, useEffect, useRef } from 'react'
import { Mic, Upload, Trash2, Play, Pause, Clock, User, Loader2, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import { upload } from '@vercel/blob/client'

interface Recording {
  id: string
  audioUrl: string
  label: string | null
  durationSec: number | null
  createdAt: string
  uploadedBy: { name: string; role: string }
}

interface Props {
  customerId: string
  isManager?: boolean
}

function formatDuration(sec: number | null) {
  if (!sec) return null
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function CallRecordingsPanel({ customerId, isManager }: Props) {
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [label, setLabel] = useState('')
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [error, setError] = useState('')
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchRecordings = async () => {
    try {
      const res = await fetch(`/api/customers/${customerId}/recordings`)
      if (res.ok) setRecordings(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRecordings() }, [customerId])

  const handleUpload = async (file: File) => {
    setUploading(true)
    setUploadProgress(0)
    setError('')

    try {
      // Step 1: Secure Client-Side Upload via Handshake
      const suffix = file.name.split('.').pop() || 'mp3'
      const pathname = `recordings/customer_${customerId}/${Date.now()}.${suffix}`
      
      const blob = await upload(pathname, file, {
        access: 'private',
        contentType: file.type || 'audio/mpeg',
        handleUploadUrl: '/api/upload-audio',
        onUploadProgress: (p) => setUploadProgress(p.percentage)
      })

      // Step 2: Sync Metadata to Neon Database via PATH A (JSON)
      const res = await fetch(`/api/customers/${customerId}/recordings`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioUrl: blob.url,
          label: label.trim() || `Call Recording - ${new Date().toLocaleDateString()}`,
          durationSec: null // Duration detection could be added here later if needed
        })
      })

      if (res.ok) {
        const newRec = await res.json()
        setRecordings(prev => [newRec, ...prev])
        setLabel('')
        if (fileInputRef.current) fileInputRef.current.value = ''
      } else {
        const data = await res.json()
        setError(data.error || 'Database Sync Failed')
      }
    } catch (err: any) {
      console.error('[Upload-Failure]', err)
      setError(err.message || 'Upload process failed')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this recording?')) return
    const res = await fetch(`/api/recordings/${id}`, { method: 'DELETE' })
    if (res.ok) setRecordings(prev => prev.filter(r => r.id !== id))
  }

  const togglePlay = (id: string) => {
    const audio = audioRefs.current[id]
    if (!audio) return
    if (playingId === id) {
      audio.pause()
      setPlayingId(null)
    } else {
      if (playingId && audioRefs.current[playingId]) {
        audioRefs.current[playingId]!.pause()
      }
      audio.play()
      setPlayingId(id)
      audio.onended = () => setPlayingId(null)
    }
  }

  return (
    <div className="card" style={{ marginTop: '24px' }}>
      {/* Header */}
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: collapsed ? 0 : '16px', cursor: 'pointer' }}
        onClick={() => setCollapsed(c => !c)}
      >
        <h3 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Mic size={18} color="var(--primary-color)" />
          Call Recordings
          <span style={{
            background: 'var(--primary-color)',
            color: '#111',
            borderRadius: '999px',
            padding: '1px 8px',
            fontSize: '12px',
            fontWeight: 700
          }}>{recordings.length}</span>
        </h3>
        {collapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
      </div>

      {!collapsed && (
        <>
          {/* Upload Area */}
          <div style={{
            border: '1px dashed var(--border-color)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '16px',
            background: 'var(--surface-hover)'
          }}>
            <input
              type="text"
              placeholder="Label (e.g. Initial Call, Follow Up #2)"
              value={label}
              onChange={e => setLabel(e.target.value)}
              style={{ width: '100%', marginBottom: '10px', fontSize: '13px' }}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp3,.mp4,.wav,.ogg,.webm,.m4a,audio/*"
              style={{ display: 'none' }}
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) handleUpload(file)
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="btn-primary"
              style={{ 
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                background: uploading ? 'var(--surface-hover)' : 'var(--primary-color)',
                border: uploading ? '1px solid var(--border-color)' : 'none',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {uploading && (
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0,
                  width: `${uploadProgress}%`, background: 'rgba(16,185,129,0.15)',
                  transition: 'width 0.2s'
                }} />
              )}
              <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                {uploading
                  ? <><Loader2 size={16} className="animate-spin" /> {uploadProgress < 100 ? `Syncing... ${uploadProgress}%` : 'Finalizing...'}</>
                  : <><Upload size={16} /> Upload Recording</>
                }
              </span>
            </button>
            {error && (
              <p style={{ color: 'var(--status-rejected)', fontSize: '12px', marginTop: '8px' }}>{error}</p>
            )}
          </div>

          {/* Recordings List */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
              <Loader2 size={20} className="animate-spin" style={{ margin: '0 auto' }} />
            </div>
          ) : recordings.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>
              No recordings yet. Upload the first call recording above.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recordings.map((rec) => (
                <div key={rec.id} style={{
                  background: 'var(--surface-hover)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '12px',
                }}>
                  {/* Hidden audio element */}
                  <audio
                    ref={el => { audioRefs.current[rec.id] = el }}
                    src={`/api/media?url=${encodeURIComponent(rec.audioUrl)}`}
                    preload="metadata"
                  />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Label */}
                      <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {rec.label || 'Call Recording'}
                      </div>

                      {/* Meta */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <User size={11} /> {rec.uploadedBy.name}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={11} /> {format(new Date(rec.createdAt), 'MMM dd, yyyy • hh:mm a')}
                        </span>
                        {rec.durationSec && (
                          <span>{formatDuration(rec.durationSec)}</span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      {/* Play/Pause */}
                      <button
                        onClick={() => togglePlay(rec.id)}
                        style={{
                          background: playingId === rec.id ? 'var(--primary-color)' : 'rgba(16,185,129,0.15)',
                          border: 'none',
                          borderRadius: '50%',
                          width: '36px',
                          height: '36px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: playingId === rec.id ? '#111' : 'var(--primary-color)',
                          transition: 'all 0.2s'
                        }}
                        title={playingId === rec.id ? 'Pause' : 'Play'}
                      >
                        {playingId === rec.id ? <Pause size={16} /> : <Play size={16} />}
                      </button>

                      {/* Delete — manager or uploader */}
                      {isManager && (
                        <button
                          onClick={() => handleDelete(rec.id)}
                          style={{
                            background: 'rgba(239,68,68,0.1)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: 'var(--status-rejected)',
                            transition: 'all 0.2s'
                          }}
                          title="Delete recording"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Waveform-style progress bar */}
                  <div style={{
                    marginTop: '10px',
                    height: '3px',
                    background: 'var(--border-color)',
                    borderRadius: '999px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: playingId === rec.id ? '100%' : '0%',
                      background: 'var(--primary-color)',
                      borderRadius: '999px',
                      transition: playingId === rec.id ? 'width 0.5s linear' : 'none'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
