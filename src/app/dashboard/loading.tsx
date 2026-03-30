export default function DashboardLoading() {
  return (
    <div className="fade-in">
      <div style={{ height: '36px', width: '200px', marginBottom: '24px' }} className="shimmer"></div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', height: '110px' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '12px' }} className="shimmer"></div>
            <div style={{ flex: 1 }}>
              <div style={{ height: '14px', width: '60%', marginBottom: '8px' }} className="shimmer"></div>
              <div style={{ height: '28px', width: '40%' }} className="shimmer"></div>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', height: '60px' }} className="shimmer"></div>
        <div style={{ padding: '24px' }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ height: '60px', width: '100%', marginBottom: '12px' }} className="shimmer"></div>
          ))}
        </div>
      </div>
    </div>
  )
}
