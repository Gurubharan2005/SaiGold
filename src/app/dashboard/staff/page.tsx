import { prisma } from '@/lib/prisma'
import { Calendar, MapPin } from 'lucide-react'
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', margin: 0 }}>Staff & Role Management</h1>
        <AddStaffModal />
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--surface-color)' }}>
          <h2 style={{ fontSize: '18px', margin: 0 }}>Active Team Directory</h2>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Employee</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>System Role</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Activity Stats</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Real-Time Location</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>Controls</th>
            </tr>
          </thead>
          <tbody>
            {staffMembers.map((user: any) => (
              <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}>
                <td style={{ padding: '16px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-color)', marginBottom: '4px' }}>{user.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{user.email}</div>
                </td>
                <td style={{ padding: '16px' }}>
                  <span className={`badge ${user.role === 'MANAGER' ? 'badge-accepted' : 'badge-processing'}`}>
                    {user.role}
                  </span>
                </td>
                <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  <div style={{ display: 'flex', gap: '4px', flexDirection: 'column' }}>
                     <span>{user._count.assignedCustomers} Processing</span>
                     <span>{user._count.createdCustomers} Enrolled</span>
                  </div>
                </td>
                <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  {user.lat && user.lng ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${user.lat},${user.lng}`} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary-color)', fontWeight: 600, textDecoration: 'none' }}
                      >
                        <MapPin size={14} /> View Location
                      </a>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        Updated: {user.locationUpdatedAt ? format(new Date(user.locationUpdatedAt), 'p') : 'Unknown'}
                      </span>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Offline / Idle</span>
                  )}
                </td>
                <td style={{ padding: '16px', textAlign: 'right' }}>
                  {user.role === 'STAFF' ? (
                     <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                       <RemoveStaffButton staffId={user.id} staffName={user.name} />
                     </div>
                  ) : (
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Protected</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
