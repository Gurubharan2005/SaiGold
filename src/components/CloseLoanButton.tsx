'use client'

import { useState } from 'react'
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function CloseLoanButton({ customerId }: { customerId: string }) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleCloseLoan = async () => {
    const isConfirmed = window.confirm(
      'WARNING: Are you absolutely certain you want to permanently close this loan and physically purge ALL associated KYC data from Cloud Storage? This cannot be undone.'
    )
    if (!isConfirmed) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to purge customer metrics securely')
      }

      // Route the user back out immediately since the current URL profile is now globally deleted
      router.push('/dashboard/customers')
      router.refresh()
    } catch (error: any) {
      console.error(error)
      alert(error.message)
      setIsDeleting(false)
    }
  }

  return (
    <button 
      onClick={handleCloseLoan} 
      disabled={isDeleting}
      className="btn-primary"
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px', 
        padding: '10px 16px', 
        background: 'var(--status-rejected)', 
        color: '#fff', 
        border: 'none',
        cursor: isDeleting ? 'not-allowed' : 'pointer',
        opacity: isDeleting ? 0.7 : 1
      }}
      title="Permanently Close & Erase"
    >
      {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
      {isDeleting ? 'Erasing Cloud...' : 'Close Loan & Purge Data'}
    </button>
  )
}
