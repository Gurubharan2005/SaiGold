import { LayoutDashboard, Users, UserPlus, FileText, Settings, LogOut } from 'lucide-react'
import Link from 'next/link'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color)' }}>
      {/* Sidebar Navigation */}
      <aside style={{ width: '260px', background: 'var(--surface-color)', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--primary-color)' }}>Sai Gold</span> CRM
          </h2>
        </div>
        
        <nav style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: 'var(--border-radius-sm)', background: 'var(--surface-hover)', fontWeight: 500 }}>
            <LayoutDashboard size={20} color="var(--primary-color)" /> Dashboard
          </Link>
          <Link href="/dashboard/customers" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: 'var(--border-radius-sm)', color: 'var(--text-secondary)', fontWeight: 500 }}>
            <Users size={20} /> Customers
          </Link>
          <Link href="/dashboard/leads" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: 'var(--border-radius-sm)', color: 'var(--text-secondary)', fontWeight: 500 }}>
            <UserPlus size={20} /> Meta Leads
          </Link>
          <Link href="/dashboard/documents" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: 'var(--border-radius-sm)', color: 'var(--text-secondary)', fontWeight: 500 }}>
            <FileText size={20} /> Documents
          </Link>
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
          <h3 style={{ margin: 0, fontWeight: 500, color: 'var(--text-secondary)' }}>Welcome back, Admin</h3>
          <div className="badge badge-accepted">MANAGER</div>
        </header>
        <div style={{ padding: '32px', flex: 1, overflowY: 'auto' }}>
          {children}
        </div>
      </main>
    </div>
  )
}
