'use client'

import { useState } from 'react'
import { Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function FinishUploadButton({ customerId }: { customerId: string }) {
  const router = useRouter()
  const [isLocking, setIsLocking] = useState(false)

  const handleFinish = async () => {
    setIsLocking(true)
    try {
      await fetch(`/api/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PROCESSING' }), // Moves status out of ACCEPTED, naturally locking the folders for Staff
      })
      router.refresh()
    } catch (error) {
      console.error('Failed to seal documents:', error)
      alert("Failed to seal document folder")
    } finally {
      setIsLocking(false)
    }
  }

  return (
    <button 
      className="btn-primary" 
      onClick={handleFinish}
      disabled={isLocking}
      style={{ 
        width: '100%', 
        padding: '12px', 
        marginTop: '16px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: '8px',
        opacity: isLocking ? 0.7 : 1,
        background: 'var(--status-waiting)', // Subtle orange/yellow color
        color: '#1a1f2c'
      }}
    >
      <Lock size={18} /> {isLocking ? 'Sealing Folder...' : 'Finish & Seal Documents'}
    </button>
  )
}
