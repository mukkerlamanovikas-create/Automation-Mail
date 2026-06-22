import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import client from '../api/client';
import { useAuthStore } from '../store/auth';
import Spinner from '../components/ui/Spinner';

export default function LoginPage() {
  const login = useAuthStore(s => s.login);
  const location = useLocation();
  const successMsg = location.state?.msg || '';
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.email || !form.password) { setErr('Email and password are required'); return; }
    setLoading(true); setErr('');
    try {
      const r = await client.post('/api/auth/login', form);
      login(r.data.token, r.data.user);
      window.location.href = '/';
    } catch (error) {
      setErr(error.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>✉</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)' }}>MailBlast</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Sign in to your account</p>
        </div>
        <div className="card" style={{ padding: 28 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="you@gmail.com" autoFocus />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={form.password} onChange={set('password')} placeholder="••••••••" />
            </div>
            {successMsg && <p style={{ color: 'var(--success)', fontSize: 13, textAlign: 'center' }}>{successMsg}</p>}
            {err && <p className="err-msg">{err}</p>}
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? <><Spinner size="sm" /> Signing in…</> : 'Sign In'}
            </button>
            <div style={{ textAlign: 'center', fontSize: 13 }}>
              <Link to="/forgot-password">Forgot password?</Link>
            </div>
            <div style={{ textAlign: 'center', fontSize: 13 }}>
              Don't have an account? <Link to="/register">Create one</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
