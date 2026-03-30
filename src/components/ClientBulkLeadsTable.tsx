'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Phone, MapPin, Loader2, Target, Check, X, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useEffect } from 'react'

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

      <div className="table-container" style={{ margin: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
        <thead>
          <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-color)' }}>
            <th style={{ padding: '16px', width: '40px', textAlign: 'center' }}>
              {userRole === 'MANAGER' && (
                <input 
                  type="checkbox" 
                  checked={selectedIds.length === leads.length && leads.length > 0} 
                  onChange={toggleSelectAll} 
                  style={{ cursor: 'pointer', accentColor: 'var(--primary-color)' }}
                />
              )}
            </th>
            <th style={{ padding: '16px 16px 16px 0', fontWeight: 600, color: 'var(--text-secondary)' }}>Customer Name</th>
            <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Contact Info</th>
            <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Loan Details</th>
            <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Received</th>
          </tr>
        </thead>
        <tbody>
          {leads.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No new leads from Meta Ads currently.
              </td>
            </tr>
          ) : (
            leads.map((lead: any) => (
              <tr key={lead.id} style={{ borderBottom: '1px solid var(--border-color)', background: selectedIds.includes(lead.id) ? 'rgba(245, 158, 11, 0.05)' : 'transparent', transition: 'background 0.2s' }}>
                <td style={{ padding: '16px', textAlign: 'center' }}>
                  {userRole === 'MANAGER' && (
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(lead.id)} 
                      onChange={() => toggleSelect(lead.id)} 
                      style={{ cursor: 'pointer', accentColor: 'var(--primary-color)' }}
                    />
                  )}
                </td>
                <td style={{ padding: '16px 16px 16px 0', fontWeight: 500 }}>{lead.name}</td>
                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <Phone size={14} color="var(--text-secondary)" /> {lead.phone}
                  </div>
                  {lead.branch && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <MapPin size={14} /> {lead.branch}
                    </div>
                  )}
                </td>
                <td style={{ padding: '16px' }}>
                  {lead.goldWeight ? (
                    <span style={{ color: 'var(--primary-color)', fontWeight: 600 }}>{lead.goldWeight}g</span>
                  ) : (
                    <span style={{ color: 'var(--text-secondary)' }}>N/A</span>
                  )}
                  {lead.loanAmount && ` / ₹${lead.loanAmount.toLocaleString()}`}
                </td>
                <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                  {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
  )
}
