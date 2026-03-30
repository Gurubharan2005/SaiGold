'use client'

import { useState } from 'react'
import { TrendingUp, ArrowRight, Loader2, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SalesLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to login')
      }

      // Strict Validation: This login page ONLY allows Sales Managers
      if (data.role !== 'SALESMAN') {
         // Clear session (though it was set by the API)
         // For a better UX, we'd have a logout or just block them
         throw new Error('This login is reserved for Sales Managers only.')
      }

      // Success!
      router.push('/dashboard/sales')
      router.refresh()
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'radial-gradient(circle at top right, rgba(16, 185, 129, 0.05), transparent), radial-gradient(circle at bottom left, rgba(59, 130, 246, 0.05), transparent)'
    }}>
      <div className="card fade-in" style={{ 
        maxWidth: '420px', 
        width: '100%', 
        textAlign: 'center',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <div style={{ 
            background: 'rgba(16, 185, 129, 0.1)', 
            padding: '20px', 
            borderRadius: '24px',
            border: '1px solid rgba(16, 185, 129, 0.2)'
          }}>
            <TrendingUp size={44} color="#10B981" strokeWidth={2} />
          </div>
        </div>
        
        <h1 style={{ fontSize: '26px', marginBottom: '8px', fontWeight: 700 }}>
          Sales <span style={{ color: '#10B981' }}>Executive</span> Portal
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '15px' }}>
          Sai Gold Growth & Conversion Management
        </p>

        {error && (
          <div style={{ 
            padding: '14px', 
            background: 'rgba(239, 68, 68, 0.08)', 
            color: '#EF4444', 
            border: '1px solid rgba(239,68,68,0.15)', 
            borderRadius: '12px', 
            marginBottom: '20px', 
            fontSize: '14px',
            fontWeight: 500
          }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sales ID / Email</label>
            <input 
              type="email" 
              placeholder="sales@saigold.com" 
              style={{ width: '100%', height: '48px', borderRadius: '12px', fontSize: '15px' }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Personal Access Key</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              style={{ width: '100%', height: '48px', borderRadius: '12px', fontSize: '15px' }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading} 
            className="btn-primary" 
            style={{ 
              width: '100%', 
              marginTop: '12px', 
              height: '52px', 
              fontSize: '16px', 
              fontWeight: 700,
              background: 'linear-gradient(135deg, #10B981, #059669)',
              border: 'none',
              boxShadow: '0 8px 20px rgba(16, 185, 129, 0.2)'
            }}
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : 'Enter Sales Portal'}
            {!loading && <ArrowRight size={20} />}
          </button>
        </form>

        <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border-color)' }}>
          <button 
            onClick={() => router.push('/')}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--text-secondary)', 
              fontSize: '14px', 
              fontWeight: 500, 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              margin: '0 auto'
            }}
          >
            <ArrowLeft size={16} /> Back to Main Terminal
          </button>
        </div>
      </div>
    </div>
  )
}
