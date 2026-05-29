export default function StatCard({ icon, label, value, color = 'var(--primary)', iconBg }) {
  return (
    <div className="stat-card">
      <div
        className="stat-icon"
        style={{ background: iconBg || 'var(--primary-dim)' }}
      >
        {icon}
      </div>
      <div className="stat-value" style={{ backgroundImage: `linear-gradient(135deg,${color},${color}aa)` }}>
        {value ?? '—'}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  )
}
