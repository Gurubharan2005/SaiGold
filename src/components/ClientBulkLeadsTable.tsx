'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Phone, MapPin, Loader2, Target, Check, X, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useEffect } from 'react'
import { LeadCard } from './LeadCard'

export default function ClientBulkLeadsTable({ 
  leads, 
  activeStaffList, 
  userRole 
}: { 
  leads: any[], 
  activeStaffList: { id: string, name: string }[], 
  userRole: string 
}) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [bulkAssignTo, setBulkAssignTo] = useState("")

  const toggleSelectAll = () => {
    if (selectedIds.length === leads.length && leads.length > 0) {
      setSelectedIds([])
    } else {
      setSelectedIds(leads.map(lead => lead.id))
    }
  }

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(checkedId => checkedId !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  // Implementation of Continuous Sync logic
  useEffect(() => {
    // Polling interval: 30 seconds
    const interval = setInterval(() => {
      if (!loading && selectedIds.length === 0) {
        router.refresh()
      }
    }, 30000)
    
    return () => clearInterval(interval)
  }, [router, loading, selectedIds.length])

  const handleBulkAssign = async () => {
    if (!bulkAssignTo || selectedIds.length === 0) return

    setLoading(true)
    try {
      const res = await fetch('/api/customers/bulk-assign', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerIds: selectedIds, assignedToId: bulkAssignTo })
      })
      if (!res.ok) throw new Error('Failed to dispatch mass allocation')
      
      setSelectedIds([])
      router.refresh()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card" style={{ padding: '0', position: 'relative' }}>
      
      {/* Bulk Dispatch Action Bar (Managers Only) */}
      {userRole === 'MANAGER' && selectedIds.length > 0 && (
        <div className="fade-in" style={{ 
          background: 'var(--primary-color)', color: '#000', padding: '12px 24px', 
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid rgba(0,0,0,0.1)' 
        }}>
          <div style={{ fontWeight: 700, fontSize: '14px' }}>{selectedIds.length} Leads Selected</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <select 
              value={bulkAssignTo}
              onChange={(e) => setBulkAssignTo(e.target.value)}
              style={{
                padding: '8px 12px', borderRadius: '6px', border: 'none',
                background: 'rgba(255,255,255,0.9)', color: '#000', fontSize: '13px', fontWeight: 600, outline: 'none'
              }}
            >
              <option value="" disabled>Select Staff to Assign...</option>
              {activeStaffList.map(staff => (
                <option key={staff.id} value={staff.id}>{staff.name}</option>
              ))}
            </select>
            <button 
              onClick={handleBulkAssign}
              disabled={!bulkAssignTo || loading}
              style={{ 
                background: '#000', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '8px', opacity: (!bulkAssignTo || loading) ? 0.7 : 1, cursor: 'pointer' 
              }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Target size={16} />} 
              Dispatch Selected
            </button>
          </div>
        </div>
      )}

      {/* Manual Refresh & Status Bar */}
      <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'flex-end', borderBottom: '1px solid var(--border-color)', background: 'var(--surface-color)' }}>
        <button 
          onClick={() => router.refresh()}
          style={{ 
            background: 'none', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', 
            padding: '6px 12px', borderRadius: '4px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' 
          }}
        >
          <Clock size={14} /> Auto-Syncing (30s)
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px', padding: '24px' }}>
        {leads.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)', gridColumn: '1 / -1' }}>
            No new leads from Meta Ads currently.
          </div>
        ) : (
          leads.map((lead: any) => (
             <div key={lead.id} style={{ position: 'relative' }}>
               {userRole === 'MANAGER' && (
                 <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10 }}>
                   <input 
                     type="checkbox" 
                     checked={selectedIds.includes(lead.id)} 
                     onChange={() => toggleSelect(lead.id)} 
                     style={{ cursor: 'pointer', accentColor: 'var(--primary-color)', transform: 'scale(1.2)' }}
                   />
                 </div>
               )}
               <div style={{ opacity: selectedIds.includes(lead.id) ? 0.7 : 1, transition: 'opacity 0.2s', height: '100%' }}>
                 <LeadCard customer={lead} />
               </div>
             </div>
          ))
        )}
      </div>
  </div>
  )
}
