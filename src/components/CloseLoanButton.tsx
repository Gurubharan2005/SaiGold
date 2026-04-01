'use client'

import { useState } from 'react'
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function CloseLoanButton({ 
  customerId, 
  isSalesman 
}: { 
  customerId: string,
  isSalesman?: boolean 
}) {
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

  if (!isSalesman) {
    return (
      <div style={{ 
        padding: '12px', 
        background: 'rgba(245, 158, 11, 0.1)', 
        border: '1px solid rgba(245, 158, 11, 0.2)', 
        borderRadius: '8px', 
        color: '#F59E0B', 
        fontSize: '13px',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <AlertTriangle size={16} /> Pending Authorized Approval (Salesman only)
      </div>
    )
  }

  return (
    <button 
      onClick={handleCloseLoan} 
      disabled={isDeleting}
      className="btn-primary"
      style={{ 
        width: '100%',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        gap: '8px', 
        padding: '12px 16px', 
        background: 'var(--status-rejected)', 
        color: '#fff', 
        border: 'none',
        cursor: isDeleting ? 'not-allowed' : 'pointer',
        opacity: isDeleting ? 0.7 : 1,
        borderRadius: '8px'
      }}
      title="Permanently Close & Erase"
    >
      {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
      {isDeleting ? 'Erasing Data...' : 'Final Approve: Purge & Close Loan'}
    </button>
  )
}
