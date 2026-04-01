'use client'

import { useState } from 'react'
import { CheckCircle, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function RequestClosureButton({ customerId }: { customerId: string }) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  const handleRequestClosure = async () => {
    const isConfirmed = window.confirm(
      'Are you sure you want to request loan closure for this customer? This will flag the record for Manager approval.'
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
