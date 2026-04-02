'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save, X, Calendar, DollarSign, StickyNote } from 'lucide-react'

export default function OngoingQuickUpdate({ 
  customerId, 
  initialAmount, 
  initialDate,
  initialNotes
}: { 
  customerId: string, 
  initialAmount?: number | null, 
  initialDate?: Date | null,
  initialNotes?: string | null
}) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [amount, setAmount] = useState(initialAmount?.toString() || '')
  const [dueDate, setDueDate] = useState(initialDate ? new Date(initialDate).toISOString().split('T')[0] : '')
  const [notes, setNotes] = useState(initialNotes || '')

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          loanAmount: amount ? parseFloat(amount) : null,
          dueDate: dueDate || null,
          notes: notes || null
        }),
      })

      if (!res.ok) throw new Error('Update failed')
      
      setIsOpen(false)
      router.refresh()
    } catch {
      alert('Failed to save loan details.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="btn-secondary"
        style={{ 
          width: '100%',
          padding: '10px 0', 
          fontSize: '14px', 
          background: 'var(--status-waiting)', 
          border: 'none', 
          color: 'white',
          fontWeight: 600,
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
      >
        <Calendar size={16} /> Set Info
      </button>

      {isOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div className="card fade-in" style={{ 
            width: '100%', 
            maxWidth: '450px', 
            background: 'var(--surface-color)', 
            padding: '24px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            border: '1px solid var(--border-color)',
            position: 'relative'
          }}>
            <button 
              onClick={() => setIsOpen(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--text-secondary)', background: 'none', border: 'none' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ margin: '0 0 24px 0', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <DollarSign size={20} color="var(--primary-color)" />
              Update Loan Details
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <Calendar size={14} /> Due Date
                </label>
                <input 
                  type="date" 
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  disabled={loading}
                  style={{ width: '100%', padding: '12px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white' }}
                />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <DollarSign size={14} /> Amount to be Paid
                </label>
                <input 
                  type="number" 
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={loading}
                  style={{ width: '100%', padding: '12px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white' }}
                />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <StickyNote size={14} /> Remainder Notes
                </label>
                <textarea 
                  placeholder="Any reminders or payment notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={loading}
                  rows={3}
                  style={{ width: '100%', padding: '12px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="btn-secondary"
                  style={{ flex: 1, padding: '12px' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  disabled={loading}
                  className="btn-primary"
                  style={{ flex: 2, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  {loading ? 'Saving...' : 'Save Loan Info'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
