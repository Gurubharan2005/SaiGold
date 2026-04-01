'use client'

import { useState } from 'react'
import { CheckCircle, Loader2, CircleDashed } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function RequestClosureButton({ 
  customerId, 
  variant = 'default' 
}: { 
  customerId: string,
  variant?: 'default' | 'compact'
}) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  const handleRequestClosure = async () => {
    const isConfirmed = window.confirm(
      'Are you sure you want to request loan closure? This customer will move to the Manager\'s approval queue and disappear from your active list.'
    )
    if (!isConfirmed) return

    setIsPending(true)
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'CLOSE_REQUESTED',
          appendNote: 'Marked for closure by Staff. Awaiting Manager approval.'
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to request closure')
      }

      router.refresh()
    } catch (error: any) {
      console.error(error)
      alert(error.message)
    } finally {
      setIsPending(false)
    }
  }

  if (variant === 'compact') {
    return (
      <button 
        onClick={handleRequestClosure} 
        disabled={isPending}
        title="Request Loan Closure"
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          gap: '6px',
          padding: '8px 12px',
          background: 'rgba(239, 68, 68, 0.1)', 
          color: '#EF4444', 
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '6px',
          cursor: isPending ? 'not-allowed' : 'pointer',
          fontSize: '13px',
          fontWeight: 600,
          flex: 1
        }}
      >
        {isPending ? <Loader2 size={14} className="animate-spin" /> : <CircleDashed size={14} />}
        {isPending ? '...' : 'Close'}
      </button>
    )
  }

  return (
    <button 
      onClick={handleRequestClosure} 
      disabled={isPending}
      className="btn-primary"
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px', 
        padding: '10px 16px', 
        background: 'var(--primary-color)', 
        color: '#fff', 
        border: 'none',
        cursor: isPending ? 'not-allowed' : 'pointer',
        opacity: isPending ? 0.7 : 1
      }}
    >
      {isPending ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
      {isPending ? 'Requesting...' : 'Request Loan Closure'}
    </button>
  )
}
