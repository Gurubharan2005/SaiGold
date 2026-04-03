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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
      <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
          {/* PRIMARY CONVERT ACTION */}
          <button 
            onClick={() => handleStatusUpdate('PROCESSING')}
            disabled={!!loading}
            style={{ 
              flex: 1, 
              background: 'var(--primary-color)', 
              color: '#111', 
              fontWeight: 800, 
              padding: '12px', 
              borderRadius: '10px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px', 
              fontSize: '14px',
              boxShadow: 'var(--shadow-glow)'
            }}
          >
            {loading === 'PROCESSING' ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
            CONVERT TO LOAN
          </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', width: '100%' }}>
        
        {/* Left Side: Stats & Communication */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }} ref={menuRef}>
          <RecordingsBadge customerId={customerId} customerName={customerName} />
          
          <a 
            href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}`} 
            target="_blank" 
            rel="noopener noreferrer"
            title="WhatsApp"
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
            title="Direct Call"
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
              bottom: '100%',
              left: '0',
              marginBottom: '8px',
              background: 'var(--surface-color)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              minWidth: '180px',
              zIndex: 2000
            }}>
              <button onClick={() => handleStatusUpdate('CALLED')} disabled={!!loading} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', width: '100%', borderRadius: '8px', color: 'var(--primary-color)', background: 'rgba(255, 193, 7, 0.05)', border: '1px solid rgba(255, 193, 7, 0.1)', fontWeight: 700 }}>
                {loading === 'CALLED' ? <Loader2 size={16} className="animate-spin" /> : <Phone size={16} />} 
                Mark as CALLED
              </button>
              <button onClick={() => handleStatusUpdate('FOLLOW_UP')} disabled={!!loading} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', width: '100%', borderRadius: '8px', color: '#F59E0B', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.1)', fontWeight: 700 }}>
                <Clock size={16} /> Follow Up
              </button>
              <button onClick={() => handleStatusUpdate('REJECTED')} disabled={!!loading} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', width: '100%', borderRadius: '8px', color: '#EF4444', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', fontWeight: 700 }}>
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
