import { useState } from 'react';
import client from '../api/client';
import Spinner from '../components/ui/Spinner';
import { toast } from '../utils/toastEmitter';

export default function ChangePasswordPage() {
  const [form, setForm] = useState({ current: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.current) { setErr('Current password is required'); return; }
    if (form.password.length < 8) { setErr('New password must be at least 8 characters'); return; }
    if (form.password !== form.confirm) { setErr('Passwords do not match'); return; }
    setLoading(true); setErr('');
    try {
      await client.post('/api/auth/change-password', {
        current_password: form.current,
        new_password: form.password,
      });
      toast.success('Password changed successfully');
      setForm({ current: '', password: '', confirm: '' });
    } catch (error) {
      setErr(error.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Change Password</div>
          <div className="page-subtitle">Update your account password</div>
        </div>
      </div>
      <div className="page-content">
        <div className="card" style={{ maxWidth: 420, padding: 28 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label>Current Password</label>
              <input type="password" value={form.current} onChange={set('current')} placeholder="••••••••" />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input type="password" value={form.password} onChange={set('password')} placeholder="Min 8 characters" />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input type="password" value={form.confirm} onChange={set('confirm')} placeholder="Repeat new password" />
            </div>
            {err && <p className="err-msg">{err}</p>}
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><Spinner size="sm" /> Changing…</> : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
