'use client'

import { formatDistanceToNow } from 'date-fns'
import { 
  History, 
  PhoneCall, 
  FileCheck, 
  UserCircle, 
  Zap, 
  RefreshCcw, 
  ShieldCheck, 
  MapPin 
} from 'lucide-react'

interface Activity {
  id: string
  action: string
  details: string | null
  createdAt: string | Date
  user?: {
    name: string
  } | null
}

const getActionIcon = (action: string) => {
  switch (action) {
    case 'CALL_RECORDED': return <PhoneCall size={16} color="#3B82F6" />
    case 'DOC_UPLOAD': return <FileCheck size={16} color="#10B981" />
    case 'ASSIGNMENT': return <UserCircle size={16} color="#F59E0B" />
    case 'LEAD_RECEIVED': return <Zap size={16} color="#6366F1" />
    case 'STATUS_CHANGE': return <RefreshCcw size={16} color="#EC4899" />
    case 'VERIFICATION': return <ShieldCheck size={16} color="#10B981" />
    case 'BRANCH_UPDATE': return <MapPin size={16} color="#06B6D4" />
    default: return <History size={16} color="var(--text-secondary)" />
  }
}

const getActionLabel = (action: string) => {
  return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

export default function CustomerActivityTimeline({ activities }: { activities: Activity[] }) {
  if (!activities || activities.length === 0) {
    return (
      <div style={{ 
        padding: '32px', textAlign: 'center', color: 'var(--text-secondary)',
        background: 'var(--surface-color)', border: '1px dashed var(--border-color)', borderRadius: '12px'
      }}>
        <p style={{ margin: 0, fontSize: '14px' }}>No recorded activity yet for this lead.</p>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', paddingLeft: '16px' }}>
      {/* Vertical Line */}
      <div style={{ 
        position: 'absolute', left: 0, top: '8px', bottom: '8px', 
        width: '2px', background: 'var(--border-color)', opacity: 0.3 
      }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {activities.map((activity) => (
          <div key={activity.id} style={{ position: 'relative' }}>
            {/* Timeline Dot & Icon Overlay */}
            <div style={{ 
              position: 'absolute', left: '-27px', top: '2px', 
              width: '24px', height: '24px', borderRadius: '50%', 
              background: 'var(--bg-color)', border: '2px solid var(--border-color)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1
            }}>
              {getActionIcon(activity.action)}
            </div>

            <div style={{ paddingLeft: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-color)' }}>
                  {getActionLabel(activity.action)}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                  {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                </span>
              </div>
              
              <div style={{ marginTop: '4px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                 {activity.details}
              </div>
              
              {activity.user && (
                <div style={{ marginTop: '6px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary-color)', opacity: 0.8 }}>
                  <UserCircle size={12} />
                   Executed by {activity.user.name}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
