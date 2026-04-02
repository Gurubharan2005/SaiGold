'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save, Check } from 'lucide-react'

export default function LoanDetailsEditor({ 
  customerId, 
  initialAmount, 
  initialWeight,
  disabled = false
}: { 
  customerId: string, 
  initialAmount?: number | null, 
  initialWeight?: number | null,
  disabled?: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  
  const [amount, setAmount] = useState(initialAmount?.toString() || '')
  const [weight, setWeight] = useState(initialWeight?.toString() || '')

  const handleSave = async () => {
    setLoading(true)
    setSuccess(false)
    try {
      const res = await fetch(`/api/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          loanAmount: amount ? parseFloat(amount) : null,
          goldWeight: weight ? parseFloat(weight) : null
        }),
      })

      if (!res.ok) throw new Error('Update failed')
      
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      router.refresh()
    } catch {
      alert('Failed to save loan details.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
      <div>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Loan Amount (₹)</label>
        <input 
          type="number" 
          placeholder="e.g. 50000"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={loading || disabled}
          style={{ width: '100%', padding: '12px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-color)', fontSize: '16px', fontWeight: 600 }}
        />
      </div>
      <div>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Gold Weight (Grams)</label>
        <input 
          type="number" 
          step="0.01"
          placeholder="e.g. 10.5"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          disabled={loading || disabled}
          style={{ width: '100%', padding: '12px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-color)', fontSize: '16px', fontWeight: 600 }}
        />
      </div>
      
      <div style={{ gridColumn: 'span 2', marginTop: '8px' }}>
        <button 
          onClick={handleSave} 
          disabled={loading || disabled}
          className="btn-primary"
          style={{ width: '100%', gap: '8px', height: '48px', fontSize: '15px' }}
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : success ? <Check size={18} color="#10B981" /> : <Save size={18} />}
          {loading ? 'Saving Changes...' : success ? 'Successfully Saved' : 'Update Loan Parameters'}
        </button>
      </div>
    </div>
  )
}
