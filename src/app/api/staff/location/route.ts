import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const session = await decrypt(token)
    if (!session || session.role !== 'STAFF') {
      return NextResponse.json({ error: 'Forbidden. Tracking limited to field staff.' }, { status: 403 })
    }

    const body = await request.json()
    const { lat, lng } = body

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json({ error: 'Invalid coordinates payload structure' }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: String(session.id) },
      data: {
        lat,
        lng,
        locationUpdatedAt: new Date()
      }
    })

    return NextResponse.json({ success: true, timestamp: Date.now() })
  } catch (error) {
    console.error('[GEOLOCATION_SYNC_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error patching coordinates' }, { status: 500 })
  }
}
