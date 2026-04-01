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

    // 2. Local session check using synchronous localStorage (more reliable on iOS back-button than cookies)
    const checkSession = () => {
      // If we are in the browser and the login flag is missing, self-destruct.
      if (typeof window !== 'undefined' && !localStorage.getItem('isLoggedIn')) {
        window.location.replace('/') 
      }
    }

    // Check immediately on mount
    checkSession()
    
    // Check every 200ms to catch fast back-navigations
    const interval = setInterval(checkSession, 200)

    // Listen for storage events (in case user logs out from another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'isLoggedIn' && !e.newValue) {
        window.location.replace('/')
      }
    }
    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('pageshow', handlePageShow)
      window.removeEventListener('storage', handleStorageChange)
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
