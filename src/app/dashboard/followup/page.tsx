import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth'
import { PhoneForwarded, Mic, AlertCircle, CheckCircle, Phone } from 'lucide-react'
import Link from 'next/link'
import FollowUpActions from '@/components/FollowUpActions'

export const dynamic = 'force-dynamic'

export default async function FollowUpPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  const session = token ? await decrypt(token) : null

  // Access check
  if (!session || !['FOLLOW_UP_STAFF', 'MANAGER'].includes(session.role as string)) {
    const { redirect } = await import('next/navigation')
    redirect('/dashboard')
  }

  // Fetch leads assigned to this Follow-Up Staff member
  const isManager = session?.role === 'MANAGER'
  const whereClause = isManager
    ? { status: 'FOLLOW_UP_ASSIGNED' as const }
    : { status: 'FOLLOW_UP_ASSIGNED' as const, followUpStaffId: String(session?.id) }

  const leads = await prisma.customer.findMany({
    where: whereClause,
    orderBy: { updatedAt: 'asc' }, // Oldest first — first-come, first-served
    include: {
      recordings: {
        select: { id: true, audioUrl: true, label: true, createdAt: true },
        orderBy: { createdAt: 'desc' }
      },
      assignedTo: { select: { name: true } } // The Caller Staff who sent it
    }
  })

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <PhoneForwarded size={28} color="#F59E0B" /> Follow-Up Queue
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '6px 0 0 0' }}>
            Listen to recordings, engage the customer, fill loan details, and send for verification.
          </p>
        </div>
        <span className="badge" style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B', fontSize: '14px', padding: '8px 16px' }}>
          {leads.length} Leads in Queue
        </span>
      </div>

      {/* LEADS LIST */}
      {leads.length === 0 ? (
        <div className="card" style={{ padding: '64px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <CheckCircle size={48} color="#F59E0B" strokeWidth={1.5} style={{ opacity: 0.5 }} />
          <h3 style={{ margin: 0 }}>Your queue is clear!</h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>New leads will appear here when Caller Staff sends them.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {leads.map((lead: any) => (
            <div key={lead.id} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* LEAD HEADER */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>{lead.name}</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    <Phone size={13} color="var(--primary-color)" /> {lead.phone}
                  </div>
                  {lead.assignedTo && (
                    <div style={{ marginTop: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Sent by Caller: <strong>{lead.assignedTo.name}</strong>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <a href={`tel:${lead.phone}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', textDecoration: 'none', fontSize: '12px', fontWeight: 700 }}>
                    <Phone size={13} /> Call
                  </a>
                  <a href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '8px', textDecoration: 'none', fontSize: '12px', fontWeight: 700 }}>
                    WhatsApp
                  </a>
                </div>
              </div>

              {/* CALLER STAFF RECORDINGS */}
              {lead.recordings.length > 0 && (
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <Mic size={13} /> Call Recordings from Caller Staff
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {lead.recordings.map((rec: any) => (
                      <div key={rec.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <audio controls src={rec.audioUrl} style={{ flex: 1, height: '36px', minWidth: 0 }} />
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          {new Date(rec.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {lead.recordings.length === 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '8px', color: '#F59E0B', fontSize: '13px' }}>
                  <AlertCircle size={14} /> No recordings attached. Engage the customer directly.
                </div>
              )}

              {/* ACTIONS: FILL FORM + REJECT */}
              <FollowUpActions customerId={lead.id} customerName={lead.name} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
