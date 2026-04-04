'use client'

import { useState, ReactNode } from 'react'
import { Menu, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  session: any
  noticeSlot?: ReactNode // Support for Streaming Notifications
  onMenuClick: () => void
}

export default function DashboardHeader({ session, noticeSlot, onMenuClick }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Use the generic /customers ongoing layout for searches, it handles cross-status searching natively
      router.push(`/dashboard/customers?tab=ongoing&search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

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
      zIndex: 50,
      gap: '16px'
    }} className="header-mobile">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: '1 1 auto' }}>
        <button 
          onClick={onMenuClick} 
          className="mobile-show"
          style={{ 
            color: 'var(--text-primary)', 
            padding: '8px', 
            borderRadius: 'var(--border-radius-sm)',
            background: 'rgba(255, 255, 255, 0.05)',
            flexShrink: 0
          }}
        >
          <Menu size={24} />
        </button>
        <h3 style={{ margin: 0, fontWeight: 500, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }} className="mobile-hide">
          Welcome back, {session?.name || 'User'}
        </h3>
        
        {/* Global Omni-Search */}
        <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', position: 'relative', maxWidth: '300px', width: '100%', marginLeft: '16px' }} className="mobile-hide">
           <Search size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px' }} />
           <input 
             type="text" 
             placeholder="Search name or phone..." 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             style={{ 
               width: '100%', 
               padding: '8px 16px 8px 36px', 
               borderRadius: '20px', 
               background: 'rgba(255, 255, 255, 0.05)', 
               border: '1px solid rgba(255, 255, 255, 0.1)',
               color: 'var(--text-primary)',
               fontSize: '14px',
               outline: 'none',
               transition: 'all 0.2s'
             }} 
           />
        </form>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
        <div className={`badge badge-${session?.role === 'MANAGER' ? 'accepted' : 'processing'}`}>
          {session?.role || 'STAFF'}
        </div>
      </div>
    </header>
  )
}
