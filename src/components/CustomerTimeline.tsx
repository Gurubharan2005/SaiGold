'use client'

import { format } from 'date-fns'
import { Clock, UserPlus, Phone, CheckCircle, Target, Activity } from 'lucide-react'

interface CustomerTimelineProps {
  customer: any
}

export default function CustomerTimeline({ customer }: CustomerTimelineProps) {
  // Aggregate existing timestamps securely without needing a new DB table
  const events = []

  if (customer.createdAt) {
    events.push({
      date: new Date(customer.createdAt),
      title: 'Lead Captured',
      description: customer.createdById ? 'Walk-in lead manually created' : 'Lead ingested automatically from Meta Ads',
      icon: <Target size={16} color="#3B82F6" />,
      color: 'rgba(59, 130, 246, 0.1)'
    })
  }

  if (customer.assignedAt) {
    events.push({
      date: new Date(customer.assignedAt),
      title: 'Routed to Operations',
      description: `Assigned to ${customer.assignedTo?.name || 'Staff Member'}`,
      icon: <UserPlus size={16} color="#F59E0B" />,
      color: 'rgba(245, 158, 11, 0.1)'
    })
  }

  if (customer.firstContactAt) {
    events.push({
      date: new Date(customer.firstContactAt),
      title: 'First Contact Established',
      description: 'The customer was initially engaged by staff',
      icon: <Phone size={16} color="#10B981" />,
      color: 'rgba(16, 185, 129, 0.1)'
    })
  }

  if (customer.verifiedAt) {
    events.push({
      date: new Date(customer.verifiedAt),
      title: 'Document Verification',
      description: 'Customer compliance profile and gold details securely verified',
      icon: <CheckCircle size={16} color="#6366F1" />,
      color: 'rgba(99, 102, 241, 0.1)'
    })
  }

  if (customer.followUpDate && customer.status === 'FOLLOW_UP') {
    events.push({
      date: new Date(customer.followUpDate),
      title: 'Scheduled Follow-Up',
      description: customer.followUpNotes || 'Staff has scheduled a follow-up engagement',
      icon: <Clock size={16} color="#EF4444" />,
      color: 'rgba(239, 68, 68, 0.1)'
    })
  }

  // Fallback for general activity if status is something like REJECTED or CLOSED
  if (['REJECTED', 'CLOSED'].includes(customer.status)) {
     events.push({
        date: new Date(customer.updatedAt),
        title: `File ${customer.status === 'REJECTED' ? 'Rejected' : 'Closed'}`,
        description: `This file was marked as terminal on ${format(new Date(customer.updatedAt), 'MMM dd, yyyy')}`,
        icon: <Activity size={16} color="#6B7280" />,
        color: 'rgba(107, 114, 128, 0.1)'
     })
  }

  // Sort strictly chronological
  const sortedEvents = events.sort((a, b) => a.date.getTime() - b.date.getTime())

  if (sortedEvents.length === 0) return null

  return (
    <div className="card" style={{ marginTop: '24px' }}>
      <h2 style={{ fontSize: '18px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Clock size={18} color="var(--primary-color)" /> Audit & Interaction Timeline
      </h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingLeft: '8px' }}>
        {sortedEvents.map((event, idx) => (
          <div key={idx} style={{ display: 'flex', gap: '16px', position: 'relative' }}>
            {/* The vertical connector line */}
            {idx !== sortedEvents.length - 1 && (
              <div style={{ position: 'absolute', left: '15px', top: '32px', bottom: '-20px', width: '2px', background: 'var(--border-color)' }} />
            )}
            
            {/* Icon Circle */}
            <div style={{ 
              width: '32px', 
              height: '32px', 
              background: event.color, 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexShrink: 0,
              zIndex: 2,
              border: `1px solid ${event.color.replace('0.1', '0.3')}`
            }}>
              {event.icon}
            </div>
            
            <div style={{ paddingBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>{event.title}</h4>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {format(event.date, 'MMM dd, h:mm a')}
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                 {event.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
