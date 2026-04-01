'use client'

import { useState } from 'react'
import { Bell, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

type Notice = {
  id: string
  name: string
  dueDate: string
  loanAmount: number | null
}

export default function NotificationBell({ notifications }: { notifications: Notice[] }) {
  const [isOpen, setIsOpen] = useState(false)

  // Only consider items strictly overdue or due within exactly 7 days
  const urgentCount = notifications.length

  return (
    <div style={{ position: 'relative' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          background: 'transparent', 
          border: 'none', 
          cursor: 'pointer', 
          display: 'flex', 
          alignItems: 'center', 
          padding: '8px',
          position: 'relative',
          color: 'var(--text-secondary)'
        }}
        className="hover-opacity"
      >
        <Bell size={20} />
        {urgentCount > 0 && (
          <div style={{ 
            position: 'absolute', 
            top: '4px', 
            right: '4px', 
            background: 'var(--status-rejected)', 
            color: '#fff', 
            fontSize: '10px', 
            fontWeight: 700, 
            width: '18px', 
            height: '18px', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            border: '2px solid var(--surface-color)'
          }}>
            {urgentCount}
          </div>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 90 }} 
            onClick={() => setIsOpen(false)}
          />
          <div style={{ 
            position: 'absolute', 
            top: 'calc(100% + 10px)', 
            right: 0, 
            width: 'calc(100vw - 32px)',
            maxWidth: '320px', 
            background: 'var(--surface-color)', 
            border: '1px solid var(--border-color)', 
            borderRadius: '12px', 
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            zIndex: 10000,
            overflow: 'hidden'
          }}>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Active Due Dates</h4>
               <span className="badge badge-rejected">{urgentCount} Pending</span>
            </div>
            
            <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                   <p style={{ fontSize: '13px', margin: 0 }}>No approaching deadlines on record.</p>
                </div>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column' }}>
                  {notifications.map(n => (
                    <li key={n.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <Link 
                        href={`/dashboard/customers/${n.id}`} 
                        onClick={() => setIsOpen(false)}
                        style={{ display: 'flex', gap: '12px', padding: '16px', textDecoration: 'none', transition: 'background 0.2s' }}
                        className="hover-bg-surface-hover"
                      >
                        <AlertCircle size={18} color="var(--status-rejected)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ color: 'var(--text-color)', fontWeight: 600, fontSize: '13px' }}>{n.name}</span>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                            {n.loanAmount ? `₹${n.loanAmount.toLocaleString()}` : 'No amount'} • Due {formatDistanceToNow(new Date(n.dueDate), { addSuffix: true })}
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        .hover-opacity:hover { opacity: 0.8; }
      `}} />
    </div>
  )
}
