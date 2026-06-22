import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import client from '../api/client';
import { useAuthStore } from '../store/auth';
import Spinner from '../components/ui/Spinner';

export default function RegisterPage() {
  const navigate = useNavigate();
  const login = useAuthStore(s => s.login);
  const [form, setForm] = useState({ email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.email || !form.password || !form.confirm) { setErr('All fields are required'); return; }
    if (form.password !== form.confirm) { setErr('Passwords do not match'); return; }
    if (form.password.length < 8) { setErr('Password must be at least 8 characters'); return; }
    setLoading(true); setErr('');
    try {
      const r = await client.post('/api/auth/register', { email: form.email, password: form.password });
      login(r.data.token, r.data.user);
      navigate('/');
    } catch (error) {
      setErr(error.response?.data?.error || 'Registration failed');
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
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Create your account</p>
        </div>
        <div className="card" style={{ padding: 28 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="you@gmail.com" autoFocus />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={form.password} onChange={set('password')} placeholder="Min. 8 characters" />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input type="password" value={form.confirm} onChange={set('confirm')} placeholder="••••••••" />
            </div>
            {err && <p className="err-msg">{err}</p>}
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? <><Spinner size="sm" /> Creating account…</> : 'Create Account'}
            </button>
            <div style={{ textAlign: 'center', fontSize: 13 }}>
              Already have an account? <Link to="/login">Sign in</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
