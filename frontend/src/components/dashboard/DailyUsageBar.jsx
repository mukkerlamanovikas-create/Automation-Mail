const LIMIT = 350;

export default function DailyUsageBar({ account }) {
  const sent = account.today_sent ?? 0;
  const pct = Math.min((sent / LIMIT) * 100, 100).toFixed(1);
  return (
    <div className="account-card" style={{ marginBottom: 0 }}>
      <div className="account-card-label">{account.label}</div>
      <div className="account-card-email">{account.email}</div>
      <div className="usage-bar-wrap">
        <div className="usage-bar-track">
          <div className="usage-bar-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="usage-bar-text">{sent} / {LIMIT} sent today — {account.remaining ?? LIMIT - sent} remaining</div>
      </div>
    </div>
  );
}
