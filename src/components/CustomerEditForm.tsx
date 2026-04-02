'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, X, Check } from 'lucide-react'

export interface CustomerData {
  id: string
  name: string
  phone: string
  branch?: string | null
  loanAmount?: number | null
  goldWeight?: number | null
  interestRate?: number | null
  startDate?: string | Date | null
}

export function CustomerEditForm({ customer, isOpen, onClose }: { customer: CustomerData, isOpen: boolean, onClose: () => void }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: customer.name || '',
    phone: customer.phone || '',
    branch: customer.branch || '',
    loanAmount: customer.loanAmount || '',
    goldWeight: customer.goldWeight || '',
    interestRate: customer.interestRate || '',
    startDate: customer.startDate ? new Date(customer.startDate).toISOString().slice(0, 10) : ''
  })

  if (!isOpen) return null

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload: Record<string, unknown> = {
        name: formData.name,
        phone: formData.phone,
        branch: formData.branch,
      }
      if (formData.loanAmount) payload.loanAmount = parseFloat(formData.loanAmount.toString())
      if (formData.goldWeight) payload.goldWeight = parseFloat(formData.goldWeight.toString())
      if (formData.interestRate) payload.interestRate = parseFloat(formData.interestRate.toString())
      if (formData.startDate) payload.startDate = formData.startDate

      const res = await fetch(`/api/customers/${customer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error('Failed to update customer data')
      
      router.refresh()
      onClose()
    } catch (error) {
       alert('Error updating customer')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div className="card fade-in" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '20px' }}>Edit Customer Master Data</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="straight-layout-mobile" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
             <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>Full Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required style={{ width: '100%', height: '44px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '16px' }} />
             </div>
             <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>Phone Number</label>
                <input type="text" name="phone" value={formData.phone} onChange={handleChange} required style={{ width: '100%', height: '44px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '16px' }} />
             </div>
          </div>

          <div>
             <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>Branch Location</label>
             <input type="text" name="branch" value={formData.branch} onChange={handleChange} style={{ width: '100%', height: '44px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '16px' }} />
          </div>

          <div className="straight-layout-mobile" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
             <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>Loan Amount (₹)</label>
                <input type="number" name="loanAmount" value={formData.loanAmount} onChange={handleChange} style={{ width: '100%', height: '44px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '16px' }} />
             </div>
             <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>Gold Weight (g)</label>
                <input type="number" step="0.01" name="goldWeight" value={formData.goldWeight} onChange={handleChange} style={{ width: '100%', height: '44px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '16px' }} />
             </div>
          </div>

          <div className="straight-layout-mobile" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
             <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>Interest Rate (%)</label>
                <input type="number" step="0.01" name="interestRate" value={formData.interestRate} onChange={handleChange} style={{ width: '100%', height: '44px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '16px' }} />
             </div>
             <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>Start Date</label>
                <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} style={{ width: '100%', height: '44px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '16px' }} />
             </div>
          </div>

          <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '12px', background: 'var(--surface-hover)', border: '1px solid var(--border-color)', borderRadius: '8px', fontWeight: 600 }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ flex: 2, padding: '12px', background: 'var(--primary-color)', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
