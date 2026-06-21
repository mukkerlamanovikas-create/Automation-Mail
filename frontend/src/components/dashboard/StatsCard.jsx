export default function StatsCard({ label, value, color = 'blue' }) {
  return (
    <div className={`stats-card stats-card--${color}`}>
      <div className="stats-card-value">{value ?? '—'}</div>
      <div className="stats-card-label">{label}</div>
    </div>
  );
}
