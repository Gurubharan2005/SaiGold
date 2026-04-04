'use client'

import { format, formatDistanceToNow } from 'date-fns'
import { 
  Clock, 
  UserPlus, 
  Phone, 
  CheckCircle, 
  Target, 
  Activity, 
  RefreshCcw, 
  ShieldCheck, 
  MapPin,
  FileCheck,
  Zap,
  UserCircle
} from 'lucide-react'

interface CustomerTimelineProps {
  customer: any
}

const getActionIcon = (action: string) => {
  switch (action) {
    case 'CALL_RECORDED': return <Phone size={16} color="#3B82F6" />
    case 'DOC_UPLOAD': return <FileCheck size={16} color="#10B981" />
    case 'ASSIGNMENT': return <UserCircle size={16} color="#F59E0B" />
    case 'LEAD_RECEIVED': return <Zap size={16} color="#6366F1" />
    case 'STATUS_CHANGE': return <RefreshCcw size={16} color="#EC4899" />
    case 'VERIFICATION': return <ShieldCheck size={16} color="#10B981" />
    case 'BRANCH_UPDATE': return <MapPin size={16} color="#06B6D4" />
    default: return <Activity size={16} color="var(--text-secondary)" />
  }
}

const getActionLabel = (action: string) => {
  return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

export default function CustomerTimeline({ customer }: CustomerTimelineProps) {
  // Aggregate existing timestamps (Legacy Synth Logic) + Real DB Activities
  const events = []

  // 1. New DB-backed Activities (Primary Source)
  if (customer.activities && customer.activities.length > 0) {
    customer.activities.forEach((act: any) => {
      events.push({
        date: new Date(act.createdAt),
        title: getActionLabel(act.action),
        description: act.details,
        icon: getActionIcon(act.action),
        color: 'rgba(59, 130, 246, 0.05)',
        executor: act.user?.name
      })
    })
  }

  // 2. Legacy Fallbacks (Only if Activities table is empty for this lead)
  if (events.length === 0) {
    if (customer.createdAt) {
      events.push({
        date: new Date(customer.createdAt),
        title: 'Lead Captured',
        description: customer.createdById ? 'Walk-in lead manually created' : 'Lead ingested automatically from Meta Ads',
        icon: <Target size={16} color="#3B82F6" />,
        color: 'rgba(59, 130, 246, 0.1)',
        executor: undefined
      })
    }
  
    if (customer.assignedAt) {
      events.push({
        date: new Date(customer.assignedAt),
        title: 'Routed to Operations',
        description: `Assigned to ${customer.assignedTo?.name || 'Staff Member'}`,
        icon: <UserPlus size={16} color="#F59E0B" />,
        color: 'rgba(245, 158, 11, 0.1)',
        executor: undefined
      })
    }
  }

  // Sort strictly chronological (Newest First)
  const sortedEvents = events.sort((a, b) => b.date.getTime() - a.date.getTime())

  if (sortedEvents.length === 0) return null

  return (
    <div className="card" style={{ marginTop: '24px' }}>
      <h2 style={{ fontSize: '18px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Clock size={18} color="var(--primary-color)" /> Audit & Interaction Timeline
      </h2>
      
      <div style={{ position: 'relative', paddingLeft: '16px' }}>
        {/* Vertical Connector Line */}
        <div style={{ 
          position: 'absolute', left: 0, top: '8px', bottom: '8px', 
          width: '2px', background: 'var(--border-color)', opacity: 0.3 
        }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {sortedEvents.map((event, idx) => (
            <div key={idx} style={{ position: 'relative' }}>
              {/* Timeline Dot & Icon Overlay */}
              <div style={{ 
                position: 'absolute', left: '-27px', top: '2px', 
                width: '24px', height: '24px', borderRadius: '50%', 
                background: 'var(--bg-color)', border: '2px solid var(--border-color)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1
              }}>
                {event.icon}
              </div>

              <div style={{ paddingLeft: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-color)' }}>
                    {event.title}
                  </h4>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {formatDistanceToNow(event.date, { addSuffix: true })}
                  </span>
                </div>
                
                <div style={{ marginTop: '4px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                   {event.description}
                </div>
                
                {event.executor && (
                  <div style={{ marginTop: '6px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary-color)', opacity: 0.8 }}>
                    <UserCircle size={12} />
                    Executed by {event.executor}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
