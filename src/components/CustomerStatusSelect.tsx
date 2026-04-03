'use client'

import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function CustomerStatusSelect({ customerId, currentStatus }: { customerId: string, currentStatus: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(currentStatus)

  const handleUpdate = async (status: string) => {
    setSelected(status)
    if (status === currentStatus) return

    setLoading(true)
    try {
      const res = await fetch(`/api/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (!res.ok) throw new Error('Update failed')

      // No router.refresh() here to keep the "Runtime" feel snappy.
      // The local 'selected' state handles the immediate feedback.
    } catch (err) {
      console.error(err)
      alert("Failed to update status")
      setSelected(currentStatus)
    } finally {
      setLoading(false)
    }
  }

  const statuses = [
    { value: 'WAITING', label: 'Waiting (Lead)', color: 'var(--status-waiting)' },
    { value: 'PROCESSING', label: 'Processing', color: 'var(--primary-color)' },
    { value: 'ACCEPTED', label: 'Accepted (Active)', color: 'var(--status-accepted)' },
    { value: 'REJECTED', label: 'Rejected', color: 'var(--status-rejected)' },
    { value: 'DUE', label: 'Payment Due', color: 'var(--status-due)' },
    { value: 'CLOSED', label: 'Closed (Settled)', color: 'var(--text-secondary)' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {statuses.map((s) => (
        <button
          key={s.value}
          onClick={() => handleUpdate(s.value)}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderRadius: 'var(--border-radius-sm)',
            border: selected === s.value ? `2px solid ${s.color}` : '1px solid var(--border-color)',
            background: selected === s.value ? `${s.color}15` : 'transparent',
            cursor: 'pointer',
            fontWeight: selected === s.value ? 600 : 400,
            color: 'var(--text-color)',
            transition: 'all 0.2s ease',
            opacity: loading && selected !== s.value ? 0.5 : 1
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: s.color }} />
            {s.label}
          </div>
          {selected === s.value && (loading ? <Loader2 size={16} className="animate-spin text-zinc-500" /> : <Check size={16} color={s.color} />)}
        </button>
      ))}
    </div>
  )
}
