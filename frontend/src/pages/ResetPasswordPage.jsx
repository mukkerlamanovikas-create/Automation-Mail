import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import client from '../api/client';
import Spinner from '../components/ui/Spinner';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token');
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.password) { setErr('Password is required'); return; }
    if (form.password.length < 8) { setErr('Password must be at least 8 characters'); return; }
    if (form.password !== form.confirm) { setErr('Passwords do not match'); return; }
    setLoading(true); setErr('');
    try {
      await client.post('/api/auth/reset-password', { token, password: form.password });
      navigate('/login', { state: { msg: 'Password reset! Please sign in.' } });
    } catch (error) {
      setErr(error.response?.data?.error || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p className="err-msg">Invalid or missing reset token.</p>
          <Link to="/forgot-password" className="btn btn-primary" style={{ marginTop: 12 }}>Request new link</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Set New Password</h1>
        </div>
        <div className="card" style={{ padding: 28 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label>New Password</label>
              <input type="password" value={form.password} onChange={set('password')} placeholder="Min 8 characters" autoFocus />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input type="password" value={form.confirm} onChange={set('confirm')} placeholder="Repeat password" />
            </div>
            {err && <p className="err-msg">{err}</p>}
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><Spinner size="sm" /> Saving…</> : 'Set Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
