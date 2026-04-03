'use client'

import { LayoutDashboard, Users, UserPlus, FileText, Settings, LogOut, ShieldCheck, Target, Activity, X, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SidebarProps {
  session: any
  isOpen: boolean
  onClose: () => void
}

export default function DashboardSidebar({ session, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  const navItemStyle = (path: string) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    borderRadius: 'var(--border-radius-sm)',
    background: isActive(path) ? 'var(--surface-hover)' : 'transparent',
    color: isActive(path) ? 'var(--text-primary)' : 'var(--text-secondary)',
    fontWeight: 500,
    textDecoration: 'none',
    transition: 'all 0.2s'
  })

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="sidebar-overlay mobile-show"
        />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/dashboard" onClick={onClose} style={{ textDecoration: 'none', color: 'inherit' }}>
            <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, cursor: 'pointer' }}>
              <span style={{ color: 'var(--primary-color)' }}>Sai Gold</span> CRM
            </h2>
          </Link>
          <button 
            onClick={onClose} 
            className="mobile-show"
            style={{ color: 'var(--text-secondary)', padding: '4px' }}
          >
            <X size={24} />
          </button>
        </div>
        
        <nav style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>
          <Link href="/dashboard" onClick={onClose} style={navItemStyle('/dashboard')}>
            <LayoutDashboard size={20} color={isActive('/dashboard') ? 'var(--primary-color)' : 'currentColor'} /> Dashboard
          </Link>

          {session?.role === 'SALESMAN' && (
            <Link href="/dashboard/sales" onClick={onClose} style={navItemStyle('/dashboard/sales')}>
              <Target size={20} color="var(--status-accepted)" /> Sales Module
            </Link>
          )}

          {(session?.role === 'MANAGER' || session?.role === 'STAFF') && (
            <Link href="/dashboard/customers?tab=ongoing" onClick={onClose} style={navItemStyle('/dashboard/customers?tab=ongoing')}>
              <Users size={20} color="var(--primary-color)" /> Active Customers
            </Link>
          )}

          {(session?.role === 'MANAGER' || session?.role === 'STAFF') && (
            <Link href="/dashboard/leads" onClick={onClose} style={navItemStyle('/dashboard/leads')}>
              <Activity size={20} color="var(--status-waiting)" /> {session?.role === 'MANAGER' ? 'Facebook Ad Leads' : 'My Ad Leads'}
            </Link>
          )}

          {(session?.role === 'MANAGER' || session?.role === 'STAFF') && (
             <Link href="/dashboard/detail-filling" onClick={onClose} style={navItemStyle('/dashboard/detail-filling')}>
               <FileText size={20} color="var(--status-processing)" /> Loan Master Form
             </Link>
          )}

          {session?.role === 'MANAGER' && (
            <>
              <Link href="/dashboard/analytics" onClick={onClose} style={navItemStyle('/dashboard/analytics')}>
                <TrendingUp size={20} color="var(--primary-color)" /> Business Performance
              </Link>
              <Link href="/dashboard/documents" onClick={onClose} style={navItemStyle('/dashboard/documents')}>
                <FileText size={20} /> Documents
              </Link>
              <Link href="/dashboard/staff" onClick={onClose} style={{ ...navItemStyle('/dashboard/staff'), marginTop: '16px', borderTop: '1px solid var(--border-color)', borderRadius: 0, paddingTop: '16px' }}>
                <ShieldCheck size={20} /> Staff Management
              </Link>
            </>
          )}
        </nav>

        <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)' }}>
          <Link href="/settings" onClick={onClose} style={{ ...navItemStyle('/settings'), color: 'var(--text-secondary)' }}>
            <Settings size={20} /> Settings
          </Link>
          <button 
            onClick={async () => {
              // 1. Manually wipe the UI session cookie immediately
              document.cookie = 'session-active=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
              // 1b. Wipe localStorage
              localStorage.removeItem('isLoggedIn')
              // 2. Clear server-side session
              await fetch('/api/auth/logout', { method: 'POST' })
              // 3. Hard redirect without saving history
              window.location.replace('/')
            }}
            style={{ 
              ...navItemStyle('/'), 
              width: '100%', 
              textAlign: 'left', 
              color: 'var(--status-rejected)', 
              cursor: 'pointer',
              border: 'none',
              background: 'transparent'
            }}
          >
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      {/* Spacer for desktop layout: visible by default, hidden on mobile */}
      <div className="sidebar-spacer" />
    </>
  )
}
