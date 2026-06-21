import { useState, useEffect, useCallback } from 'react';
import client from '../api/client';
import StatsCard from '../components/dashboard/StatsCard';
import DailyUsageBar from '../components/dashboard/DailyUsageBar';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import { toast } from '../utils/toastEmitter';

const STATUS_VARIANT = { active: 'success', paused: 'warning', completed: 'info', draft: 'default' };

function fmt(dt) {
  return new Date(dt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await client.get('/api/dashboard');
      setData(r.data.data);
    } catch {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleProcess = async () => {
    setProcessing(true);
    try {
      const secret = import.meta.env.VITE_WORKER_SECRET;
      const url = secret ? `/api/worker/process?secret=${secret}` : '/api/worker/process';
      const r = await client.post(url);
      toast.success(`Processed ${r.data.processed} email(s)`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Worker failed');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spinner size="lg" /></div>;
  if (!data) return null;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">Overview of your email campaigns</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={load}>↺ Refresh</button>
          <button className="btn btn-primary" onClick={handleProcess} disabled={processing}>
            {processing ? <><Spinner size="sm" /> Processing…</> : '▶ Process Now'}
          </button>
        </div>
      </div>
      <div className="page-content">
        <div className="stats-grid-dashboard">
          <StatsCard label="Total Campaigns" value={data.total_campaigns} color="blue" />
          <StatsCard label="Sent Today" value={data.sent_today} color="green" />
          <StatsCard label="Pending Emails" value={data.pending_emails} color="yellow" />
          <StatsCard label="Failed Emails" value={data.failed_emails} color="red" />
          <StatsCard label="Daily Remaining" value={data.remaining_daily_limit} color="gray" />
          <StatsCard label="Active Accounts" value={data.active_accounts} color="blue" />
        </div>

        {data.accounts?.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--text-muted)', marginBottom: 12 }}>
              Gmail Account Usage
            </h3>
            <div className="accounts-grid">
              {data.accounts.map(a => <DailyUsageBar key={a.id} account={a} />)}
            </div>
          </div>
        )}

        {data.recent_campaigns?.length > 0 && (
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--text-muted)', marginBottom: 12 }}>
              Recent Campaigns
            </h3>
            <div className="card" style={{ overflow: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Progress</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent_campaigns.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600 }}>{c.name}</td>
                      <td><Badge variant={STATUS_VARIANT[c.status] || 'default'}>{c.status}</Badge></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 100 }}>
                          <div className="mini-bar" style={{ flex: 1 }}>
                            <div className="mini-bar-fill" style={{ width: `${c.total_recipients > 0 ? Math.round((c.sent_count / c.total_recipients) * 100) : 0}%` }} />
                          </div>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.sent_count}/{c.total_recipients}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fmt(c.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!data.recent_campaigns?.length && !data.accounts?.length && (
          <div className="empty-state">
            <div className="empty-state-icon">📬</div>
            <div className="empty-state-text">Welcome to MailBlast</div>
            <div className="empty-state-sub">Start by adding a Gmail account and creating your first template.</div>
          </div>
        )}
      </div>
    </div>
  );
}
