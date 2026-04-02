'use client'

import { useState } from 'react'
import { Shield, ArrowRight, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function Home() {
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

      // Success! Redirect based on role
      localStorage.setItem('isLoggedIn', 'true')
      
      if (data.role === 'SALESMAN') {
        window.location.href = '/dashboard/sales'
      } else {
        window.location.href = '/dashboard'
      }
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card fade-in" style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <div style={{ 
            background: 'var(--primary-color)', 
            padding: '16px', 
            borderRadius: '50%',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <Shield size={40} color="#111" strokeWidth={2.5} />
          </div>
        </div>
        
        <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>
          Sai Gold <span style={{ color: 'var(--primary-color)' }}>Loans</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Secure CRM System for Sales and Staff
        </p>

        {error && (
          <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--status-rejected)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--border-radius-sm)', marginBottom: '16px', fontSize: '14px' }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: 'var(--text-secondary)' }}>Email Address</label>
            <input 
              type="email" 
              placeholder="team@saigoldloans.com" 
              style={{ width: '100%' }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: 'var(--text-secondary)' }}>Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              style={{ width: '100%' }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', marginTop: '8px', opacity: loading ? 0.7 : 1 }}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Secure Login'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

      </div>
    </div>
  )
}
