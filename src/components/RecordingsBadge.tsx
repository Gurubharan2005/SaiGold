'use client'

import { useState, useEffect } from 'react'
import { Mic } from 'lucide-react'
import Link from 'next/link'

interface Props {
  customerId: string
}

export default function RecordingsBadge({ customerId }: Props) {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    fetch(`/api/customers/${customerId}/recordings`)
      .then(r => r.json())
      .then(data => Array.isArray(data) && setCount(data.length))
      .catch(() => {})
  }, [customerId])

  if (count === null) return null

  return (
    <Link
      href={`/dashboard/customers/${customerId}#recordings`}
      title={`${count} call recording${count !== 1 ? 's' : ''}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 8px',
        background: count > 0 ? 'rgba(16,185,129,0.12)' : 'var(--surface-hover)',
        border: `1px solid ${count > 0 ? 'rgba(16,185,129,0.3)' : 'var(--border-color)'}`,
        borderRadius: '999px',
        fontSize: '11px',
        fontWeight: 700,
        color: count > 0 ? '#10B981' : 'var(--text-secondary)',
        textDecoration: 'none',
        transition: 'all 0.2s',
        cursor: 'pointer',
        flexShrink: 0
      }}
    >
      <Mic size={11} />
      {count}
    </Link>
  )
}
