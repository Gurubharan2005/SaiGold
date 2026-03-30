'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Check, X, Clock, HelpCircle } from 'lucide-react'

export function StaffLeadActions({ leadId }: { leadId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleStatusChange = async (status: string) => {
    setLoading(status)
    try {
      const res = await fetch(`/api/customers/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (!res.ok) throw new Error('Failed to update')

      if (status === 'ACCEPTED') {
        // Core workflow: Bounce immediately to data entry
        router.push(`/dashboard/customers/${leadId}`)
      } else {
        router.refresh()
      }
    } catch (e) {
      alert('Network Error')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', width: '100%' }}>
      <button 
        onClick={() => handleStatusChange('ACCEPTED')}
        disabled={loading !== null}
        style={{ padding: '8px', cursor: 'pointer', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
      >
        {loading === 'ACCEPTED' ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
        <span style={{ fontSize: '10px', fontWeight: 600 }}>Accept</span>
      </button>

      <button 
        onClick={() => handleStatusChange('FOLLOW_UP')}
        disabled={loading !== null}
        style={{ padding: '8px', cursor: 'pointer', background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
      >
        {loading === 'FOLLOW_UP' ? <Loader2 size={16} className="animate-spin" /> : <Clock size={16} />}
        <span style={{ fontSize: '10px', fontWeight: 600 }}>Follow Up</span>
      </button>

      <button 
        onClick={() => handleStatusChange('WAITING')}
        disabled={loading !== null}
        style={{ padding: '8px', cursor: 'pointer', background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
      >
        {loading === 'WAITING' ? <Loader2 size={16} className="animate-spin" /> : <Clock size={16} />}
        <span style={{ fontSize: '10px', fontWeight: 600 }}>Wait</span>
      </button>

      <button 
        onClick={() => handleStatusChange('NO_RESPONSE')}
        disabled={loading !== null}
        style={{ padding: '8px', cursor: 'pointer', background: 'rgba(107, 114, 128, 0.1)', color: '#9CA3AF', border: '1px solid rgba(107, 114, 128, 0.2)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
      >
        {loading === 'NO_RESPONSE' ? <Loader2 size={16} className="animate-spin" /> : <HelpCircle size={16} />}
        <span style={{ fontSize: '10px', fontWeight: 600 }}>Ghosted</span>
      </button>

      <button 
        onClick={() => handleStatusChange('REJECTED')}
        disabled={loading !== null}
        style={{ padding: '8px', cursor: 'pointer', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
      >
        {loading === 'REJECTED' ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
        <span style={{ fontSize: '10px', fontWeight: 600 }}>Reject</span>
      </button>
    </div>
  )
}
