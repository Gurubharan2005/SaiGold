import webpush from 'web-push'
import { prisma } from './prisma'

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BHtsJphNSiWTw8gktlVPqT31n1cAVmoJXSDFQWA3xkm7ZIq6YS-k2L3KchmyFjIze4hdYxA9BdIHjnxPN-WBks0'
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '90QHaDAzOGm3oo41ILoFv4fvrUhcWSzFx90ia9VuVDI'
const VAPID_MAILTO = process.env.VAPID_MAILTO || 'mailto:admin@saigold.live'

webpush.setVapidDetails(
  VAPID_MAILTO,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
)

/**
 * Dispatches a push notification to all active device subscriptions of a specific user.
 */
export async function triggerPushNotification(userId: string, title: string, body: string, url: string = '/dashboard') {
  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId }
    })

    if (subscriptions.length === 0) {
      console.log(`[Push] No active subscriptions found for User: ${userId}`)
      return
    }

    const payload = JSON.stringify({
      title,
      body,
      url,
      icon: '/logo.png', // Add a logo to your public folder for branding
      badge: '/badge.png'
    })

    const results = await Promise.all(
      subscriptions.map((sub: any) => 
        webpush.sendNotification({
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        }, payload).catch(async (err) => {
          if (err.statusCode === 410 || err.statusCode === 404) {
             // Subscription has expired
             console.log(`[Push] Purging expired subscription for User: ${userId}`)
             await prisma.pushSubscription.delete({ where: { id: sub.id } })
          }
          throw err
        })
      )
    )

    console.log(`[Push] Successfully dispatched to ${results.length} devices for User: ${userId}`)
  } catch (error) {
    console.error('[Push Error] Failure in triggerPushNotification:', error)
  }
}
