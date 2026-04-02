import { ShieldCheck } from 'lucide-react'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function SalesVerificationDesk() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const session = token ? await decrypt(token) : null

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShieldCheck size={32} color="var(--primary-color)" />
          Dedicated Sales Workbench
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
          Focused verification and approval desk for senior sales personnel.
        </p>
      </div>
    </div>
  )
}
