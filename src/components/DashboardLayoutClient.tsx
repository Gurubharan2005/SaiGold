'use client'

import { useState } from 'react'
import DashboardSidebar from './DashboardSidebar'
import DashboardHeader from './DashboardHeader'

interface ClientLayoutProps {
  session: any
  notifications: any[]
  children: React.ReactNode
}

export default function DashboardLayoutClient({ session, notifications, children }: ClientLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color)' }}>
      <DashboardSidebar 
        session={session} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      <main style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh',
        width: '100%',
        minWidth: 0
      }}>
        <DashboardHeader 
          session={session} 
          notifications={notifications} 
          onMenuClick={() => setIsSidebarOpen(true)} 
        />
        
        <div style={{ padding: '32px', flex: 1, overflowY: 'auto' }} className="main-content-mobile">
          {children}
        </div>
      </main>
    </div>
  )
}
