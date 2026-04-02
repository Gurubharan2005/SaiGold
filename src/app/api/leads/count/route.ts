import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'

// Lightweight count endpoint polled every 10s by LiveLeadsRefresh component
export async function GET(): Promise<NextResponse> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const session = token ? await decrypt(token) : null

  if (!session?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isManager = session.role === 'MANAGER'

  const count = await prisma.customer.count({
    where: {
      status: { in: ['WAITING', 'ACCEPTED', 'PROCESSING', 'VERIFIED', 'FOLLOW_UP', 'NO_RESPONSE'] },
      ...(isManager ? {} : { assignedToId: String(session.id) })
    }
  })

  return NextResponse.json({ count }, {
    headers: {
      // No caching — always fresh
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    }
  })
}
