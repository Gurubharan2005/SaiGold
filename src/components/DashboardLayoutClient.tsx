import { useState, useEffect } from 'react'
import DashboardSidebar from './DashboardSidebar'
import DashboardHeader from './DashboardHeader'

interface ClientLayoutProps {
  session: any
  notifications: any[]
  children: React.ReactNode
}

export default function DashboardLayoutClient({ session, notifications, children }: ClientLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Security: Handle "Back" button after logout and active session monitoring
  useEffect(() => {
    // 1. Force reload on back-forward cache restoration
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        window.location.reload()
      }
    }
    window.addEventListener('pageshow', handlePageShow)

    // 2. Local session check: Immediately destroy view if session cookie is gone
    const checkSession = () => {
      if (!document.cookie.includes('session-active=true')) {
        window.location.replace('/') // Immediate redirect, no history
      }
    }

    // Check immediately on mount, and then every 200ms to catch fast back-navigations
    checkSession()
    const interval = setInterval(checkSession, 200)

    return () => {
      window.removeEventListener('pageshow', handlePageShow)
      clearInterval(interval)
    }
  }, [])

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
