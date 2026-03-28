'use client'

import { useState } from 'react'
import { Check, X, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function LeadActions({ leadId }: { leadId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleUpdate = async (status: 'ACCEPTED' | 'REJECTED') => {
    if (!confirm(`Are you sure you want to change this lead to ${status}?`)) return
    
    setLoading(true)
    try {
      const res = await fetch(`/api/customers/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (!res.ok) throw new Error('Update failed')

      router.refresh()
    } catch (err) {
      console.error(err)
      alert("Failed to update status")
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Loader2 size={24} className="animate-spin text-zinc-400" />

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
      <button 
        onClick={() => handleUpdate('ACCEPTED')}
        className="btn-secondary" 
        style={{ padding: '8px', color: 'var(--status-accepted)', borderColor: 'rgba(16, 185, 129, 0.2)' }} 
        title="Convert to Customer"
      >
        <Check size={18} />
      </button>
      <button 
        onClick={() => handleUpdate('REJECTED')}
        className="btn-secondary" 
        style={{ padding: '8px', color: 'var(--status-rejected)', borderColor: 'rgba(239, 68, 68, 0.2)' }} 
        title="Reject Lead"
      >
        <X size={18} />
      </button>
    </div>
  )
}
