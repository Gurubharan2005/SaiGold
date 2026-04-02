import { prisma } from '@/lib/prisma'
import NotificationBell from './NotificationBell'
import { decrypt } from '@/lib/auth'
import { cookies } from 'next/headers'
import { Prisma } from '@prisma/client'

/**
 * High-Performance Notification Loader (Streaming)
 * This component fetches heavy database data for dues and follow-ups.
 * It is wrapped in a Suspense boundary to prevent blocking the initial page load.
 */
export default async function NotificationLoader() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const session = token ? await decrypt(token) : null

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const sevenDaysFromNow = new Date(now)
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

  // Re-use logic from the old layout fetch
  const baseWhere: Prisma.CustomerWhereInput = {
    status: { not: 'CLOSED' },
    OR: [
      { dueDate: { lte: sevenDaysFromNow, not: null } },
      { followUpDate: { lte: sevenDaysFromNow, not: null } }
    ],
    AND: [
      {
        OR: [
          { lastCalledAt: null },
          { lastCalledAt: { lt: startOfToday } }
        ]
      }
    ],
  }

  if (session?.role !== 'MANAGER' && session?.id) {
    const andArray = baseWhere.AND as Prisma.CustomerWhereInput[]
    andArray.push({
       OR: [
         { createdById: String(session.id) },
         { assignedToId: String(session.id) }
       ]
    })
  }

  // Heavy Query: This is what was causing the 3s delay
  const rawNotifications = await prisma.customer.findMany({
    where: baseWhere,
    select: { id: true, name: true, phone: true, dueDate: true, followUpDate: true, loanAmount: true },
    orderBy: { createdAt: 'desc' },
    take: 15
  })

  // Format natively for Client Component hydration
  const notifications = rawNotifications.map((n) => ({
    id: n.id,
    name: n.name,
    phone: n.phone,
    loanAmount: n.loanAmount,
    // Prefer dueDate, fall back to followUpDate; null means no schedule set
    dueDate: n.dueDate
      ? new Date(n.dueDate).toISOString()
      : n.followUpDate
        ? new Date(n.followUpDate).toISOString()
        : null
  }))

  return <NotificationBell notifications={notifications} />
}

/**
 * Skeleton for the Notification Bell to prevent layout shift
 */
export function NotificationSkeleton() {
  return (
    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
       <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} className="shimmer"></div>
    </div>
  )
}
