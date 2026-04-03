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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative', justifyContent: 'flex-end' }} ref={menuRef}>
        {/* Recording Count Badge */}
        <RecordingsBadge customerId={customerId} customerName={customerName} />
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

      {/* Action Menu Toggle Button */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        style={{
          padding: '8px', 
          borderRadius: '8px', 
          background: 'var(--surface-color)', 
          color: 'var(--text-primary)',
          border: '1px solid var(--border-color)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        title="More Actions"
      >
        <MoreVertical size={18} />
      </button>

       {/* Dropdown Menu */}
       {isMenuOpen && (
         <div className="fade-in" style={{
           position: 'absolute',
           top: '100%',
           right: '0',
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
            <button 
              onClick={() => handleStatusUpdate('FOLLOW_UP')} 
              disabled={!!loading} 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', width: '100%', borderRadius: '8px', color: '#F59E0B', background: 'rgba(245, 158, 11, 0.1)', cursor: 'pointer', border: '1px solid rgba(245, 158, 11, 0.2)' }}
            >
               {loading === 'FOLLOW_UP' ? <Loader2 size={16} className="animate-spin" /> : <Clock size={16} />} 
               <span style={{ fontSize: '13px', fontWeight: 700 }}>Follow Up</span>
            </button>
            
            <button 
              onClick={() => handleStatusUpdate('PROCESSING')} 
              disabled={!!loading} 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', width: '100%', borderRadius: '8px', color: '#3B82F6', background: 'rgba(59, 130, 246, 0.1)', cursor: 'pointer', border: '1px solid rgba(59, 130, 246, 0.2)' }}
            >
               {loading === 'PROCESSING' ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} 
               <span style={{ fontSize: '13px', fontWeight: 700 }}>Accept Lead</span>
            </button>
            
            <button 
              onClick={() => handleStatusUpdate('REJECTED')} 
              disabled={!!loading} 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', width: '100%', borderRadius: '8px', color: '#EF4444', background: 'rgba(239, 68, 68, 0.1)', cursor: 'pointer', border: '1px solid rgba(239, 68, 68, 0.2)' }}
            >
               {loading === 'REJECTED' ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />} 
               <span style={{ fontSize: '13px', fontWeight: 700 }}>Reject Lead</span>
            </button>
         </div>
       )}
      </div>

      {/* Quick Recording Upload Triggered Component */}
      <div style={{ alignSelf: 'flex-end' }}>
        <QuickRecordingUpload customerId={customerId} customerName={customerName} />
      </div>
    </div>
  )
}
