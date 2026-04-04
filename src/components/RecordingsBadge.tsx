'use client'

import { useState, useEffect } from 'react'
import { Mic } from 'lucide-react'
import RecordingsListModal from './RecordingsListModal'

interface Props {
  customerId: string
  customerName?: string
  refreshKey?: number
}

export default function RecordingsBadge({ customerId, customerName = 'Customer', refreshKey = 0 }: Props) {
  const [count, setCount] = useState<number | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchCount = () => {
    fetch(`/api/customers/${customerId}/recordings`)
      .then(r => r.json())
      .then(data => Array.isArray(data) && setCount(data.length))
      .catch(() => {})
  }

  useEffect(() => {
    fetchCount()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId, refreshKey])

  // Don't show if still loading (null)
  if (count === null) return null

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        title={`${count} call recording${count !== 1 ? 's' : ''}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 8px',
          background: 'rgba(16,185,129,0.12)',
          border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: '999px',
          fontSize: '11px',
          fontWeight: 700,
          color: '#10B981',
          textDecoration: 'none',
          transition: 'all 0.2s',
          cursor: 'pointer',
          flexShrink: 0
        }}
      >
        <Mic size={11} />
        {count}
      </button>

      <RecordingsListModal 
        customerId={customerId} 
        customerName={customerName} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        refreshKey={refreshKey}
      />
    </>
  )
}
