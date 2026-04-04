'use client'

import { useState, useRef, useEffect } from 'react'
import { Phone, Check, X, Loader2, Clock, MessageCircle, MoreVertical, Mic, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'
import QuickRecordingUpload from './QuickRecordingUpload'
import RecordingsBadge from './RecordingsBadge'

interface CompactSalesToolbarProps {
  customerId: string
  customerName: string
  phone: string
  currentStatus: string
  showConvert?: boolean
}

export default function CompactSalesToolbar({ 
  customerId, 
  customerName, 
  phone, 
  currentStatus,
  showConvert = true 
}: CompactSalesToolbarProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleStatusUpdate = async (status: 'PROCESSING' | 'REJECTED' | 'FOLLOW_UP' | 'CALLED') => {
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

      if (status !== 'CALLED') {
        payload.status = status
      }

      if (status === 'FOLLOW_UP') {
        payload.followUpDate = new Date().toISOString()
      }

      const res = await fetch(`/api/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error('Failed to update status')
      
      if (status === 'PROCESSING') {
        router.push(`/dashboard/customers/${customerId}?from=processing`)
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
    transition: 'all 0.2s'
  })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: 'fit-content' }}>
      
      {/* 1. AUDIO & COMMUNICATION TOOLS */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingRight: '6px', borderRight: '1px solid var(--border-color)', marginRight: '6px' }}>
        <RecordingsBadge customerId={customerId} customerName={customerName} />
        
        <div style={{ flexShrink: 0 }}>
          <QuickRecordingUpload customerId={customerId} customerName={customerName} />
        </div>

        <a 
          href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}`} 
          target="_blank" 
          rel="noopener noreferrer"
          title="WhatsApp"
          style={iconBtnStyle('#22c55e', 'rgba(34, 197, 94, 0.1)', 'rgba(34, 197, 94, 0.2)')}
        >
          <MessageCircle size={14} />
        </a>

        <a 
          href={`tel:${phone}`} 
          title="Direct Call"
          style={iconBtnStyle('#10B981', 'rgba(16, 185, 129, 0.1)', 'rgba(16, 185, 129, 0.2)')}
        >
          <Phone size={14} />
        </a>
      </div>

      {/* 2. SALES FLOW ACTIONS (CALLED, FOLLOW, REJECT) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>

        <button 
          onClick={() => handleStatusUpdate('FOLLOW_UP')} 
          disabled={!!loading} 
          title="Schedule Follow-up"
          style={iconBtnStyle('#F59E0B', 'rgba(245, 158, 11, 0.08)', 'rgba(245, 158, 11, 0.15)')}
        >
          <Clock size={14} />
        </button>

        <button 
          onClick={() => handleStatusUpdate('REJECTED')} 
          disabled={!!loading} 
          title="Reject Lead"
          style={iconBtnStyle('#EF4444', 'rgba(239, 68, 68, 0.08)', 'rgba(239, 68, 68, 0.15)')}
        >
          <X size={14} />
        </button>

        {/* 3. THE CONVERSION ENGINE: CONVERT LOAN */}
        {showConvert && currentStatus !== 'PROCESSING' && (
          <button 
            onClick={() => handleStatusUpdate('PROCESSING')}
            disabled={!!loading}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              padding: '8px 12px', 
              borderRadius: '8px', 
              color: '#000', 
              background: 'var(--primary-color)', 
              border: 'none', 
              fontWeight: 800,
              fontSize: '11px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(255, 193, 7, 0.2)',
              marginLeft: '6px',
              whiteSpace: 'nowrap'
            }}
          >
            {loading === 'PROCESSING' ? <Loader2 size={12} className="animate-spin" /> : <ExternalLink size={12} />}
            CONVERT LOAN
          </button>
        )}
      </div>

    </div>
  )
}
