import { prisma } from '@/lib/prisma'
import { ShieldAlert, Hash, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import StaffForm from '@/components/StaffForm'

export const dynamic = 'force-dynamic'

export default async function StaffManagementPage() {
  const staffMembers = await prisma.user.findMany({
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
    <div className="fade-in max-w-5xl">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', margin: 0 }}>Staff & Role Management</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        
        {/* Active Staff Datatable */}
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
                <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Joined Date</th>
              </tr>
            </thead>
            <tbody>
              {staffMembers.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
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
                    <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                       <span>{user._count.assignedCustomers} Processing</span>
                       <span>{user._count.createdCustomers} Enrolled</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} /> {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Create Staff Sidebar Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="card">
            <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '16px' }}>
               <ShieldAlert size={20} color="var(--status-rejected)" /> Create Restricted Staff
            </h3>
            
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Staff members can view and process normal customer profiles and loans, but they are completely blocked from accessing this administration screen or changing company settings.
            </p>

            <StaffForm />
            
          </div>
        </div>

      </div>
    </div>
  )
}
