'use client'

import React from 'react'
import { Phone, MessageSquare, User, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { StatusBadge } from './StatusBadge'
import RecordingsBadge from './RecordingsBadge'

interface Customer {
  id: string
  name: string
  phone: string
  status: string
  photoUrl?: string | null
  loanAmount?: number | null
  goldWeight?: number | null
  updatedAt?: string | Date | null
  followUpDate?: string | Date | null
}

interface LeadCardProps {
  customer: Customer;
  children?: React.ReactNode;
  showRecordingBadge?: boolean
}

export function LeadCard({ customer, children, showRecordingBadge = true }: LeadCardProps) {
  return (
    <div className="card fade-in" style={{ 
      padding: '20px', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '16px', 
      border: '1px solid var(--border-color)',
      borderRadius: '16px',
      background: 'var(--surface-color)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flex: 1, minWidth: 0 }}>
          <div style={{ 
            width: '56px', height: '56px', borderRadius: '16px', 
            background: 'var(--surface-hover)', 
            border: '1px solid var(--border-color)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', flexShrink: 0 
          }}>
            {customer.photoUrl ? (
              <img src={`/api/avatar?url=${encodeURIComponent(customer.photoUrl)}`} alt={customer.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <User size={24} color="var(--text-secondary)" />
            )}
          </div>
          <div className="min-w-0" style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <h3 className="truncate" style={{ margin: 0, fontSize: '17px', fontWeight: 600 }}>{customer.name}</h3>
              {/* 🎙️ Recordings badge */}
              {showRecordingBadge && <div style={{ flexShrink: 0 }}><RecordingsBadge customerId={customer.id} customerName={customer.name} /></div>}
            </div>
            <span className="truncate" style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Phone size={10} /> {customer.phone}
            </span>
          </div>
        </div>
        <div style={{ flexShrink: 0 }}>
          <StatusBadge status={customer.status} />
        </div>
      </div>

      {/* Details */}
      <div className="grid-2-responsive" style={{ 
        padding: '12px', background: 'rgba(0,0,0,0.02)', borderRadius: '12px' 
      }}>
        {customer.loanAmount && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Loan Amount</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--primary-color)' }}>₹{customer.loanAmount.toLocaleString()}</span>
          </div>
        )}
        {customer.goldWeight && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gold Weight</span>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>{customer.goldWeight}g</span>
          </div>
        )}
        {customer.updatedAt && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Last updated</span>
            <span style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
               <Calendar size={12} /> {format(new Date(customer.updatedAt), 'MMM dd, h:mm a')}
            </span>
          </div>
        )}
        {customer.followUpDate && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Follow Up</span>
            <span style={{ fontSize: '13px', color: '#F59E0B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
               <Calendar size={12} /> {format(new Date(customer.followUpDate), 'MMM dd')}
            </span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
        <a href={`https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" 
           style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', borderRadius: '12px', textDecoration: 'none', fontWeight: 600 }}>
          <MessageSquare size={18} /> WhatsApp
        </a>
        <a href={`tel:${customer.phone}`}
           style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '12px', background: 'var(--surface-hover)', border: '1px solid var(--border-color)', color: 'var(--text-color)', borderRadius: '12px', textDecoration: 'none', fontWeight: 600 }}>
          <Phone size={18} color="var(--primary-color)" /> Call
        </a>
      </div>

      {/* Children */}
      {children && (
        <div style={{ display: 'flex', gap: '12px', flexDirection: 'column', marginTop: '4px' }}>
          {children}
        </div>
      )}
    </div>
  )
}
