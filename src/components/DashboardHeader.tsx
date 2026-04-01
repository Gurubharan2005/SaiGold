'use client'

import { Menu } from 'lucide-react'
import NotificationBell from '@/components/NotificationBell'

interface HeaderProps {
  session: any
  notifications: any[]
  onMenuClick: () => void
}

export default function DashboardHeader({ session, notifications, onMenuClick }: HeaderProps) {
  return (
    <header style={{ 
      height: '70px', 
      minHeight: '70px',
      borderBottom: '1px solid var(--border-color)', 
      background: 'rgba(17, 24, 39, 0.8)', 
      backdropFilter: 'blur(12px)', 
      display: 'flex', 
      alignItems: 'center', 
      padding: '0 32px', 
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }} className="header-mobile">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button 
          onClick={onMenuClick} 
          className="mobile-show"
          style={{ 
            color: 'var(--text-primary)', 
            padding: '8px', 
            borderRadius: 'var(--border-radius-sm)',
            background: 'rgba(255, 255, 255, 0.05)'
          }}
        >
          <Menu size={24} />
        </button>
        <h3 style={{ margin: 0, fontWeight: 500, color: 'var(--text-secondary)' }} className="mobile-hide">
          Welcome back, {session?.name || 'User'}
        </h3>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <NotificationBell notifications={notifications} />
        <div className={`badge badge-${session?.role === 'MANAGER' ? 'accepted' : 'processing'}`}>
          {session?.role || 'STAFF'}
        </div>
      </div>
    </header>
  )
}
