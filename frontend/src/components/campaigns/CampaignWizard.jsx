import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import RecipientUploader from './RecipientUploader';
import Spinner from '../ui/Spinner';
import client from '../../api/client';
import { toast } from '../../utils/toastEmitter';
import Badge from '../ui/Badge';

const STEPS = ['Campaign Setup', 'Choose Template', 'Upload Recipients', 'Review & Launch'];

export default function CampaignWizard({ gmailAccounts, templates, preSelectedTemplateId }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [gmailId, setGmailId] = useState(preSelectedTemplateId ? null : (gmailAccounts[0]?.id || null));
  const [templateId, setTemplateId] = useState(
    preSelectedTemplateId ? parseInt(preSelectedTemplateId) : (templates.find(t => t.is_default)?.id || templates[0]?.id || null)
  );
  const [recipients, setRecipients] = useState(null);
  const [launching, setLaunching] = useState(false);

  const selectedGmail = gmailAccounts.find(a => a.id === gmailId);
  const selectedTemplate = templates.find(t => t.id === templateId);

  const canNext = () => {
    if (step === 0) return name.trim().length >= 2 && gmailId;
    if (step === 1) return !!templateId;
    if (step === 2) return recipients?.recipients?.length > 0;
    return true;
  };

  const handleLaunch = async () => {
    setLaunching(true);
    try {
      await client.post('/api/campaigns', {
        name: name.trim(),
        gmail_account_id: gmailId,
        template_id: templateId,
        recipients: recipients.recipients,
      });
      toast.success(`Campaign "${name}" launched with ${recipients.recipients.length} recipients`);
      navigate('/campaigns');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to launch campaign');
    } finally {
      setLaunching(false);
    }
  };

  const estimated = recipients ? Math.ceil((recipients.recipients.length * 8) / 60) : 0;

  return (
    <div>
      <div className="wizard-steps">
        {STEPS.map((label, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div className={`wizard-step ${i < step ? 'wizard-step--done' : i === step ? 'wizard-step--active' : ''}`}>
              <div className="wizard-step-bubble">{i < step ? '✓' : i + 1}</div>
              <span className="wizard-step-label">{label}</span>
            </div>
            {i < STEPS.length - 1 && <div className="wizard-connector" />}
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 28 }}>
        {step === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="form-group">
              <label>Campaign Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Q1 Job Outreach"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Gmail Account</label>
              {gmailAccounts.length === 0 ? (
                <p className="err-msg">No Gmail accounts added. <Link to="/gmail-accounts">Add one first</Link>.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                  {gmailAccounts.map(a => (
                    <div
                      key={a.id}
                      className={`selectable-card ${gmailId === a.id ? 'selected' : ''}`}
                      onClick={() => setGmailId(a.id)}
                    >
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{a.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.email}</div>
                      <div style={{ fontSize: 11, marginTop: 4, color: 'var(--text-muted)' }}>
                        {350 - (a.today_sent || 0)} emails remaining today
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Click a template to select it.</p>
            {templates.length === 0 ? (
              <p className="err-msg">No templates yet. <Link to="/templates">Create one first</Link>.</p>
            ) : (
              <div className="templates-grid">
                {templates.map(t => (
                  <div
                    key={t.id}
                    className={`selectable-card ${templateId === t.id ? 'selected' : ''}`}
                    onClick={() => setTemplateId(t.id)}
                  >
                    <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                      {t.name}
                      {t.is_default && <Badge variant="success">Default</Badge>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{t.subject}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <RecipientUploader onRecipients={setRecipients} />
        )}

        {step === 3 && (
          <div>
            <div className="summary-card">
              <div className="summary-row"><span className="summary-key">Campaign Name</span><span className="summary-val">{name}</span></div>
              <div className="summary-row"><span className="summary-key">Gmail Account</span><span className="summary-val">{selectedGmail?.label} ({selectedGmail?.email})</span></div>
              <div className="summary-row"><span className="summary-key">Template</span><span className="summary-val">{selectedTemplate?.name}</span></div>
              <div className="summary-row"><span className="summary-key">Recipients</span><span className="summary-val">{recipients?.recipients?.length || 0}</span></div>
              <div className="summary-row">
                <span className="summary-key">Estimated Time</span>
                <span className="summary-val">~{estimated} minutes (at 8s/email via hourly cron)</span>
              </div>
            </div>
            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <button
                className="btn btn-primary btn-lg"
                onClick={handleLaunch}
                disabled={launching}
              >
                {launching ? <><Spinner size="sm" /> Launching…</> : '🚀 Launch Campaign'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
        <button
          className="btn btn-secondary"
          onClick={() => setStep(s => s - 1)}
          disabled={step === 0}
        >
          ← Back
        </button>
        {step < STEPS.length - 1 && (
          <button
            className="btn btn-primary"
            onClick={() => setStep(s => s + 1)}
            disabled={!canNext()}
          >
            Next →
          </button>
        )}
      </div>
    </div>
  );
}
