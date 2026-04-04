import React from 'react'

export function StatusBadge({ status }: { status: string }) {
  const getBadgeStyle = (s: string) => {
    switch (s) {
      case 'ACCEPTED':
        return { bg: 'rgba(16, 185, 129, 0.1)', color: '#10B981', text: 'Accepted' }
      case 'WAITING':
        return { bg: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', text: 'Not Attended' }
      case 'FOLLOW_UP':
        return { bg: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', text: 'Follow Up' }
      case 'NO_RESPONSE':
        return { bg: 'rgba(107, 114, 128, 0.1)', color: '#9CA3AF', text: 'No Response' }
      case 'REJECTED':
        return { bg: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', text: 'Rejected' }
      case 'VERIFIED':
        return { bg: 'rgba(16, 185, 129, 0.2)', color: '#059669', text: 'Verified ✅' }
      case 'PROCESSING':
        return { bg: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6', text: 'Processing' }
      case 'DUE':
        return { bg: 'rgba(244, 63, 94, 0.1)', color: '#F43F5E', text: 'Due' }
      case 'CLOSED':
        return { bg: 'rgba(55, 65, 81, 0.1)', color: '#D1D5DB', text: 'Closed' }
      default:
        return { bg: 'rgba(107, 114, 128, 0.1)', color: '#9CA3AF', text: s.replace('_', ' ') }
    }
  }

  const style = getBadgeStyle(status)

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: style.bg,
      color: style.color,
      padding: '4px 10px',
      borderRadius: '8px',
      fontSize: '11px',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    }}>
      {style.text}
    </span>
  )
}
