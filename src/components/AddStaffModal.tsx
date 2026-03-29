'use client'

import { useState } from 'react'
import { Plus, X, ShieldAlert } from 'lucide-react'
import StaffForm from './StaffForm'

export default function AddStaffModal() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        className="btn-primary" 
        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px' }}
      >
        <Plus size={18} /> Add Staff
      </button>

      {isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card fade-in" style={{ width: '100%', maxWidth: '480px', position: 'relative' }}>
            <button 
              onClick={() => setIsOpen(false)} 
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
            >
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '16px' }}>
               <ShieldAlert size={20} color="var(--status-rejected)" /> Create Restricted Staff
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Staff members can view and process normal customer profiles and loans, but they are completely blocked from accessing this administration screen or changing company settings.
            </p>
            <StaffForm onSuccess={() => setIsOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}
