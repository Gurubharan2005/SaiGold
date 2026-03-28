'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function NewCustomerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    goldWeight: '',
    loanAmount: '',
    branch: '',
    notes: ''
  })

  // We reuse the webhook/api logic but hit a direct POST for CRM customers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // For simplicity, we can reuse the same Meta Webhook POST logic,
      // OR we create a fresh API /api/customers POST route. Wait, the webhook route returns customerId. Let's create `POST /api/customers`.
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...formData, 
          // New manual customers start as PROCESSING directly.
          status: 'PROCESSING',
          goldWeight: parseFloat(formData.goldWeight),
          loanAmount: parseFloat(formData.loanAmount)
        })
      })

      if (!res.ok) throw new Error('Failed to create customer')
      const data = await res.json()

      router.push(`/dashboard/customers/${data.customer.id}`)
      router.refresh()
    } catch (error) {
      alert("Error saving customer.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fade-in max-w-3xl">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <Link href="/dashboard/customers" style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft size={24} />
        </Link>
        <h1 style={{ fontSize: '28px', margin: 0 }}>Add New Customer</h1>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: 'var(--text-secondary)' }}>Full Name</label>
              <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '10px' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: 'var(--text-secondary)' }}>Phone Number</label>
              <input type="tel" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={{ width: '100%', padding: '10px' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: 'var(--text-secondary)' }}>Gold Weight (Grams)</label>
              <input type="number" step="0.1" value={formData.goldWeight} onChange={e => setFormData({...formData, goldWeight: e.target.value})} style={{ width: '100%', padding: '10px' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: 'var(--text-secondary)' }}>Loan Amount (₹)</label>
              <input type="number" value={formData.loanAmount} onChange={e => setFormData({...formData, loanAmount: e.target.value})} style={{ width: '100%', padding: '10px' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: 'var(--text-secondary)' }}>Branch Location</label>
            <input type="text" value={formData.branch} onChange={e => setFormData({...formData, branch: e.target.value})} style={{ width: '100%', padding: '10px' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: 'var(--text-secondary)' }}>Internal Notes</label>
            <textarea rows={4} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} style={{ width: '100%', padding: '10px', resize: 'vertical' }} />
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <Link href="/dashboard/customers" className="btn-secondary" style={{ padding: '10px 24px', textDecoration: 'none' }}>Cancel</Link>
            <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Save Customer
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
