'use client'

import { useState } from 'react'
import { Calendar } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function DueDateSelector({ customerId, initialDate }: { customerId: string, initialDate: string | null }) {
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)

  const handleDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsUpdating(true)
    const newDate = e.target.value

    try {
      await fetch(`/api/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dueDate: newDate || null }),
      })
      router.refresh()
    } catch (error) {
      console.error('Failed to update due date:', error)
      alert("Failed to update Due Date")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
         <Calendar size={16} /> Payment Due Date
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input 
          type="date"
          defaultValue={initialDate ? new Date(initialDate).toISOString().split('T')[0] : ''}
          onChange={handleDateChange}
          disabled={isUpdating}
          style={{
             background: 'var(--surface-color)',
             border: '1px solid var(--border-color)',
             color: 'var(--text-color)',
             padding: '4px 8px',
             borderRadius: 'var(--border-radius-sm)',
             fontSize: '13px',
             outline: 'none',
             opacity: isUpdating ? 0.5 : 1
          }}
        />
      </div>
    </div>
  )
}
