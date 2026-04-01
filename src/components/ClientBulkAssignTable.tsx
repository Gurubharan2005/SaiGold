'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, UserPlus, UserCircle, Loader2, Target } from 'lucide-react'
import { format } from 'date-fns'
import AssignLeadDropdown from './AssignLeadDropdown'

export default function ClientBulkAssignTable({ 
  customers, 
  activeStaffList, 
  userRole 
}: { 
  customers: any[], 
  activeStaffList: { id: string, name: string }[], 
  userRole: string 
}) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [bulkAssignTo, setBulkAssignTo] = useState("")

  const toggleSelectAll = () => {
    if (selectedIds.length === customers.length && customers.length > 0) {
      setSelectedIds([])
    } else {
      setSelectedIds(customers.map(c => c.id))
    }
  }

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
       setSelectedIds(selectedIds.filter(checkedId => checkedId !== id))
    } else {
       setSelectedIds([...selectedIds, id])
    }
  }

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
    <div className="card" style={{ padding: '0', overflow: 'hidden', position: 'relative' }}>
      
      {/* Dynamic Action Bar (Manager Only + Checked Context) */}
      {userRole === 'MANAGER' && selectedIds.length > 0 && (
        <div className="fade-in" style={{ 
          background: 'var(--primary-color)', color: '#000', padding: '12px 24px', 
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '12px',
          borderBottom: '1px solid rgba(0,0,0,0.1)' 
        }}>
          <div style={{ fontWeight: 700, fontSize: '14px' }}>{selectedIds.length} Customers Locked</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <select 
              value={bulkAssignTo}
              onChange={(e) => setBulkAssignTo(e.target.value)}
              style={{
                padding: '8px 12px', borderRadius: '6px', border: 'none',
                background: 'rgba(255,255,255,0.9)', color: '#000', fontSize: '13px', fontWeight: 600, outline: 'none'
              }}
            >
              <option value="" disabled>Select Target Agent...</option>
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
              Dispatch
            </button>
          </div>
        </div>
      )}

      {/* Standard Header */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--surface-color)' }}>
        <h2 style={{ fontSize: '18px', margin: 0 }}>Recent Global Acquisitions</h2>
      </div>

      <div className="table-container">
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
          <thead>
            <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '16px', width: '40px', textAlign: 'center' }}>
                {userRole === 'MANAGER' && (
                  <input 
                    type="checkbox" 
                    checked={selectedIds.length === customers.length && customers.length > 0} 
                    onChange={toggleSelectAll} 
                    style={{ cursor: 'pointer', accentColor: 'var(--primary-color)' }}
                  />
                )}
              </th>
              <th style={{ padding: '16px 16px 16px 0', fontWeight: 600, color: 'var(--text-secondary)' }}>Customer Data</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Workflow State</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Handling Agent</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Acquisition Origin</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Creation Date</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No active customers found.
                </td>
              </tr>
            ) : (
              customers.map((c: any) => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)', background: selectedIds.includes(c.id) ? 'rgba(245, 158, 11, 0.05)' : 'transparent', transition: 'background 0.2s' }}>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    {userRole === 'MANAGER' && (
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(c.id)} 
                        onChange={() => toggleSelect(c.id)} 
                        style={{ cursor: 'pointer', accentColor: 'var(--primary-color)' }}
                      />
                    )}
                  </td>
                  <td style={{ padding: '16px 16px 16px 0' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-color)', marginBottom: '4px' }}>{c.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{c.phone}</div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span className={`badge badge-${c.status.toLowerCase()}`}>{c.status}</span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    {c.assignedTo ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <UserCircle size={16} color="var(--primary-color)" />
                          <span style={{ fontSize: '13px', fontWeight: 600 }}>{c.assignedTo.name}</span>
                      </div>
                    ) : userRole === 'MANAGER' ? (
                      <AssignLeadDropdown customerId={c.id} staffList={activeStaffList} />
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Unassigned Vault</span>
                    )}
                  </td>
                  <td style={{ padding: '16px' }}>
                    {c.createdById ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                        <UserPlus size={12} /> Custom Added
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: 'rgba(6, 182, 212, 0.15)', color: '#06B6D4', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                        <FileText size={12} /> Meta Lead
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                    {format(new Date(c.createdAt), 'MMM dd, yyyy p')}
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
