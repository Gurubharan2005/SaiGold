'use client'

import { useState } from 'react'
import { CheckCircle, ArrowLeftCircle, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SalesVerifyActions({ 
  customerId, 
  fromTab 
}: { 
  customerId: string,
  fromTab?: string 
}) {
  const router = useRouter()
  const [loading, setLoading] = useState<'maintenance' | 'staff' | null>(null)

  const handleStatusUpdate = async (status: 'MAINTENANCE' | 'PROCESSING') => {
    setLoading(status === 'MAINTENANCE' ? 'maintenance' : 'staff')
    try {
      const res = await fetch(`/api/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (!res.ok) throw new Error('Action failed')
      
      const redirectUrl = fromTab === 'processing' 
        ? '/dashboard/detail-filling' 
        : fromTab 
          ? `/dashboard/customers?tab=${fromTab}` 
          : '/dashboard/customers'

      router.push(redirectUrl)
      router.refresh()
    } catch (error) {
      console.error('Failed to update status:', error)
      alert("Failed to update status. Please try again.")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="card" style={{ 
      marginTop: '32px', 
      border: '2px solid var(--primary-color)', 
      background: 'rgba(255, 193, 7, 0.05)', 
      textAlign: 'center',
      padding: '32px'
    }}>
      <h3 style={{ margin: '0 0 8px 0', fontSize: '22px', fontWeight: 800 }}>Departmental Handoff</h3>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px', maxWidth: '500px', margin: '0 auto 24px auto' }}>
        You are in **Verification Mode**. Review the compliance documents above. If everything is correct, send this lead to the Maintenance Desk for final loan processing.
      </p>

      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button 
          className="btn-primary" 
          onClick={() => handleStatusUpdate('MAINTENANCE')}
          disabled={loading !== null}
          style={{ 
            minWidth: '200px', 
            height: '52px',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '10px',
            fontSize: '16px',
            fontWeight: 700,
            background: '#10B981', // Green for Approval
            color: '#FFF',
            border: 'none'
          }}
        >
          {loading === 'maintenance' ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle size={20} />}
          {loading === 'maintenance' ? 'Processing...' : 'Verify & Send to Maintenance'}
        </button>

        <button 
          className="btn-secondary" 
          onClick={() => handleStatusUpdate('PROCESSING')}
          disabled={loading !== null}
          style={{ 
            minWidth: '200px', 
            height: '52px',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '10px',
            fontSize: '16px',
            fontWeight: 700,
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#EF4444', // Red for Reject/Clarification
            border: '1px solid #EF4444'
          }}
        >
          {loading === 'staff' ? <Loader2 size={20} className="animate-spin" /> : <ArrowLeftCircle size={20} />}
          {loading === 'staff' ? 'Returning...' : 'Send back to Staff'}
        </button>
      </div>
    </div>
  )
}
