'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function AssignLeadDropdown({ customerId, staffList }: { customerId: string, staffList: { id: string, name: string }[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleAssign = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const assignedToId = e.target.value
    if (!assignedToId) return

    setLoading(true)
    try {
      // Execute the native dispatch mapping
      const res = await fetch(`/api/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedToId }) 
      })
      
      if (!res.ok) throw new Error('Failed to dispatch lead payload')
      
      router.refresh()
    } catch (error: any) {
      alert(error.message)
      setLoading(false) // Only revert loading state on failure, let refresh handle success
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
        <Loader2 size={14} className="animate-spin" /> Dispatching...
      </div>
    )
  }

  return (
    <select 
      onChange={handleAssign}
      defaultValue=""
      style={{
        padding: '6px 10px',
        borderRadius: '6px',
        border: '1px solid var(--primary-color)',
        background: 'rgba(245, 158, 11, 0.05)',
        color: 'var(--text-color)',
        fontSize: '12px',
        fontWeight: 600,
        outline: 'none',
        cursor: 'pointer'
      }}
    >
      <option value="" disabled>Dispatch to Staff...</option>
      {staffList.map(staff => (
        <option key={staff.id} value={staff.id}>{staff.name}</option>
      ))}
    </select>
  )
}
