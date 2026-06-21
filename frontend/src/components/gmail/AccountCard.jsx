import { useState } from 'react';
import Spinner from '../ui/Spinner';
import client from '../../api/client';

const LIMIT = 350;

export default function AccountCard({ account, onEdit, onDelete, onTest }) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      await client.post(`/api/gmail-accounts/${account.id}/test`);
      setTestResult({ ok: true, msg: 'Connection successful!' });
    } catch (err) {
      setTestResult({ ok: false, msg: err.response?.data?.error || 'Connection failed' });
    } finally {
      setTesting(false);
    }
  };

  const sent = account.today_sent ?? 0;
  const pct = Math.min((sent / LIMIT) * 100, 100).toFixed(1);

  return (
    <div className="account-card">
      <div className="account-card-label">{account.label}</div>
      <div className="account-card-email">{account.email}</div>
      <div className="usage-bar-wrap">
        <div className="usage-bar-track">
          <div className="usage-bar-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="usage-bar-text">{sent} / {LIMIT} sent today</div>
      </div>
      {testResult && (
        <div style={{
          marginTop: 8, fontSize: 12, padding: '6px 10px',
          borderRadius: 6, fontWeight: 600,
          background: testResult.ok ? 'var(--success-light)' : 'var(--error-light)',
          color: testResult.ok ? '#065f46' : '#991b1b',
        }}>
          {testResult.msg}
        </div>
      )}
      <div className="account-card-actions">
        <button className="btn btn-secondary" style={{ fontSize: 12, padding: '5px 12px' }} onClick={() => onEdit(account)}>Edit</button>
        <button className="btn btn-secondary" style={{ fontSize: 12, padding: '5px 12px' }} onClick={() => onDelete(account)}>Delete</button>
        <button
          className="btn btn-secondary"
          style={{ fontSize: 12, padding: '5px 12px' }}
          onClick={handleTest}
          disabled={testing}
        >
          {testing ? <><Spinner size="sm" /> Testing…</> : 'Test'}
        </button>
      </div>
    </div>
  );
}
