'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, ShieldCheck, Loader2 } from 'lucide-react'

// PUBLIC VAPID KEY (MUST MATCH BACKEND)
const VAPID_PUBLIC_KEY = 'BHtsJphNSiWTw8gktlVPqT31n1cAVmoJXSDFQWA3xkm7ZIq6YS-k2L3KchmyFjIze4hdYxA9BdIHjnxPN-WBks0'

/**
 * Client-Side Notification Manager
 * Handles Service Worker registration and VAPID subscription handshake.
 */
export default function NotificationManager() {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPermission('unsupported')
      return
    }
    setPermission(Notification.permission)

    // Pre-register for faster 'ready' state
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.error('[Push] Initial SW registration failed:', err)
    })
  }, [])

  const subscribe = async () => {
    setLoading(true)
    setError(null)
    try {
      // 1. Request Permission
      const res = await Notification.requestPermission()
      setPermission(res)
      if (res !== 'granted') throw new Error('Permission denied by user')

      // 2. Wait for Service Worker to be Ready & Active
      const registration = await navigator.serviceWorker.ready
      
      // 3. Negotiate Push Subscription
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      })

      // 4. Dispatch to Backend
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON())
      })

      if (!response.ok) throw new Error('Backend Handshake Failed')
      
      console.log('[Push] Subscription negotiated successfully.')

    } catch (err: any) {
      console.error('[Push Subscription Error]:', err)
      setError(err.message || 'Subscription failed')
    } finally {
      setLoading(false)
    }
  }

  if (permission === 'unsupported') {
    return (
      <div 
        title="Push Notifications require a Secure Connection (HTTPS) and a supported browser."
        style={{ 
          color: 'var(--status-rejected)', background: 'rgba(239,68,68,0.1)', 
          padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center',
          cursor: 'help', opacity: 0.6
        }}
      >
        <BellOff size={20} />
      </div>
    )
  }

  return (
    <div style={{ padding: '4px' }}>
      {permission === 'granted' ? (
        <div 
          onClick={() => {}} // No-op if granted, they are safe
          title="Mobile Notifications Active"
          style={{ 
            color: '#10B981', background: 'rgba(16,185,129,0.1)', 
            padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center' 
          }}
        >
          <ShieldCheck size={20} />
        </div>
      ) : (
        <button
          onClick={subscribe}
          disabled={loading}
          style={{
            border: 'none', cursor: 'pointer',
            padding: '8px', borderRadius: '50%', background: 'rgba(56,189,248,0.1)',
            color: '#38BDF8', display: 'flex', alignItems: 'center', transition: 'all 0.2s'
          }}
          className="hover-opacity"
          title="Enable Mobile Notifications"
        >
          {loading ? (
             <Loader2 size={20} className="animate-spin" />
          ) : (
             <Bell size={20} />
          )}
        </button>
      )}
      {error && (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', background: '#EF4444', color: '#fff', padding: '12px 20px', borderRadius: '8px', fontSize: '13px', zIndex: 1000 }}>
          {error}
        </div>
      )}
    </div>
  )
}

/**
 * Helper to convert Base64 VAPID key to Uint8Array for PushManager
 */
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
