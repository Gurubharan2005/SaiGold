import { LayoutDashboard, Users, UserPlus, FileText, Settings, LogOut, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'
import NotificationBell from '@/components/NotificationBell'
import LocationBroadcaster from '@/components/LocationBroadcaster'
import { prisma } from '@/lib/prisma'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const session = token ? await decrypt(token) : null

  const sevenDaysFromNow = new Date()
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

  // Contextually fetch incoming constraints
  const rawNotifications = await prisma.customer.findMany({
    where: {
      status: { not: 'CLOSED' },
      dueDate: {
        lte: sevenDaysFromNow,
        not: null
      },
      ...(session?.role !== 'MANAGER' ? {
         OR: [
           { createdById: String(session?.id) },
           { assignedToId: String(session?.id) }
         ]
      } : {})
    },
    select: { id: true, name: true, dueDate: true, loanAmount: true },
    orderBy: { dueDate: 'asc' },
    take: 15
  })

  // Format natively for Client Component hydration
  const notifications = rawNotifications.map((n: any) => ({
    id: n.id,
    name: n.name,
    loanAmount: n.loanAmount,
    dueDate: new Date(n.dueDate!).toISOString()
  }))

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color)' }}>
      <LocationBroadcaster isStaff={session?.role === 'STAFF'} />
      {/* Sidebar Navigation */}
      <aside style={{ width: '260px', background: 'var(--surface-color)', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)' }}>
          <Link href="/dashboard" style={{ textDecoration: 'none', color: 'inherit' }}>
            <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, cursor: 'pointer' }}>
              <span style={{ color: 'var(--primary-color)' }}>Sai Gold</span> CRM
            </h2>
          </Link>
        </div>
        
        <nav style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: 'var(--border-radius-sm)', background: 'var(--surface-hover)', fontWeight: 500 }}>
            <LayoutDashboard size={20} color="var(--primary-color)" /> Dashboard
          </Link>
          <Link href="/dashboard/customers?tab=new" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: 'var(--border-radius-sm)', color: 'var(--text-secondary)', fontWeight: 500 }}>
            <Users size={20} /> New Customers
          </Link>
          <Link href="/dashboard/customers?tab=ongoing" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: 'var(--border-radius-sm)', color: 'var(--text-secondary)', fontWeight: 500 }}>
            <UserPlus size={20} /> Ongoing Customers
          </Link>
          {session?.role === 'MANAGER' && (
            <>
              <Link href="/dashboard/leads" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: 'var(--border-radius-sm)', color: 'var(--text-secondary)', fontWeight: 500 }}>
                <UserPlus size={20} /> Meta Leads
              </Link>
              <Link href="/dashboard/documents" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: 'var(--border-radius-sm)', color: 'var(--text-secondary)', fontWeight: 500 }}>
                <FileText size={20} /> Documents
              </Link>
              <Link href="/dashboard/staff" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: 'var(--border-radius-sm)', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                <ShieldCheck size={20} /> Staff Management
              </Link>
            </>
          )}
        </nav>

        <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)' }}>
          <Link href="/settings" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', color: 'var(--text-secondary)' }}>
            <Settings size={20} /> Settings
          </Link>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', color: 'var(--status-rejected)' }}>
            <LogOut size={20} /> Logout
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{ height: '70px', borderBottom: '1px solid var(--border-color)', background: 'var(--surface-color)/50', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', padding: '0 32px', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontWeight: 500, color: 'var(--text-secondary)' }}>Welcome back, {session?.name || 'User'}</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <NotificationBell notifications={notifications} />
            <div className={`badge badge-${session?.role === 'MANAGER' ? 'accepted' : 'processing'}`}>
              {session?.role || 'STAFF'}
            </div>
          </div>
        </header>
        <div style={{ padding: '32px', flex: 1, overflowY: 'auto' }}>
          {children}
        </div>
      </main>
    </div>
  )
}
