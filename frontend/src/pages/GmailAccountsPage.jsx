import { useState, useEffect, useCallback } from 'react';
import client from '../api/client';
import AccountCard from '../components/gmail/AccountCard';
import AccountFormModal from '../components/gmail/AccountFormModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Spinner from '../components/ui/Spinner';
import { toast } from '../utils/toastEmitter';

export default function GmailAccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = useCallback(async () => {
    try {
      const r = await client.get('/api/gmail-accounts');
      setAccounts(r.data.data);
    } catch {
      toast.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditing(null); setFormOpen(true); };
  const openEdit = a => { setEditing(a); setFormOpen(true); };

  const handleDelete = async () => {
    try {
      await client.delete(`/api/gmail-accounts/${deleteTarget.id}`);
      toast.success('Account deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Gmail Accounts</div>
          <div className="page-subtitle">Manage your sending accounts</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={openAdd}>+ Add Account</button>
        </div>
      </div>
      <div className="page-content">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><Spinner size="lg" /></div>
        ) : accounts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📧</div>
            <div className="empty-state-text">No Gmail accounts yet</div>
            <div className="empty-state-sub">Add a Gmail account with an App Password to start sending.</div>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openAdd}>Add Account</button>
          </div>
        ) : (
          <div className="accounts-grid">
            {accounts.map(a => (
              <AccountCard
                key={a.id}
                account={a}
                onEdit={openEdit}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}
      </div>

      <AccountFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={load}
        account={editing}
      />
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Account"
        message={`Delete "${deleteTarget?.label}"? This will also remove all associated campaigns.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
