'use client'

import { Phone, MapPin } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Lead {
  id: string
  name: string
  phone: string
  branch?: string | null
  status: string
  createdAt: string | Date
}

export default function ReadOnlyLeadsTable({ leads }: { leads: Lead[] }) {
  return (
    <div className="card" style={{ padding: '0' }}>
      <div className="table-container" style={{ margin: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
        <thead>
          <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-color)' }}>
            <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Customer Name</th>
            <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Contact Info</th>
            <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Status</th>
            <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Received</th>
          </tr>
        </thead>
        <tbody>
          {leads.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No active Meta Leads in the queue right now.
              </td>
            </tr>
          ) : (
            leads.map((lead) => (
              <tr key={lead.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}>
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
                  <span className={`badge badge-${lead.status.toLowerCase()}`}>{lead.status}</span>
                </td>
                <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                  {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
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
