import { useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import Spinner from '../components/ui/Spinner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    if (!email) { setErr('Email is required'); return; }
    setLoading(true); setErr('');
    try {
      await client.post('/api/auth/forgot-password', { email });
      setSent(true);
    } catch (error) {
      setErr(error.response?.data?.error || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Reset Password</h1>
        </div>
        <div className="card" style={{ padding: 28 }}>
          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📧</div>
              <p style={{ fontWeight: 600, marginBottom: 6 }}>Check your inbox</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                We sent a reset link to <strong>{email}</strong>. It expires in 1 hour.
              </p>
              <Link to="/login" className="btn btn-secondary">Back to Login</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@gmail.com" autoFocus />
              </div>
              {err && <p className="err-msg">{err}</p>}
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <><Spinner size="sm" /> Sending…</> : 'Send Reset Link'}
              </button>
              <div style={{ textAlign: 'center', fontSize: 13 }}>
                <Link to="/login">Back to Login</Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
