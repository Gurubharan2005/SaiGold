import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'
import LocationBroadcaster from '@/components/LocationBroadcaster'
import DashboardLayoutClient from '@/components/DashboardLayoutClient'
import NotificationLoader, { NotificationSkeleton } from '@/components/NotificationLoader'
import { Suspense } from 'react'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const session = token ? await decrypt(token) : null

  return (
    <>
      <LocationBroadcaster isStaff={session?.role === 'STAFF'} />
      <DashboardLayoutClient 
        session={session} 
        noticeSlot={
          <Suspense fallback={<NotificationSkeleton />}>
            <NotificationLoader />
          </Suspense>
        }
      >
        {children}
      </DashboardLayoutClient>
    </>
  )
}
