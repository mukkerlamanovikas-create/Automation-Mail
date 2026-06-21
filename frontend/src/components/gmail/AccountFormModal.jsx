import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Spinner from '../ui/Spinner';
import client from '../../api/client';
import { toast } from '../../utils/toastEmitter';

export default function AccountFormModal({ isOpen, onClose, onSaved, account }) {
  const [form, setForm] = useState({ label: '', email: '', password: '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (isOpen) {
      setForm({ label: account?.label || '', email: account?.email || '', password: '' });
      setErr('');
    }
  }, [isOpen, account]);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.label.trim()) { setErr('Account name is required'); return; }
    if (!account && !form.email.trim()) { setErr('Email is required'); return; }
    if (!account && !form.password.trim()) { setErr('App password is required'); return; }
    setSaving(true);
    setErr('');
    try {
      const payload = { label: form.label.trim() };
      if (!account) { payload.email = form.email.trim().toLowerCase(); payload.password = form.password.trim(); }
      else if (form.password.trim()) payload.password = form.password.trim();
      if (account) {
        await client.put(`/api/gmail-accounts/${account.id}`, payload);
      } else {
        await client.post('/api/gmail-accounts', payload);
      }
      toast.success(account ? 'Account updated' : 'Account added');
      onSaved();
      onClose();
    } catch (error) {
      setErr(error.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={account ? 'Edit Gmail Account' : 'Add Gmail Account'} size="md">
      <form onSubmit={handleSubmit}>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label>Account Name</label>
            <input type="text" value={form.label} onChange={set('label')} placeholder="e.g. Marketing Account" />
          </div>
          <div className="form-group">
            <label>Gmail Email</label>
            <input
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="you@gmail.com"
              disabled={!!account}
              style={account ? { opacity: 0.6 } : {}}
            />
          </div>
          <div className="form-group">
            <label>{account ? 'New App Password (leave blank to keep current)' : 'Gmail App Password'}</label>
            <input
              type="password"
              value={form.password}
              onChange={set('password')}
              placeholder={account ? '16-char app password (optional)' : '16-char app password'}
            />
            <span className="field-hint">Generate at myaccount.google.com › Security › App passwords</span>
          </div>
          {err && <p className="err-msg">{err}</p>}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <><Spinner size="sm" /> Saving…</> : (account ? 'Update' : 'Add Account')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
