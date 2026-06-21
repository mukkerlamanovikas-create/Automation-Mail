import { useState, useEffect, useCallback } from 'react';
import client from '../api/client';
import CampaignRow from '../components/campaigns/CampaignRow';
import Spinner from '../components/ui/Spinner';
import { toast } from '../utils/toastEmitter';

export default function CampaignHistoryPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const r = await client.get('/api/campaigns');
      setCampaigns(r.data.data);
    } catch {
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handlePause = async c => {
    try {
      await client.post(`/api/campaigns/${c.id}/pause`);
      toast.success(`"${c.name}" paused`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to pause');
    }
  };

  const handleResume = async c => {
    try {
      await client.post(`/api/campaigns/${c.id}/resume`);
      toast.success(`"${c.name}" resumed`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to resume');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Campaign History</div>
          <div className="page-subtitle">All your email campaigns</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={load}>↺ Refresh</button>
        </div>
      </div>
      <div className="page-content">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><Spinner size="lg" /></div>
        ) : campaigns.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-text">No campaigns yet</div>
            <div className="empty-state-sub">Launch your first campaign to see it here.</div>
            <a href="/campaigns/new" className="btn btn-primary" style={{ marginTop: 16, display: 'inline-flex' }}>New Campaign</a>
          </div>
        ) : (
          <div className="card" style={{ overflow: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Gmail</th>
                  <th>Template</th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map(c => (
                  <CampaignRow key={c.id} campaign={c} onPause={handlePause} onResume={handleResume} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
