'use client'

import { useState } from 'react'
import { Phone, Check, X, Loader2, Clock, MessageCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface QuickStatusActionsProps {
  customerId: string
  phone: string
}

export default function QuickStatusActions({ customerId, phone }: QuickStatusActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleStatusUpdate = async (status: 'PROCESSING' | 'REJECTED' | 'FOLLOW_UP') => {
    setLoading(status)
    try {
      const payload: any = { 
        status,
        callStatus: 'CALLED' // Auto-update call status when making a decision
      }

      // Automatically set follow-up date for today to appear on the Follow-Ups board
      if (status === 'FOLLOW_UP') {
        payload.followUpDate = new Date().toISOString()
      }

      const res = await fetch(`/api/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error('Failed to update status')
      
      router.refresh()
    } catch (error) {
      alert('Error updating customer status')
      setLoading(null)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {/* WhatsApp Button */}
      <a 
        href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}`} 
        target="_blank" 
        rel="noopener noreferrer"
        className="btn-success"
        style={{ 
          padding: '8px', 
          borderRadius: '8px', 
          background: 'rgba(34, 197, 94, 0.1)', 
          color: '#22c55e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(34, 197, 94, 0.2)',
          transition: 'all 0.2s',
          textDecoration: 'none'
        }}
        title="WhatsApp Direct"
      >
        <MessageCircle size={18} />
      </a>

      {/* Direct Call Button */}
      <a 
        href={`tel:${phone}`} 
        className="btn-success"
        style={{ 
          padding: '8px', 
          borderRadius: '8px', 
          background: 'rgba(16, 185, 129, 0.1)', 
          color: '#10B981',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          transition: 'all 0.2s'
        }}
        title="Call Now"
      >
        <Phone size={18} />
      </a>

      {/* Follow Up Button */}
      <button
        onClick={() => handleStatusUpdate('FOLLOW_UP')}
        disabled={!!loading}
        style={{ 
          padding: '8px', 
          borderRadius: '8px', 
          background: 'rgba(245, 158, 11, 0.1)', 
          color: '#F59E0B',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        title="Mark for Follow Up"
      >
        {loading === 'FOLLOW_UP' ? <Loader2 size={18} className="animate-spin" /> : <Clock size={18} />}
      </button>

      {/* Accept Button */}
      <button
        onClick={() => handleStatusUpdate('PROCESSING')}
        disabled={!!loading}
        style={{ 
          padding: '8px', 
          borderRadius: '8px', 
          background: 'rgba(59, 130, 246, 0.1)', 
          color: '#3B82F6',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        title="Accept Lead"
      >
        {loading === 'PROCESSING' ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
      </button>

      {/* Reject Button */}
      <button
        onClick={() => handleStatusUpdate('REJECTED')}
        disabled={!!loading}
        style={{ 
          padding: '8px', 
          borderRadius: '8px', 
          background: 'rgba(239, 68, 68, 0.1)', 
          color: '#EF4444',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        title="Reject Lead"
      >
        {loading === 'REJECTED' ? <Loader2 size={18} className="animate-spin" /> : <X size={18} />}
      </button>
    </div>
  )
}
