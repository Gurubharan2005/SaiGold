'use client'

import { useEffect } from 'react'

export default function LocationBroadcaster({ isStaff }: { isStaff: boolean }) {
  useEffect(() => {
    if (!isStaff || typeof window === 'undefined') return

    let watchId: number
    let lastSentTime = 0

    const sendLocation = async (position: GeolocationPosition) => {
      // Throttle location updates to once every 10 seconds to improve liveness accuracy
      const now = Date.now()
      if (now - lastSentTime < 10000) return
      
      try {
        lastSentTime = now
        await fetch('/api/staff/location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
             lat: position.coords.latitude,
             lng: position.coords.longitude
          })
        })
      } catch {
        // Silent fail for background sync to avoid disrupting UI
      }
    }

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(sendLocation)
      watchId = navigator.geolocation.watchPosition(sendLocation, undefined, {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 9000
      })
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId)
    }
  }, [isStaff])

  return null
}
