'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LiveLeadsRefresh() {
  const router = useRouter()
  const [newLeadFlash, setNewLeadFlash] = useState(false)
  const lastCountRef = useRef<number | null>(null)

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch('/api/leads/count', { cache: 'no-store' })
        if (!res.ok) return
        const { count } = await res.json()

        if (lastCountRef.current !== null && count > lastCountRef.current) {
          // New lead arrived — flash the UI and refresh
          setNewLeadFlash(true)
          router.refresh()
          setTimeout(() => setNewLeadFlash(false), 4000)
        }
        lastCountRef.current = count
      } catch {
        // Silent fail — background poll
      }
    }

    // Poll every 10 seconds
    const interval = setInterval(poll, 10000)
    poll() // Run immediately on mount

    return () => clearInterval(interval)
  }, [router])

  if (!newLeadFlash) return null

  return (
    <div style={{
      position: 'fixed',
      top: '80px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'linear-gradient(135deg, #10B981, #059669)',
      color: '#fff',
      padding: '12px 24px',
      borderRadius: '999px',
      fontWeight: 700,
      fontSize: '14px',
      zIndex: 9999,
      boxShadow: '0 8px 32px rgba(16, 185, 129, 0.4)',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      animation: 'slideDown 0.4s ease',
      whiteSpace: 'nowrap'
    }}>
      <span style={{ fontSize: '18px' }}>🔔</span>
      New lead just arrived!
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideDown {
          from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}} />
    </div>
  )
}
