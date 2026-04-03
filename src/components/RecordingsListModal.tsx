'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Mic, X, Play, Pause, Clock, User, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

interface Recording {
  id: string
  audioUrl: string
  label: string | null
  durationSec: number | null
  createdAt: string
  uploadedBy: { name: string; role: string }
}

interface RecordingsListModalProps {
  customerId: string
  customerName: string
  isOpen: boolean
  onClose: () => void
}

function formatDuration(sec: number | null) {
  if (!sec) return null
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function RecordingsListModal({ customerId, customerName, isOpen, onClose }: RecordingsListModalProps) {
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [loading, setLoading] = useState(true)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({})

  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      fetch(`/api/customers/${customerId}/recordings`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setRecordings(data)
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
  }, [isOpen, customerId])

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

  if (!isOpen) return null

  return (
    <div 
      className="sidebar-overlay" 
      style={{ zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      onClick={onClose}
    >
      <div 
        className="card fade-in" 
        style={{ 
          width: '100%', 
          maxWidth: '500px', 
          maxHeight: '80vh', 
          overflow: 'hidden', 
          display: 'flex', 
          flexDirection: 'column',
          padding: 0,
          background: 'var(--bg-color)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-hover)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(16,185,129,0.1)', padding: '8px', borderRadius: '8px' }}>
              <Mic size={18} color="#10B981" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Call Recordings</h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>{customerName}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-secondary)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              <Loader2 size={32} className="animate-spin" />
              <p style={{ marginTop: '12px', fontSize: '14px' }}>Loading recordings...</p>
            </div>
          ) : recordings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No recordings found for this customer.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recordings.map((rec) => (
                <div key={rec.id} style={{
                  background: 'var(--surface-color)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '16px',
                  transition: 'all 0.2s',
                }}>
                  <audio ref={el => { audioRefs.current[rec.id] = el }} src={rec.audioUrl} preload="metadata" />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {rec.label || 'Call – ' + format(new Date(rec.createdAt), 'MMM dd')}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <User size={11} /> {rec.uploadedBy.name}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={11} /> {format(new Date(rec.createdAt), 'hh:mm a')}
                        </span>
                        {rec.durationSec && <span>{formatDuration(rec.durationSec)}</span>}
                      </div>
                    </div>

                    <button
                      onClick={() => togglePlay(rec.id)}
                      style={{
                        background: playingId === rec.id ? 'var(--primary-color)' : 'rgba(16,185,129,0.1)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: playingId === rec.id ? '#111' : '#10B981',
                        transition: 'all 0.2s',
                        flexShrink: 0
                      }}
                    >
                      {playingId === rec.id ? <Pause size={20} /> : <Play size={20} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)', background: 'var(--surface-hover)', textAlign: 'center' }}>
          <button 
            className="btn-secondary" 
            style={{ width: '100%', fontSize: '13px' }}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
