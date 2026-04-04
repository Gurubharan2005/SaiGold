'use client'

import { useState } from 'react'
import PipelineCard from './PipelineCard'

interface PipelineMobileSwitcherProps {
  waitingLeads: any[]
  followUpLeads: any[]
  rejectedLeads: any[]
}

export default function PipelineMobileSwitcher({ 
  waitingLeads, 
  followUpLeads, 
  rejectedLeads 
}: PipelineMobileSwitcherProps) {
  const [activeTab, setActiveTab] = useState<'WAITS' | 'FOLLOW' | 'REJECT'>('WAITS')

  const tabStyle = (tab: string) => ({
    flex: 1,
    padding: '12px 8px',
    textAlign: 'center' as const,
    fontSize: '12px',
    fontWeight: 800,
    cursor: 'pointer',
    borderBottom: activeTab === tab ? `2px solid ${tab === 'WAITS' ? 'var(--primary-color)' : tab === 'FOLLOW' ? '#F59E0B' : '#EF4444'}` : '2px solid transparent',
    color: activeTab === tab ? 'var(--text-color)' : 'var(--text-secondary)',
    transition: 'all 0.2s',
    background: activeTab === tab ? 'rgba(255,255,255,0.03)' : 'transparent'
  })

  return (
    <div className="pipeline-container">
      {/* MOBILE TAB CONTROLLER (STICKY) */}
      <div className="mobile-only" style={{ 
        display: 'none', 
        marginBottom: '20px', 
        background: 'rgba(17, 24, 39, 0.8)', 
        backdropFilter: 'blur(12px)',
        borderRadius: '12px', 
        overflow: 'hidden', 
        border: '1px solid var(--border-color)',
        position: 'sticky',
        top: '12px',
        zIndex: 100,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
      }}>
        <div style={{ display: 'flex' }}>
          <div onClick={() => setActiveTab('WAITS')} style={tabStyle('WAITS')}>NEW ({waitingLeads.length})</div>
          <div onClick={() => setActiveTab('FOLLOW')} style={tabStyle('FOLLOW')}>FOLLOW ({followUpLeads.length})</div>
          <div onClick={() => setActiveTab('REJECT')} style={tabStyle('REJECT')}>REJECT ({rejectedLeads.length})</div>
        </div>
      </div>

      <div className="pipeline-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', 
        gap: '16px', 
        alignItems: 'flex-start' 
      }}>
        
        {/* COLUMN 1: NOT ATTENDED */}
        <div className={`pipeline-column ${activeTab !== 'WAITS' ? 'mobile-hidden' : ''}`}>
          <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderBottom: '2px solid var(--primary-color)', borderRadius: '8px 8px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontWeight: 800, fontSize: '13px', letterSpacing: '0.05em' }}>NOT ATTENDED</span>
            <span className="badge badge-waiting">{waitingLeads.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {waitingLeads.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', border: '1px dashed var(--border-color)', borderRadius: '12px', fontSize: '13px' }}>No new leads waiting.</div>
            ) : (
              waitingLeads.map(lead => <PipelineCard key={lead.id} lead={lead} column="WAITS" />)
            )}
          </div>
        </div>

        {/* COLUMN 2: FOLLOW-UP */}
        <div className={`pipeline-column ${activeTab !== 'FOLLOW' ? 'mobile-hidden' : ''}`}>
          <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderBottom: '2px solid #F59E0B', borderRadius: '8px 8px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontWeight: 800, fontSize: '13px', letterSpacing: '0.05em' }}>FOLLOW-UP</span>
            <span className="badge badge-waiting" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>{followUpLeads.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {followUpLeads.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', border: '1px dashed var(--border-color)', borderRadius: '12px', fontSize: '13px' }}>No leads in follow-up.</div>
            ) : (
              followUpLeads.map(lead => <PipelineCard key={lead.id} lead={lead} column="FOLLOW" />)
            )}
          </div>
        </div>

        {/* COLUMN 3: REJECTED */}
        <div className={`pipeline-column ${activeTab !== 'REJECT' ? 'mobile-hidden' : ''}`}>
          <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderBottom: '2px solid #EF4444', borderRadius: '8px 8px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontWeight: 800, fontSize: '13px', letterSpacing: '0.05em' }}>REJECTED</span>
            <span className="badge badge-rejected">{rejectedLeads.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {rejectedLeads.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', border: '1px dashed var(--border-color)', borderRadius: '12px', fontSize: '13px' }}>No rejected leads.</div>
            ) : (
              rejectedLeads.map(lead => <PipelineCard key={lead.id} lead={lead} column="REJECT" />)
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .mobile-only { display: block !important; }
          .mobile-hidden { display: none !important; }
          .pipeline-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
