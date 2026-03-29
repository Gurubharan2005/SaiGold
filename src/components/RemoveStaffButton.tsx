'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'

export default function RemoveStaffButton({ staffId, staffName }: { staffId: string, staffName: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleRemove = async () => {
    if (!confirm(`Are you sure you want to completely revoke access for ${staffName}? They will be immediately deactivated.`)) return
    
    setLoading(true)
    try {
      const res = await fetch(`/api/staff/${staffId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to deactivate staff member')
      router.refresh()
    } catch (error: any) {
      alert(error.message)
      setLoading(false)
    }
  }

  return (
    <button 
      onClick={handleRemove} 
      disabled={loading}
      style={{ 
        display: 'flex', alignItems: 'center', gap: '6px', 
        padding: '6px 12px', borderRadius: '6px', 
        background: 'var(--surface-color)', border: '1px solid var(--border-color)',
        color: 'var(--status-rejected)', fontSize: '12px', fontWeight: 600,
        cursor: loading ? 'not-allowed' : 'pointer'
      }}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} 
      Remove
    </button>
  )
}
