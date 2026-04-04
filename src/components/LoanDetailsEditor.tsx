'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save, Check, Hash } from 'lucide-react'

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
  const [amount, setAmount] = useState(initialAmount?.toString() || '')
  const [weight, setWeight] = useState(initialWeight?.toString() || '')
  
  // Field-specific status tracking
  const [amountStatus, setAmountStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [weightStatus, setWeightStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const saveField = async (field: 'loanAmount' | 'goldWeight', value: string) => {
    const setStatus = field === 'loanAmount' ? setAmountStatus : setWeightStatus
    setStatus('saving')
    
    try {
      const res = await fetch(`/api/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          [field]: value ? parseFloat(value) : null
        }),
      })

      if (!res.ok) throw new Error('Update failed')
      
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 2000)
      router.refresh()
    } catch {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  return (
    <div className="card" style={{ padding: '24px' }}>
      <h2 style={{ fontSize: '18px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800 }}>
        <Hash size={18} color="var(--primary-color)" /> 2. Gold & Loan Details
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '20px' }}>
        <div style={{ position: 'relative' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Loan Amount (₹)
          </label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input 
              type="number" 
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onBlur={() => amount !== initialAmount?.toString() && saveField('loanAmount', amount)}
              disabled={disabled || amountStatus === 'saving'}
              style={{ 
                width: '100%', padding: '14px', background: 'var(--bg-color)', 
                border: amountStatus === 'error' ? '1px solid #EF4444' : '1px solid var(--border-color)', 
                borderRadius: '12px', color: 'var(--text-color)', fontSize: '16px', fontWeight: 700 
              }}
            />
            <div style={{ position: 'absolute', right: '12px' }}>
              {amountStatus === 'saving' && <Loader2 size={16} className="animate-spin" color="var(--primary-color)" />}
              {amountStatus === 'saved' && <Check size={16} color="#10B981" />}
            </div>
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Gold Weight (G)
          </label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input 
              type="number" 
              step="0.01"
              placeholder="0.00"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              onBlur={() => weight !== initialWeight?.toString() && saveField('goldWeight', weight)}
              disabled={disabled || weightStatus === 'saving'}
              style={{ 
                width: '100%', padding: '14px', background: 'var(--bg-color)', 
                border: weightStatus === 'error' ? '1px solid #EF4444' : '1px solid var(--border-color)', 
                borderRadius: '12px', color: 'var(--text-color)', fontSize: '16px', fontWeight: 700 
              }}
            />
            <div style={{ position: 'absolute', right: '12px' }}>
              {weightStatus === 'saving' && <Loader2 size={16} className="animate-spin" color="var(--primary-color)" />}
              {weightStatus === 'saved' && <Check size={16} color="#10B981" />}
            </div>
          </div>
        </div>
      </div>
      
      {!disabled && (
        <p style={{ marginTop: '16px', fontSize: '11px', color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center' }}>
          Changes are saved automatically when you click away.
        </p>
      )}
    </div>
  )
}
