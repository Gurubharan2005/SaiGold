'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

export default function SalesVerifyActions({ customerId, salesmanId }: { customerId: string, salesmanId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleAction = async (action: 'VERIFY' | 'REJECT') => {
    setLoading(action)
    try {
      type VerifyPayload = {
        status: string
        isVerified?: boolean
        verifiedById?: string
        verifiedAt?: string
      }
      const payload: VerifyPayload = { status: '' }
      if (action === 'VERIFY') {
        payload.status = 'ACCEPTED' // Approving moves it to 'Ongoing' queue
        payload.isVerified = true
        payload.verifiedById = salesmanId
        payload.verifiedAt = new Date().toISOString()
      } else {
         // Send back to Staff Detail Filling pipeline by resetting status to processing
        payload.status = 'PROCESSING'
      }

      const res = await fetch(`/api/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error('Action failed')
      router.refresh()
    } catch {
      alert('Verification Error')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
      <button 
        onClick={() => handleAction('REJECT')}
        disabled={loading !== null}
        className="btn-secondary"
        style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}
      >
        {loading === 'REJECT' ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />} 
        Reject Documents
      </button>

      <button 
        onClick={() => handleAction('VERIFY')}
        disabled={loading !== null}
        style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--status-accepted)', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600 }}
      >
        {loading === 'VERIFY' ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} 
        Approve & Verify
      </button>
    </div>
  )
}
