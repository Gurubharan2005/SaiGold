'use client'

import { useState } from 'react'
import { Phone, Check, X, Loader2, Clock, MessageCircle, Mic, ExternalLink, RefreshCw, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import QuickRecordingUpload from './QuickRecordingUpload'
import RecordingsBadge from './RecordingsBadge'

interface PipelineCardProps {
  lead: {
    id: string
    name: string
    phone: string
    status: string
  }
  column: 'WAITS' | 'FOLLOW' | 'REJECT'
}

export default function PipelineCard({ lead, column }: PipelineCardProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleStatusUpdate = async (status: 'PROCESSING' | 'REJECTED' | 'FOLLOW_UP' | 'WAITING') => {
    setLoading(status)
    try {
      type StatusPayload = {
        status?: string
        callStatus: string
        followUpDate?: string
      }
      const payload: StatusPayload = { 
        callStatus: 'CALLED' 
      }

      payload.status = status

      if (status === 'FOLLOW_UP') {
        payload.followUpDate = new Date().toISOString()
      }

      const res = await fetch(`/api/customers/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error('Failed to update status')
      
      if (status === 'PROCESSING') {
        router.push(`/dashboard/customers/${lead.id}?from=processing`)
      } else {
        router.refresh()
      }
    } catch (error) {
      alert('Error updating status')
      setLoading(null)
    }
  }

  // Common Action Styles
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

  return (
    <div className="card hover-opacity" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--surface-color)', boxShadow: 'var(--shadow-sm)' }}>
      {/* 1. LEAD INFO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-color)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.name}</h4>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
            <Phone size={12} color="var(--primary-color)" /> {lead.phone}
          </div>
        </div>
        <RecordingsBadge customerId={lead.id} customerName={lead.name} />
      </div>

      {/* 2. AUDIO & COMMUNICATION TOOLS */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
        <QuickRecordingUpload customerId={lead.id} customerName={lead.name} />
        
        <a 
          href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`} 
          target="_blank" 
          rel="noopener noreferrer"
          title="WhatsApp"
          style={iconBtnStyle('#22c55e', 'rgba(34, 197, 94, 0.1)', 'rgba(34, 197, 94, 0.2)')}
        >
          <MessageCircle size={14} />
        </a>

        <a 
          href={`tel:${lead.phone}`} 
          title="Direct Call"
          style={iconBtnStyle('#10B981', 'rgba(16, 185, 129, 0.1)', 'rgba(16, 185, 129, 0.2)')}
        >
          <Phone size={14} />
        </a>
      </div>

      {/* 3. COLUMN-SPECIFIC ACTIONS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
        
        {/* VIEW CUSTOMER LINK (COMMON TO ALL AS "Lead Customer") */}
        <Link href={`/dashboard/customers/${lead.id}`} style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          gap: '8px', 
          fontSize: '12px', 
          color: 'var(--text-secondary)', 
          textDecoration: 'none', 
          fontWeight: 700,
          padding: '8px',
          background: 'var(--surface-hover)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)'
        }}>
          Lead Profile <ArrowRight size={14} />
        </Link>
        <style jsx>{`
          .ArrowRight { display: inline; }
        `}</style>

        <div style={{ display: 'flex', gap: '6px' }}>
          {column === 'WAITS' && (
            <>
              <button 
                onClick={() => handleStatusUpdate('FOLLOW_UP')} 
                disabled={!!loading} 
                className="btn-primary"
                style={{ flex: 1, padding: '10px 4px', fontSize: '10px', fontWeight: 900 }}
              >
                {loading === 'FOLLOW_UP' ? <Loader2 size={12} className="animate-spin" /> : <Clock size={12} />}
                FOLLOW UP
              </button>
              <button 
                onClick={() => handleStatusUpdate('REJECTED')} 
                disabled={!!loading} 
                style={{ flex: 1, padding: '10px 4px', fontSize: '10px', fontWeight: 900, background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer' }}
              >
                <X size={12} /> REJECT
              </button>
            </>
          )}

          {column === 'FOLLOW' && (
            <>
              <button 
                onClick={() => handleStatusUpdate('PROCESSING')} 
                disabled={!!loading} 
                className="btn-primary"
                style={{ flex: 2, padding: '10px 4px', fontSize: '10px', fontWeight: 900 }}
              >
                {loading === 'PROCESSING' ? <Loader2 size={12} className="animate-spin" /> : <ExternalLink size={12} />}
                CONVERT LOAN
              </button>
              <button 
                onClick={() => handleStatusUpdate('REJECTED')} 
                disabled={!!loading} 
                style={{ flex: 1, padding: '10px 4px', fontSize: '10px', fontWeight: 900, background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer' }}
              >
                <X size={12} /> REJECT
              </button>
            </>
          )}

          {column === 'REJECT' && (
            <>
              <button 
                onClick={() => handleStatusUpdate('WAITING')} 
                disabled={!!loading} 
                className="btn-secondary"
                style={{ flex: 1, padding: '10px 4px', fontSize: '10px', fontWeight: 900, color: 'var(--primary-color)' }}
              >
                {loading === 'WAITING' ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                RESUME
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
