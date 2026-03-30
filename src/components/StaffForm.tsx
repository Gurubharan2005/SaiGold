'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2 } from 'lucide-react'

export default function StaffForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'STAFF' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create account')
      }

      setFormData({ name: '', email: '', password: '', role: 'STAFF' })
      router.refresh()
      if (onSuccess) onSuccess()
    } catch (error: any) {
      console.error(error)
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Name</label>
        <input 
          type="text" 
          required 
          placeholder="e.g. John Smith"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
          style={{ width: '100%', padding: '10px' }} 
        />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Login Email</label>
        <input 
          type="email" 
          required 
          placeholder="john@saigold.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
          style={{ width: '100%', padding: '10px' }} 
        />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Assign Access Role</label>
        <select 
          required
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          style={{ width: '100%', padding: '10px' }}
        >
          <option value="STAFF">Field Staff (Lead Generation)</option>
          <option value="SALESMAN">Salesperson (Lead Follow-up)</option>
        </select>
      </div>
      <div>
        <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Temporary Password</label>
        <input 
          type="text" 
          required 
          placeholder="e.g. branchpwd123"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
          style={{ width: '100%', padding: '10px' }} 
        />
      </div>

       <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: '8px', padding: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
         {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Create Account
       </button>
    </form>
  )
}
