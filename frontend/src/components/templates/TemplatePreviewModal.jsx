import Modal from '../ui/Modal';

function renderBody(body) {
  if (!body) return '';
  return body.replace(/\n/g, '<br>');
}

export default function TemplatePreviewModal({ isOpen, onClose, template }) {
  if (!template) return null;

  const downloadPdf = () => {
    const bytes = atob(template.pdf_data);
    const buf = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) buf[i] = bytes.charCodeAt(i);
    const blob = new Blob([buf], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = template.pdf_filename || 'attachment.pdf';
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Preview: ${template.name}`} size="lg">
      <div className="modal-body">
        <div style={{ marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Subject</span>
          <div style={{ fontSize: 15, fontWeight: 600, marginTop: 2 }}>{template.subject}</div>
        </div>
        <div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Body</span>
          <div
            className="preview-pane"
            style={{ marginTop: 4 }}
            dangerouslySetInnerHTML={{ __html: renderBody(template.body) }}
          />
        </div>
        {template.pdf_filename && (
          <div style={{ marginTop: 12 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Attachment</span>
            <div style={{ marginTop: 4 }}>
              <button className="btn btn-secondary" style={{ fontSize: 12 }} onClick={downloadPdf}>
                ⬇ {template.pdf_filename}
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>Close</button>
      </div>
    </Modal>
  );
}
