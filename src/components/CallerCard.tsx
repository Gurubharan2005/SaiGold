'use client'

import { useState } from 'react'
import { Phone, X, Loader2, MessageCircle, ArrowRight, Send } from 'lucide-react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

const QuickRecordingUpload = dynamic(() => import('./QuickRecordingUpload'), { ssr: false })
const RecordingsBadge = dynamic(() => import('./RecordingsBadge'), { ssr: false })

interface CallerCardProps {
  lead: {
    id: string
    name: string
    phone: string
    status: string
    lastCalledAt?: string | Date | null
  }
  section: 'NEW' | 'CALLED'
}

export default function CallerCard({ lead, section }: CallerCardProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [recordingRefreshKey, setRecordingRefreshKey] = useState(0)

  const handleReject = async () => {
    setLoading('REJECT')
    try {
      await fetch(`/api/customers/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED', callStatus: 'CALLED', markCalled: true })
      })
      router.refresh()
      setTimeout(() => setLoading(null), 400)
    } catch {
      alert('Error updating status')
      setLoading(null)
    }
  }

  const handleSendToFollowUp = async () => {
    setLoading('FOLLOWUP')
    try {
      const res = await fetch('/api/customers/send-to-followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: lead.id })
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Failed to send to Follow-Up Staff')
        setLoading(null)
        return
      }
      router.refresh()
      setTimeout(() => setLoading(null), 400)
    } catch {
      alert('Error sending to Follow-Up Staff')
      setLoading(null)
    }
  }

  const iconBtnStyle = (color: string, bg: string, border: string) => ({
    padding: '8px',
    borderRadius: '8px',
    background: bg,
    color: color,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `1px solid ${border}`,
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
    flex: 1
  })

  const wasCalled = !!lead.lastCalledAt

  return (
    <div className="card" style={{ 
      padding: '13px', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '10px', 
      border: `1px solid ${wasCalled ? 'rgba(239,68,68,0.2)' : 'var(--border-color)'}`, 
      borderRadius: '12px', 
      background: 'var(--surface-color)', 
      boxShadow: 'var(--shadow-sm)' 
    }}>
      {/* LEAD INFO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-color)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.name}</h4>
            {wasCalled && (
              <div title="Already Called" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444', flexShrink: 0 }} />
            )}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
            <Phone size={12} color="var(--primary-color)" /> {lead.phone}
          </div>
          {wasCalled && (
            <div style={{ fontSize: '10px', color: '#EF4444', marginTop: '4px', opacity: 0.8 }}>
              Called at {new Date(lead.lastCalledAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>
        <RecordingsBadge customerId={lead.id} customerName={lead.name} refreshKey={recordingRefreshKey} />
      </div>

      {/* ACTION ROW: AUDIO + COMMS */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
        <div style={{ flex: 2 }}>
          <QuickRecordingUpload customerId={lead.id} customerName={lead.name} onUploadDone={() => setRecordingRefreshKey(k => k + 1)} />
        </div>
        <a
          href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
          target="_blank" rel="noopener noreferrer"
          title="WhatsApp"
          style={iconBtnStyle('#22c55e', 'rgba(34, 197, 94, 0.1)', 'rgba(34, 197, 94, 0.2)')}
        >
          <MessageCircle size={13} />
        </a>
        <a href={`tel:${lead.phone}`} title="Direct Call" style={iconBtnStyle('#10B981', 'rgba(16, 185, 129, 0.1)', 'rgba(16, 185, 129, 0.2)')}>
          <Phone size={13} />
        </a>
      </div>

      {/* PRIMARY ACTIONS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
        <button
          onClick={handleSendToFollowUp}
          disabled={!!loading}
          className="btn-primary"
          style={{ gridColumn: 'span 2', padding: '11px 4px', fontSize: '11px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          {loading === 'FOLLOWUP' 
            ? <Loader2 size={13} className="animate-spin" /> 
            : <Send size={13} />
          }
          SEND TO FOLLOW-UP STAFF
        </button>
        <button
          onClick={handleReject}
          disabled={!!loading}
          style={{ gridColumn: 'span 2', padding: '9px 4px', fontSize: '10px', fontWeight: 900, background: 'rgba(239, 68, 68, 0.07)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer' }}
        >
          {loading === 'REJECT' ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />} REJECT
        </button>
      </div>
    </div>
  )
}
