import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Spinner from '../ui/Spinner';
import FileDropZone from '../ui/FileDropZone';
import client from '../../api/client';
import { toast } from '../../utils/toastEmitter';

function preview(body) {
  return (body || '')
    .replace(/\{\{name\}\}/g, 'John Doe')
    .replace(/\{\{email\}\}/g, 'john@example.com')
    .replace(/\n/g, '<br>');
}

function toBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = e => res(e.target.result.split(',')[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

export default function TemplateFormModal({ isOpen, onClose, onSaved, template }) {
  const [form, setForm] = useState({ name: '', subject: '', body: '' });
  const [pdfFile, setPdfFile] = useState(null);
  const [existingPdf, setExistingPdf] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setErr('');
    setPdfFile(null);
    setExistingPdf(null);
    if (template) {
      setLoading(true);
      client.get(`/api/templates/${template.id}`)
        .then(r => {
          const t = r.data.data;
          setForm({ name: t.name, subject: t.subject, body: t.body });
          if (t.pdf_filename) setExistingPdf({ name: t.pdf_filename, data: t.pdf_data });
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setForm({ name: '', subject: '', body: '' });
    }
  }, [isOpen, template]);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name.trim()) { setErr('Name is required'); return; }
    if (!form.subject.trim()) { setErr('Subject is required'); return; }
    if (!form.body.trim()) { setErr('Body is required'); return; }
    setSaving(true); setErr('');
    try {
      const payload = { name: form.name.trim(), subject: form.subject.trim(), body: form.body.trim() };
      if (pdfFile) {
        payload.pdf_data = await toBase64(pdfFile);
        payload.pdf_filename = pdfFile.name;
      } else if (existingPdf) {
        payload.pdf_data = existingPdf.data;
        payload.pdf_filename = existingPdf.name;
      }
      if (template) {
        await client.put(`/api/templates/${template.id}`, payload);
      } else {
        await client.post('/api/templates', payload);
      }
      toast.success(template ? 'Template updated' : 'Template created');
      onSaved(); onClose();
    } catch (error) {
      setErr(error.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={template ? 'Edit Template' : 'Create Template'} size="xl">
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}><Spinner size="lg" /></div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                <div className="form-group">
                  <label>Template Name</label>
                  <input type="text" value={form.name} onChange={set('name')} placeholder="e.g. Job Outreach" />
                </div>
                <div className="form-group">
                  <label>Subject</label>
                  <input type="text" value={form.subject} onChange={set('subject')} placeholder="Email subject line" />
                </div>
              </div>
              <div className="split-pane">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="form-group">
                    <label>Body</label>
                    <textarea
                      value={form.body}
                      onChange={set('body')}
                      placeholder="Hi {{name}},&#10;&#10;Write your email here..."
                      style={{ minHeight: 200 }}
                    />
                    <span className="field-hint">Use {'{{name}}'} and {'{{email}}'} as placeholders</span>
                  </div>
                  <div className="form-group">
                    <label>Attachment (optional)</label>
                    <FileDropZone
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif,.webp"
                      file={pdfFile}
                      onFile={setPdfFile}
                      onRemove={() => { setPdfFile(null); setExistingPdf(null); }}
                      label={existingPdf ? `Current: ${existingPdf.name}` : 'Upload file'}
                      hint="PDF, Word (.doc/.docx), or image (PNG, JPG, GIF, WEBP)"
                    />
                    {existingPdf && !pdfFile && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, fontSize: 12 }}>
                        <span>📎 {existingPdf.name}</span>
                        <button type="button" className="btn-remove" onClick={() => setExistingPdf(null)}>✕</button>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <div className="preview-label">Live Preview</div>
                  <div
                    className="preview-pane"
                    style={{ minHeight: 260 }}
                    dangerouslySetInnerHTML={{ __html: preview(form.body) || '<span style="color:#94a3b8">Preview appears here…</span>' }}
                  />
                </div>
              </div>
              {err && <p className="err-msg" style={{ marginTop: 10 }}>{err}</p>}
            </>
          )}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving || loading}>
            {saving ? <><Spinner size="sm" /> Saving…</> : (template ? 'Update' : 'Create')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
