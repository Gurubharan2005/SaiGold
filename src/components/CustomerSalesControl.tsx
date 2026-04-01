'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Calendar, Save, MessageCircle, PhoneCall } from 'lucide-react'
import { format } from 'date-fns'

export default function CustomerSalesControl({ 
  customerId, 
  priority, 
  callStatus, 
  branch,
  followUpDate,
  followUpNotes,
  phone,
  hideLeadAttributes = false,
  hideFollowUp = false
}: { 
  customerId: string, 
  priority: string, 
  callStatus: string,
  branch?: string | null,
  followUpDate?: string | null, // Accept ISO strings for Date compatibility
  followUpNotes?: string | null,
  phone: string,
  hideLeadAttributes?: boolean,
  hideFollowUp?: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  // Local States for Inputs (Debounced/Explicit Save)
  const [fDate, setFDate] = useState(followUpDate ? new Date(followUpDate).toISOString().slice(0, 16) : '')
  const [fNotes, setFNotes] = useState(followUpNotes || '')
  const [appendTxt, setAppendTxt] = useState('')

  const handleUpdate = async (field: string, value: any) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      })
      if (!res.ok) throw new Error('Update failed')
      router.refresh()
    } catch (e: any) {
      alert("Failed to sync sales property.")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveFollowUp = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
           followUpDate: fDate ? new Date(fDate).toISOString() : null,
           followUpNotes: fNotes
        }),
      })
      if (!res.ok) throw new Error('Update failed')
      router.refresh()
    } catch (e: any) {
      alert("Follow-Up sync failed.")
    } finally {
      setLoading(false)
    }
  }

  const handleAppendNote = async () => {
    if (!appendTxt.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appendNote: appendTxt }),
      })
      if (!res.ok) throw new Error('Note append failed')
      setAppendTxt('')
      router.refresh()
    } catch (e: any) {
      alert("Failed to append note.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Target Segments (Priority / Branch / Call Status) */}
      {!hideLeadAttributes && (
        <div className="card">
           <h3 style={{ fontSize: '16px', margin: 0, borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>Lead Attributes</h3>
           
           <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
             <div>
               <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>Priority Tag</label>
               <select 
                 value={priority} 
                 onChange={(e) => handleUpdate('priority', e.target.value)}
                 disabled={loading}
                 style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'var(--surface-color)', border: '1px solid var(--border-color)', fontWeight: priority === 'HIGH' ? 700 : 500, color: priority === 'HIGH' ? '#EF4444' : priority === 'MEDIUM' ? '#F59E0B' : '#10B981' }}
               >
                 <option value="HIGH">High Priority</option>
                 <option value="MEDIUM">Medium Priority</option>
                 <option value="LOW">Low Priority</option>
               </select>
             </div>
             
             <div>
               <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>Call Status</label>
               <select 
                 value={callStatus} 
                 onChange={(e) => handleUpdate('callStatus', e.target.value)}
                 disabled={loading}
                 style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-color)' }}
               >
                 <option value="NOT_CALLED">📞 Not Called Yet</option>
                 <option value="CALLED">☎️ Called (No info)</option>
                 <option value="NOT_REACHABLE">📵 Not Reachable</option>
                 <option value="BUSY">⏰ Busy / Callback</option>
                 <option value="INTERESTED">🔥 Interested</option>
               </select>
             </div>
  
             <div>
               <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>Handling Branch</label>
               <select 
                 value={branch || ''} 
                 onChange={(e) => handleUpdate('branch', e.target.value)}
                 disabled={loading}
                 style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-color)' }}
               >
                 <option value="" disabled>Select Branch</option>
                 <option value="Karur">Karur Branch</option>
                 <option value="Salem">Salem Branch</option>
                 <option value="Erode">Erode Branch</option>
                 <option value="Headquarters">Headquarters</option>
               </select>
             </div>
  
             {/* Quick Actions Matrix */}
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
                <a href={`tel:${phone}`} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', textDecoration: 'none' }}>
                  <PhoneCall size={16} /> Call
                </a>
                <a href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', textDecoration: 'none', background: '#25D366', color: '#FFF', borderRadius: '8px', fontWeight: 600 }}>
                  <MessageCircle size={16} /> WhatsApp
                </a>
             </div>
  
           </div>
        </div>
      )}

      {/* Follow-Up Action Engine */}
      {!hideFollowUp && (
        <div className="card">
           <h3 style={{ fontSize: '16px', margin: 0, borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="var(--primary-color)"/> Follow-Up Planner
           </h3>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
             <input 
               type="datetime-local" 
               value={fDate} 
               onChange={(e) => setFDate(e.target.value)}
               style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-color)', colorScheme: 'dark' }}
             />
             <input 
               type="text" 
               placeholder="Goal (e.g., Ask for gold photo)..."
               value={fNotes}
               onChange={(e) => setFNotes(e.target.value)}
               style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-color)' }}
             />
             <button onClick={handleSaveFollowUp} disabled={loading} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px' }}>
               {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Reminder
             </button>
           </div>
        </div>
      )}

      {/* Timestamped Note Appendage System */}
      <div className="card">
         <h3 style={{ fontSize: '16px', margin: 0, borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px'}}>Add Internal Note</h3>
         <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
           <textarea 
             placeholder="Discussed rates, customer will visit branch tomorrow..."
             value={appendTxt}
             onChange={(e) => setAppendTxt(e.target.value)}
             style={{ width: '100%', minHeight: '80px', padding: '12px', borderRadius: '6px', background: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-color)', resize: 'vertical', fontFamily: 'inherit' }}
           />
           <button onClick={handleAppendNote} disabled={loading || !appendTxt.trim()} className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px' }}>
             {loading ? <Loader2 size={16} className="animate-spin" /> : 'Log Activity'}
           </button>
         </div>
      </div>

    </div>
  )
}
