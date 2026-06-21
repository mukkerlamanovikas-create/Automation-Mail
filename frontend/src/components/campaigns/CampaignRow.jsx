import Badge from '../ui/Badge';

const STATUS_VARIANT = {
  active: 'success',
  paused: 'warning',
  completed: 'info',
  draft: 'default',
};

function fmt(dt) {
  return new Date(dt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function CampaignRow({ campaign, onPause, onResume }) {
  const total = campaign.total_recipients || 0;
  const sent = campaign.sent_count || 0;
  const pct = total > 0 ? Math.round((sent / total) * 100) : 0;

  return (
    <tr>
      <td style={{ fontWeight: 600 }}>{campaign.name}</td>
      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{campaign.gmail_email || '—'}</td>
      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{campaign.template_name || '—'}</td>
      <td><Badge variant={STATUS_VARIANT[campaign.status] || 'default'}>{campaign.status}</Badge></td>
      <td style={{ minWidth: 120 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="mini-bar" style={{ flex: 1 }}>
            <div className="mini-bar-fill" style={{ width: `${pct}%` }} />
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{sent}/{total}</span>
        </div>
      </td>
      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fmt(campaign.created_at)}</td>
      <td>
        {campaign.status === 'active' && (
          <button className="btn btn-secondary" style={{ fontSize: 11, padding: '3px 10px' }} onClick={() => onPause(campaign)}>Pause</button>
        )}
        {campaign.status === 'paused' && (
          <button className="btn btn-primary" style={{ fontSize: 11, padding: '3px 10px' }} onClick={() => onResume(campaign)}>Resume</button>
        )}
      </td>
    </tr>
  );
}
