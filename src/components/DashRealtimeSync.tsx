'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * DashRealtimeSync
 * 
 * A background "pulse" component that keeps the dashboard data fresh.
 * It uses router.refresh() at regular intervals but intelligently
 * pauses when the tab is not in focus to save resources.
 */
export default function DashRealtimeSync({ 
  intervalMs = 15000 // default to 15 seconds for a "Low Activity" background refresh
}: { 
  intervalMs?: number 
}) {
  const router = useRouter()

  useEffect(() => {
    let interval: NodeJS.Timeout

    const startPulse = () => {
      interval = setInterval(() => {
        // Only refresh if the page is currently visible
        if (document.visibilityState === 'visible') {
          router.refresh()
        }
      }, intervalMs)
    }

    const stopPulse = () => {
      if (interval) clearInterval(interval)
    }

    // Initialize pulse
    startPulse()

    // Handle visibility changes (Tab switching / Minimatizing)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Trigger immediate refresh when returning to tab
        router.refresh()
        startPulse()
      } else {
        stopPulse()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      stopPulse()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [router, intervalMs])

  // This component doesn't render anything
  return null
}
