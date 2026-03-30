export default function CustomersLoading() {
  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ height: '40px', width: '250px' }} className="shimmer"></div>
        <div style={{ height: '40px', width: '150px' }} className="shimmer"></div>
      </div>
      
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', padding: '16px', borderBottom: '1px solid var(--border-color)', gap: '20px' }}>
          {[1, 2, 3, 4, 5, 6, 7].map(i => (
            <div key={i} style={{ height: '20px', flex: 1 }} className="shimmer"></div>
          ))}
        </div>
        <div style={{ padding: '0 16px' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
            <div key={i} style={{ display: 'flex', padding: '24px 0', borderBottom: '1px solid var(--border-color)', gap: '20px' }}>
              <div style={{ height: '40px', width: '40px', borderRadius: '50%' }} className="shimmer"></div>
              <div style={{ flex: 2, height: '40px' }} className="shimmer"></div>
              <div style={{ flex: 1, height: '40px' }} className="shimmer"></div>
              <div style={{ flex: 1, height: '40px' }} className="shimmer"></div>
              <div style={{ flex: 1, height: '40px' }} className="shimmer"></div>
              <div style={{ flex: 1, height: '40px', borderRadius: '20px' }} className="shimmer"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
