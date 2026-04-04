/**
 * SAI GOLD CRM: BACKGROUND PUSH SERVICE WORKER
 */
self.addEventListener('push', function(event) {
  if (!event.data) return

  try {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: data.icon || '/logo.png',
      badge: data.badge || '/badge.png',
      vibrate: [200, 100, 200],
      data: {
        url: data.url || '/dashboard'
      },
      // Keep the notification active until the user interacts
      requireInteraction: true,
      tag: 'lead-assignment', // Prevent cluttering by replacing old assignment notifications
      renotify: true
    }

    event.waitUntil(
      self.registration.showNotification(data.title || 'New Lead Alert', options)
    )
  } catch (err) {
    console.error('[SW] Push Error:', err)
  }
})

self.addEventListener('notificationclick', function(event) {
  event.notification.close()
  
  const targetUrl = event.notification.data.url

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // 1. If a window is already open, focus it and navigate
      for (const client of windowClients) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus()
        }
      }
      // 2. If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
    })
  )
})
