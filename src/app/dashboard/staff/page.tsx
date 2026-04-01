import { prisma } from '@/lib/prisma'
import { Briefcase, MapPin, Shield, Activity, User } from 'lucide-react'
import { format } from 'date-fns'
import AddStaffModal from '@/components/AddStaffModal'
import RemoveStaffButton from '@/components/RemoveStaffButton'

export const dynamic = 'force-dynamic'

export default async function StaffManagementPage() {
  const staffMembers = await prisma.user.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          assignedCustomers: true,
          createdCustomers: true,
        }
      }
    }
  })

  return (
    <div className="fade-in max-w-6xl">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', margin: 0 }}>Staff & Role Management</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Monitor team workload and manage branch roles.</p>
        </div>
        <AddStaffModal />
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '18px', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={20} color="var(--primary-color)" /> Active Team Directory
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>{staffMembers.length} Members Enrolled</span>
        </div>

        {/* Desktop Table View */}
        <div className="mobile-hide">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '13px' }}>EMPLOYEE</th>
                <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '13px' }}>WORKLOAD</th>
                <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '13px' }}>LOCATION</th>
                <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {staffMembers.map((user: any) => (
                <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
                        <User size={18} color="var(--text-secondary)" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-color)' }}>{user.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Shield size={10} /> {user.role}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div className={`work-badge ${user._count.assignedCustomers > 0 ? 'work-badge-active' : 'work-badge-idle'}`}>
                      {user._count.assignedCustomers > 0 && <div className="pulse-indicator" style={{ marginRight: '8px' }} />}
                      {user._count.assignedCustomers === 0 ? 'Idle' : `${user._count.assignedCustomers} Active Leads`}
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    {user.lat && user.lng ? (
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${user.lat},${user.lng}`} 
                        target="_blank" rel="noreferrer"
                        className="btn-text" style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <MapPin size={14} /> Live
                      </a>
                    ) : (
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)', opacity: 0.6 }}>Offline</span>
                    )}
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    {user.role === 'STAFF' ? (
                       <RemoveStaffButton staffId={user.id} staffName={user.name} />
                    ) : (
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '2px 8px', display: 'inline-block' }}>Protected</div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="desktop-hide staff-grid">
          {staffMembers.map((user: any) => (
            <div key={user.id} className="staff-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px' }}>{user.name}</h3>
                    <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>{user.role}</p>
                  </div>
                </div>
                {user.role === 'STAFF' && <RemoveStaffButton staffId={user.id} staffName={user.name} />}
              </div>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                <div className={`work-badge ${user._count.assignedCustomers > 0 ? 'work-badge-active' : 'work-badge-idle'}`} style={{ flex: 1, justifyContent: 'center' }}>
                  {user._count.assignedCustomers === 0 ? 'Idle' : `${user._count.assignedCustomers} Active`}
                </div>
              </div>

              {user.lat && user.lng && (
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${user.lat},${user.lng}`} 
                  target="_blank" rel="noreferrer"
                  style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--primary-color)', borderRadius: '8px', fontSize: '14px', fontWeight: 600 }}
                >
                  <MapPin size={16} /> Locate on Map
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
