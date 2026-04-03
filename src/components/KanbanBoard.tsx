'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { LeadCard } from './LeadCard'
import { StaffLeadActions } from './StaffLeadActions'
import QuickRecordingUpload from './QuickRecordingUpload'
import { CheckCircle, Clock, XCircle, User, ExternalLink } from 'lucide-react'

interface Lead {
  id: string
  name: string
  phone: string
  status: string
  photoUrl?: string | null
  loanAmount?: number | null
  goldWeight?: number | null
  updatedAt?: string | Date | null
  followUpDate?: string | Date | null
  assignedTo?: { name: string } | null
}

interface Column {
  key: string
  label: string
  color: string
  bg: string
  leads: Lead[]
}

interface Props {
  columns: Column[]
  isManager: boolean
}

const ICONS: Record<string, React.ElementType> = {
  ACCEPTED: CheckCircle,
  FOLLOW_UP: Clock,
  REJECTED: XCircle,
}

export default function KanbanBoard({ columns, isManager }: Props) {
  const [activeTab, setActiveTab] = useState(0)

  const renderCard = (lead: Lead) => (
    <LeadCard key={lead.id} customer={lead}>
      <div style={{ marginTop: '4px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {isManager ? (
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <User size={12} /> {lead.assignedTo?.name || 'Unassigned'}
          </div>
        ) : (
          <StaffLeadActions leadId={lead.id} />
        )}
        <QuickRecordingUpload customerId={lead.id} customerName={lead.name} />
        {['ACCEPTED', 'PROCESSING', 'VERIFIED', 'CLOSED'].includes(lead.status) && (
          <Link 
            href={`/dashboard/customers/${lead.id}`}
            style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              padding: '10px', background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6',
              borderRadius: '8px', fontSize: '12px', fontWeight: 700, textDecoration: 'none'
            }}
          >
            <ExternalLink size={14} /> Full Customer Profile
          </Link>
        )}
      </div>
    </LeadCard>
  )

  return (
    <>
      {/* ── MOBILE: Tab switcher ─────────────────────────────── */}
      <div className="mobile-kanban">
        {/* Tab bar */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '16px',
          background: 'var(--surface-hover)',
          padding: '6px',
          borderRadius: '12px',
          border: '1px solid var(--border-color)'
        }}>
          {columns.map((col, i) => {
            const Icon = ICONS[col.key] || CheckCircle
            const active = activeTab === i
            return (
              <button
                key={col.key}
                onClick={() => setActiveTab(i)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  padding: '8px 4px',
                  background: active ? col.bg : 'transparent',
                  border: active ? `1px solid ${col.color}40` : '1px solid transparent',
                  borderRadius: '8px',
                  color: active ? col.color : 'var(--text-secondary)',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <Icon size={12} style={{ flexShrink: 0 }} />
                <span className="truncate" style={{ flex: 1, textAlign: 'left' }}>{col.label}</span>
                <span style={{
                  background: active ? col.color : 'var(--border-color)',
                  color: active ? '#111' : 'var(--text-secondary)',
                  borderRadius: '999px',
                  padding: '0px 5px',
                  fontSize: '10px',
                  fontWeight: 800
                }}>{col.leads.length}</span>
              </button>
            )
          })}
        </div>

        {/* Active column cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {columns[activeTab].leads.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--surface-color)', borderRadius: '12px', border: '1px dashed var(--border-color)', fontSize: '14px' }}>
              No {columns[activeTab].label.toLowerCase()} leads
            </div>
          ) : (
            columns[activeTab].leads.map(renderCard)
          )}
        </div>
      </div>

      {/* ── DESKTOP: 3-column grid ───────────────────────────── */}
      <div className="desktop-kanban">
        {columns.map(col => {
          const Icon = ICONS[col.key] || CheckCircle
          return (
            <div key={col.key}>
              {/* Column header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                marginBottom: '12px', padding: '10px 14px',
                background: col.bg, border: `1px solid ${col.color}30`, borderRadius: '10px'
              }}>
                <Icon size={16} color={col.color} />
                <span style={{ fontWeight: 700, fontSize: '14px', color: col.color }}>{col.label}</span>
                <span style={{ marginLeft: 'auto', background: col.color, color: '#fff', borderRadius: '999px', padding: '1px 8px', fontSize: '11px', fontWeight: 700 }}>
                  {col.leads.length}
                </span>
              </div>
              {/* Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {col.leads.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--surface-color)', borderRadius: '12px', border: '1px dashed var(--border-color)', fontSize: '13px' }}>
                    No {col.label.toLowerCase()} leads
                  </div>
                ) : (
                  col.leads.map(renderCard)
                )}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
