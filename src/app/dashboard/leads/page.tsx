import { prisma } from '@/lib/prisma'
import { Check, X, Phone, MapPin } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import LeadActions from '@/components/LeadActions'
export const dynamic = 'force-dynamic'

export default async function LeadsPage() {
  // Fetch all leads that came from Meta Webhook (Waiting Status)
  const leads = await prisma.customer.findMany({
    where: { status: 'WAITING' },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', margin: 0 }}>Incoming Meta Leads</h1>
        <div className="badge badge-waiting">
          {leads.length} Pending
        </div>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Customer Name</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Contact Info</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Loan Details</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Received</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No new leads from Meta Ads currently.
                </td>
              </tr>
            ) : (
              leads.map((lead: any) => (
                <tr key={lead.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px', fontWeight: 500 }}>{lead.name}</td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <Phone size={14} color="var(--text-secondary)" /> {lead.phone}
                    </div>
                    {lead.branch && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        <MapPin size={14} /> {lead.branch}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '16px' }}>
                    {lead.goldWeight ? (
                      <span style={{ color: 'var(--primary-color)', fontWeight: 600 }}>{lead.goldWeight}g</span>
                    ) : (
                      <span style={{ color: 'var(--text-secondary)' }}>N/A</span>
                    )}
                    {lead.loanAmount && ` / ₹${lead.loanAmount}`}
                  </td>
                  <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                    {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                      <LeadActions leadId={lead.id} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
