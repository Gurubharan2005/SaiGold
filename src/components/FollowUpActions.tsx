'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, X, Loader2, FileText } from 'lucide-react'
import Link from 'next/link'

interface FollowUpActionsProps {
  customerId: string
  customerName: string
}

export default function FollowUpActions({ customerId, customerName }: FollowUpActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleAction = async (action: 'SEND_FOR_VERIFICATION' | 'REJECT') => {
    setLoading(action)
    try {
      if (action === 'SEND_FOR_VERIFICATION') {
        // First navigate to detail form — on submit it will set status to PROCESSING
        router.push(`/dashboard/customers/${customerId}?from=followup`)
        return
      }

      // Reject
      const res = await fetch(`/api/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED' })
      })
      if (!res.ok) throw new Error('Failed')
      router.refresh()
      setTimeout(() => setLoading(null), 400)
    } catch {
      alert('Error updating lead')
      setLoading(null)
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
      <Link
        href={`/dashboard/customers/${customerId}?from=followup`}
        style={{ 
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          padding: '12px', background: 'var(--primary-color)', color: '#000',
          borderRadius: '10px', textDecoration: 'none', fontWeight: 900, fontSize: '13px'
        }}
      >
        <FileText size={15} /> FILL DETAILS &amp; SEND FOR VERIFICATION <ArrowRight size={15} />
      </Link>
      <button
        onClick={() => handleAction('REJECT')}
        disabled={!!loading}
        style={{ 
          padding: '12px 16px', background: 'rgba(239,68,68,0.08)', color: '#EF4444',
          border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px',
          display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
          fontWeight: 800, fontSize: '12px', whiteSpace: 'nowrap'
        }}
      >
        {loading === 'REJECT' ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
        REJECT
      </button>
    </div>
  )
}
