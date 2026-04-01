import { LayoutDashboard, Users, UserPlus, FileText, Settings, LogOut, ShieldCheck, Target, Activity } from 'lucide-react'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'
import LocationBroadcaster from '@/components/LocationBroadcaster'
import { prisma } from '@/lib/prisma'
import DashboardLayoutClient from '@/components/DashboardLayoutClient'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const session = token ? await decrypt(token) : null

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const sevenDaysFromNow = new Date(now)
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

  // Contextually fetch incoming constraints (Dues & Follow-Ups)
  const baseWhere: any = {
    status: { not: 'CLOSED' },
    OR: [
      { dueDate: { lte: sevenDaysFromNow, not: null } },
      { followUpDate: { lte: sevenDaysFromNow, not: null } }
    ],
    // DISMISSAL: Only show if NOT CAUGHT TODAY
    AND: [
      {
        OR: [
          { lastCalledAt: null },
          { lastCalledAt: { lt: startOfToday } }
        ]
      }
    ]
  }

  if (session?.role !== 'MANAGER') {
    baseWhere.AND.push({
       OR: [
         { createdById: String(session?.id) },
         { assignedToId: String(session?.id) }
       ]
    })
  }

  const rawNotifications = await prisma.customer.findMany({
    where: baseWhere,
    select: { id: true, name: true, phone: true, dueDate: true, followUpDate: true, loanAmount: true },
    orderBy: { createdAt: 'desc' },
    take: 15
  })

  // Format natively for Client Component hydration
  const notifications = rawNotifications.map((n: any) => ({
    id: n.id,
    name: n.name,
    phone: n.phone,
    loanAmount: n.loanAmount,
    dueDate: n.dueDate ? new Date(n.dueDate).toISOString() : n.followUpDate ? new Date(n.followUpDate).toISOString() : new Date().toISOString()
  }))

  return (
    <>
      <LocationBroadcaster isStaff={session?.role === 'STAFF'} />
      <DashboardLayoutClient session={session} notifications={notifications}>
        {children}
      </DashboardLayoutClient>
    </>
  )
}
