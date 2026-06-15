import { useState, useCallback, useRef } from 'react';
import axios from 'axios';
import EmailForm from './components/EmailForm';
import ProgressTracker from './components/ProgressTracker';
import StatusLog from './components/StatusLog';
import { parseExcelFile } from './utils/excelParser';

// Use VITE_API_URL in production; empty string falls back to Vite dev proxy
const API_BASE = import.meta.env.VITE_API_URL || '';

const INITIAL_FORM = {
  gmailEmail: '',
  gmailPassword: '',
  subject: '',
  bodyTemplate: `Hello {{name}},\n\nPlease find the attached document.\n\nRegards,\nAdmin Team`,
};

const INITIAL_SEND = {
  isRunning: false,
  isComplete: false,
  total: 0,
  sent: 0,
  failed: 0,
  currentEmail: null,
  currentIndex: 0,
  countdown: null,
};

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

export default function App() {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [pdfFile, setPdfFile] = useState(null);
  const [excelFile, setExcelFile] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [skippedRows, setSkippedRows] = useState([]);
  const [errors, setErrors] = useState({});
  const [phase, setPhase] = useState('form'); // form | preview | sending | complete
  const [sendState, setSendState] = useState(INITIAL_SEND);
  const [logs, setLogs] = useState([]);

  const cancelRef = useRef(false);

  // ── Form handlers ──────────────────────────────────────────────────────────

  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null }));
  }, []);

  const handleExcelUpload = useCallback(async (file) => {
    if (!file) {
      setExcelFile(null);
      setRecipients([]);
      setSkippedRows([]);
      return;
    }
    try {
      const { recipients: parsed, skipped } = await parseExcelFile(file);
      setExcelFile(file);
      setRecipients(parsed);
      setSkippedRows(skipped || []);
      setErrors(prev => ({ ...prev, excel: null }));
    } catch (err) {
      setErrors(prev => ({ ...prev, excel: err.message }));
      setExcelFile(null);
      setRecipients([]);
    }
  }, []);

  const handlePdfUpload = useCallback((file) => {
    setPdfFile(file || null);
  }, []);

  // ── Validation ─────────────────────────────────────────────────────────────

  function validate() {
    const e = {};
    if (!formData.gmailEmail) e.gmailEmail = 'Gmail address is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.gmailEmail))
      e.gmailEmail = 'Invalid email format';

    if (!formData.gmailPassword) e.gmailPassword = 'App password is required';
    if (!formData.subject) e.subject = 'Subject is required';
    if (!formData.bodyTemplate.trim()) e.bodyTemplate = 'Email body is required';
    if (!excelFile || recipients.length === 0)
      e.excel = 'Upload a valid Excel file with at least one recipient';

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── Phase transitions ──────────────────────────────────────────────────────

  function goToPreview() {
    if (validate()) setPhase('preview');
  }

  // ── Email sending loop ─────────────────────────────────────────────────────

  async function startSending() {
    cancelRef.current = false;

    // Convert PDF once for the entire campaign
    let pdfBase64 = null;
    if (pdfFile) {
      pdfBase64 = await fileToBase64(pdfFile);
    }

    setSendState({
      ...INITIAL_SEND,
      isRunning: true,
      total: recipients.length,
    });
    setLogs([]);
    setPhase('sending');

    let sent = 0;
    let failed = 0;

    function addLog(type, message) {
      setLogs(prev => [
        ...prev,
        { type, message, timestamp: new Date().toLocaleTimeString() },
      ]);
    }

    for (let i = 0; i < recipients.length; i++) {
      if (cancelRef.current) {
        addLog('info', 'Sending stopped by user.');
        break;
      }

      const { name, email } = recipients[i];

      setSendState(prev => ({
        ...prev,
        currentEmail: email,
        currentIndex: i + 1,
        countdown: null,
      }));

      try {
        await axios.post(`${API_BASE}/api/send-email`, {
          gmailEmail: formData.gmailEmail,
          gmailPassword: formData.gmailPassword,
          to: email,
          toName: name,
          subject: formData.subject,
          bodyTemplate: formData.bodyTemplate,
          pdfBase64,
          pdfFileName: pdfFile ? pdfFile.name : null,
        });
        sent++;
        setSendState(prev => ({ ...prev, sent }));
        addLog('success', `Sent to ${name} <${email}>`);
      } catch (err) {
        failed++;
        setSendState(prev => ({ ...prev, failed }));
        const msg = err.response?.data?.error || err.message;
        addLog('error', `Failed for ${name} <${email}>: ${msg}`);
      }

      // 15-second countdown between emails (skip after the last one)
      if (i < recipients.length - 1 && !cancelRef.current) {
        addLog('info', 'Waiting 15 seconds before next email…');
        for (let sec = 15; sec > 0; sec--) {
          if (cancelRef.current) break;
          setSendState(prev => ({ ...prev, countdown: sec, currentEmail: null }));
          await sleep(1000);
        }
        setSendState(prev => ({ ...prev, countdown: null }));
      }
    }

    setSendState(prev => ({
      ...prev,
      isRunning: false,
      isComplete: true,
      currentEmail: null,
      countdown: null,
    }));
    addLog('info', `Campaign finished — sent: ${sent}, failed: ${failed}`);
    setPhase('complete');
  }

  function handleCancel() {
    cancelRef.current = true;
  }

  function handleReset() {
    setFormData(INITIAL_FORM);
    setPdfFile(null);
    setExcelFile(null);
    setRecipients([]);
    setSkippedRows([]);
    setErrors({});
    setPhase('form');
    setSendState(INITIAL_SEND);
    setLogs([]);
    cancelRef.current = false;
  }

  // ── Stepper helper ─────────────────────────────────────────────────────────

  const STEPS = ['Configure', 'Preview', 'Send'];
  const phaseIndex = { form: 0, preview: 1, sending: 2, complete: 2 };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="brand">
            <span className="brand-icon">&#9993;</span>
            <span className="brand-name">MailBlast</span>
          </div>
          <p className="brand-tagline">Automated Email Campaign Manager</p>
        </div>
      </header>

      <main className="app-main">
        {/* Stepper */}
        <nav className="stepper" aria-label="Progress">
          {STEPS.map((label, idx) => {
            const active = phaseIndex[phase] === idx;
            const done = phaseIndex[phase] > idx;
            return (
              <div key={label} className={`step ${done ? 'step--done' : active ? 'step--active' : ''}`}>
                <div className="step-bubble">{done ? '✓' : idx + 1}</div>
                <div className="step-label">{label}</div>
                {idx < STEPS.length - 1 && <div className="step-connector" />}
              </div>
            );
          })}
        </nav>

        {/* Phase: Form */}
        {phase === 'form' && (
          <EmailForm
            formData={formData}
            onChange={handleChange}
            onExcelUpload={handleExcelUpload}
            onPdfUpload={handlePdfUpload}
            onSubmit={goToPreview}
            recipients={recipients}
            skippedRows={skippedRows}
            pdfFile={pdfFile}
            excelFile={excelFile}
            errors={errors}
          />
        )}

        {/* Phase: Preview */}
        {phase === 'preview' && (
          <div className="card preview-card">
            <div className="card-header">
              <h2>Review Recipients</h2>
              <p className="card-subtitle">
                {recipients.length} email{recipients.length !== 1 ? 's' : ''} will be sent
                {pdfFile ? ` with attachment "${pdfFile.name}"` : ' (no attachment)'}
              </p>
            </div>

            <div className="table-wrap">
              <table className="recipients-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {recipients.map((r, i) => (
                    <tr key={i}>
                      <td className="td-num">{i + 1}</td>
                      <td>{r.name}</td>
                      <td className="td-email">{r.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="timing-note">
              &#8987;&nbsp; Emails will be sent with a <strong>15-second delay</strong> between each one.
              Estimated time: ~{Math.ceil((recipients.length - 1) * 15 / 60)} min.
            </div>

            <div className="preview-actions">
              <button className="btn btn-secondary" onClick={() => setPhase('form')}>
                &larr; Back
              </button>
              <button className="btn btn-primary btn-lg" onClick={startSending}>
                &#9658;&nbsp; Send {recipients.length} Email{recipients.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        )}

        {/* Phase: Sending / Complete */}
        {(phase === 'sending' || phase === 'complete') && (
          <>
            <ProgressTracker
              total={sendState.total}
              sent={sendState.sent}
              failed={sendState.failed}
              currentEmail={sendState.currentEmail}
              currentIndex={sendState.currentIndex}
              countdown={sendState.countdown}
              isRunning={sendState.isRunning}
              isComplete={sendState.isComplete}
              onCancel={handleCancel}
              onReset={handleReset}
            />
            <StatusLog logs={logs} />
          </>
        )}
      </main>

      <footer className="app-footer">
        <p>
          Credentials are never stored — they are used only for the active session.&nbsp;
          Always use a <strong>Gmail App Password</strong>.
        </p>
      </footer>
    </div>
  );
}
