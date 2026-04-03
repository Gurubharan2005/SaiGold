'use client'

import { useState, useRef, useEffect } from 'react'
import { Phone, Check, X, Loader2, Clock, MessageCircle, MoreVertical, Mic } from 'lucide-react'
import { useRouter } from 'next/navigation'
import QuickRecordingUpload from './QuickRecordingUpload'
import RecordingsBadge from './RecordingsBadge'

interface QuickStatusActionsProps {
  customerId: string
  customerName: string
  phone: string
}

export default function QuickStatusActions({ customerId, customerName, phone }: QuickStatusActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleStatusUpdate = async (status: 'PROCESSING' | 'REJECTED' | 'FOLLOW_UP') => {
    setLoading(status)
    setIsMenuOpen(false)
    try {
      type StatusPayload = {
        status: string
        callStatus: string
        followUpDate?: string
      }
      const payload: StatusPayload = { 
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', width: '100%' }}>
        
        {/* Left Side: Quick Stats/Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }} ref={menuRef}>
          <RecordingsBadge customerId={customerId} customerName={customerName} />
          
          <a 
            href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}`} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              padding: '10px', 
              borderRadius: '10px', 
              background: 'rgba(34, 197, 94, 0.1)', 
              color: '#22c55e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              textDecoration: 'none'
            }}
          >
            <MessageCircle size={20} />
          </a>

          <a 
            href={`tel:${phone}`} 
            style={{ 
              padding: '10px', 
              borderRadius: '10px', 
              background: 'rgba(16, 185, 129, 0.1)', 
              color: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              textDecoration: 'none'
            }}
          >
            <Phone size={20} />
          </a>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            style={{
              padding: '10px', 
              borderRadius: '10px', 
              background: 'var(--surface-color)', 
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <MoreVertical size={20} />
          </button>

          {/* Action Dropdown Menu */}
          {isMenuOpen && (
            <div className="fade-in" style={{
              position: 'absolute',
              top: '100%',
              left: '0',
              marginTop: '8px',
              background: 'var(--surface-color)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              minWidth: '160px',
              zIndex: 2000
            }}>
              <button onClick={() => handleStatusUpdate('FOLLOW_UP')} disabled={!!loading} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', width: '100%', borderRadius: '8px', color: '#F59E0B', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', fontWeight: 700 }}>
                <Clock size={16} /> Follow Up
              </button>
              <button onClick={() => handleStatusUpdate('PROCESSING')} disabled={!!loading} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', width: '100%', borderRadius: '8px', color: '#3B82F6', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', fontWeight: 700 }}>
                <Check size={16} /> Accept Lead
              </button>
              <button onClick={() => handleStatusUpdate('REJECTED')} disabled={!!loading} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', width: '100%', borderRadius: '8px', color: '#EF4444', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', fontWeight: 700 }}>
                <X size={16} /> Reject Lead
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Recording Upload Trigger */}
        <div style={{ flexShrink: 0 }}>
          <QuickRecordingUpload customerId={customerId} customerName={customerName} />
        </div>

      </div>
    </div>
  )
}
