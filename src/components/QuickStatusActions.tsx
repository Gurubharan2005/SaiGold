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

  const handleStatusUpdate = async (status: 'PROCESSING' | 'REJECTED' | 'FOLLOW_UP' | 'CALLED') => {
    const isCalled = status === 'CALLED'
    setLoading(status)
    setIsMenuOpen(false)
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
      
      // If converting, push to the profile page for document upload
      if (status === 'PROCESSING') {
        router.push(`/dashboard/customers/${customerId}?from=processing`)
      } else {
        router.refresh()
      }
    } catch (error) {
      alert('Error updating customer status')
      setLoading(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginTop: '6px' }}>
      
      {/* ROW 1: Communication & Audio Tools (Mobile Scrollable) */}
      <div className="no-scrollbar" style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '2px', touchAction: 'pan-x' }}>
        <RecordingsBadge customerId={customerId} customerName={customerName} />
        
        <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
          <a 
            href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}`} 
            target="_blank" 
            rel="noopener noreferrer"
            title="WhatsApp"
            style={{ 
              padding: '10px 12px', 
              borderRadius: '10px', 
              background: 'rgba(34, 197, 94, 0.12)', 
              color: '#22c55e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              textDecoration: 'none',
              minWidth: '44px'
            }}
          >
            <MessageCircle size={18} />
          </a>

          <a 
            href={`tel:${phone}`} 
            title="Direct Call"
            style={{ 
              padding: '10px 12px', 
              borderRadius: '10px', 
              background: 'rgba(16, 185, 129, 0.12)', 
              color: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              textDecoration: 'none',
              minWidth: '44px'
            }}
          >
            <Phone size={18} />
          </a>

          <div style={{ flexShrink: 0 }}>
            <QuickRecordingUpload customerId={customerId} customerName={customerName} />
          </div>
        </div>
      </div>

      {/* ROW 2: Primary Status Actions (One-Tap High Contrast) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr) 44px', gap: '6px', alignItems: 'stretch' }}>
        <button 
          onClick={() => handleStatusUpdate('CALLED')} 
          disabled={!!loading} 
          style={{ 
            fontSize: '9px', 
            fontWeight: 900, 
            padding: '12px 2px', 
            borderRadius: '10px', 
            color: 'var(--primary-color)', 
            background: 'rgba(255, 193, 7, 0.1)', 
            border: '1px solid rgba(255, 193, 7, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '5px',
            cursor: 'pointer',
            letterSpacing: '0.5px'
          }}
        >
          {loading === 'CALLED' ? <Loader2 size={14} className="animate-spin" /> : <Phone size={14} />}
          CALLED
        </button>

        <button 
          onClick={() => handleStatusUpdate('FOLLOW_UP')} 
          disabled={!!loading} 
          style={{ 
            fontSize: '9px', 
            fontWeight: 900, 
            padding: '12px 2px', 
            borderRadius: '10px', 
            color: '#F59E0B', 
            background: 'rgba(245, 158, 11, 0.1)', 
            border: '1px solid rgba(245, 158, 11, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '5px',
            cursor: 'pointer',
            letterSpacing: '0.5px'
          }}
        >
          <Clock size={14} />
          FOLLOW
        </button>

        <button 
          onClick={() => handleStatusUpdate('REJECTED')} 
          disabled={!!loading} 
          style={{ 
            fontSize: '9px', 
            fontWeight: 900, 
            padding: '12px 2px', 
            borderRadius: '10px', 
            color: '#EF4444', 
            background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid rgba(239, 68, 68, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '5px',
            cursor: 'pointer',
            letterSpacing: '0.5px'
          }}
        >
          <X size={14} />
          REJECT
        </button>

        <div style={{ position: 'relative' }} ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            style={{
              width: '44px',
              height: '100%',
              borderRadius: '10px', 
              background: 'var(--surface-color)', 
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <MoreVertical size={18} />
          </button>

          {isMenuOpen && (
            <div className="fade-in" style={{
              position: 'absolute',
              bottom: '100%',
              right: '0',
              marginBottom: '12px',
              background: 'var(--bg-color)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.9)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              minWidth: '240px',
              zIndex: 5000,
              borderBottom: '4px solid var(--primary-color)'
            }}>
              <p style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px', textAlign: 'center', fontWeight: 900, letterSpacing: '1.5px', textTransform: 'uppercase' }}>Management Deck</p>
              <button 
                onClick={() => handleStatusUpdate('PROCESSING')}
                disabled={!!loading}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: '12px', 
                  padding: '16px', 
                  width: '100%', 
                  borderRadius: '12px', 
                  color: '#111', 
                  background: 'var(--primary-color)', 
                  border: 'none', 
                  fontWeight: 900,
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxShadow: '0 10px 20px rgba(255, 193, 7, 0.25)',
                  transition: 'transform 0.2s'
                }}
              >
                {loading === 'PROCESSING' ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                CONVERT TO LOAN
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
