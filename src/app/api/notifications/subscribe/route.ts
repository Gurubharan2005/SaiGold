import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'

/**
 * Handle Browser Push Subscriptions
 * POST /api/notifications/subscribe
 */
export async function POST(req: Request) {
  try {
    const { endpoint, keys } = await req.json()
    const { p256dh, auth } = keys

    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value
    const session = token ? await decrypt(token) : null

    if (!session || !session.id) {
       return NextResponse.json({ error: 'Unauthorized Session' }, { status: 401 })
    }

    // Upsert: One subscription per user+endpoint
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        userId: String(session.id),
        p256dh,
        auth,
      },
      create: {
        userId: String(session.id),
        endpoint,
        p256dh,
        auth,
      }
    })

    return NextResponse.json({ success: true, message: 'Subscription Handshake Complete' })
  } catch (error) {
    console.error('[Push Subscription Error]:', error)
    return NextResponse.json({ error: 'Failed to negotiate subscription' }, { status: 500 })
  }
}
