import { useRef, useState } from 'react';

const SAMPLE_ROWS = [
  { name: 'John Doe',      email: 'john.doe@example.com' },
  { name: 'Jane Smith',    email: 'jane.smith@example.com' },
  { name: 'Alice Johnson', email: 'alice.j@example.com' },
  { name: 'Bob Williams',  email: 'bob.w@example.com' },
  { name: 'Carol Brown',   email: 'carol.b@example.com' },
];

function ExcelFormatGuide() {
  const [open, setOpen] = useState(false);

  return (
    <div className="excel-guide">
      <button
        type="button"
        className="excel-guide-toggle"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <span className="excel-guide-toggle-icon">&#128202;</span>
        <span>How should the Excel file look?</span>
        <span className={`chevron ${open ? 'chevron--up' : ''}`}>&#8250;</span>
      </button>

      {open && (
        <div className="excel-guide-body">
          <p className="excel-guide-desc">
            Your file must have a <strong>header row</strong> with at least two columns named
            &nbsp;<code>Name</code> and <code>Email</code> (column order does not matter, case-insensitive).
            Each subsequent row is one recipient.
          </p>

          {/* Fake spreadsheet window */}
          <div className="xls-window">
            {/* Title bar */}
            <div className="xls-titlebar">
              <div className="xls-dots">
                <span className="xls-dot xls-dot--red" />
                <span className="xls-dot xls-dot--yellow" />
                <span className="xls-dot xls-dot--green" />
              </div>
              <span className="xls-filename">recipients.xlsx</span>
            </div>

            {/* Toolbar strip */}
            <div className="xls-toolbar">
              <span className="xls-toolbar-cell">A1</span>
              <div className="xls-toolbar-sep" />
              <span className="xls-formula">Name</span>
            </div>

            {/* Sheet grid */}
            <div className="xls-grid-wrap">
              <table className="xls-grid" cellSpacing={0}>
                <thead>
                  {/* Column letters */}
                  <tr>
                    <th className="xls-row-num" />
                    <th className="xls-col-letter">A</th>
                    <th className="xls-col-letter">B</th>
                    <th className="xls-col-letter xls-col-extra" />
                  </tr>
                </thead>
                <tbody>
                  {/* Header row */}
                  <tr className="xls-header-row">
                    <td className="xls-row-num">1</td>
                    <td className="xls-cell xls-cell--header">Name</td>
                    <td className="xls-cell xls-cell--header">Email</td>
                    <td className="xls-cell xls-col-extra" />
                  </tr>
                  {/* Data rows */}
                  {SAMPLE_ROWS.map((row, i) => (
                    <tr key={i} className={i % 2 === 1 ? 'xls-row-alt' : ''}>
                      <td className="xls-row-num">{i + 2}</td>
                      <td className="xls-cell">{row.name}</td>
                      <td className="xls-cell xls-cell--email">{row.email}</td>
                      <td className="xls-cell xls-col-extra" />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Sheet tab */}
            <div className="xls-footer">
              <span className="xls-tab xls-tab--active">Sheet1</span>
              <span className="xls-tab">Sheet2</span>
            </div>
          </div>

          {/* Rules */}
          <ul className="excel-guide-rules">
            <li><span className="rule-tick">&#10003;</span> First row must be a header: <code>Name</code>, <code>Email</code></li>
            <li><span className="rule-tick">&#10003;</span> One recipient per row — no blank rows between data</li>
            <li><span className="rule-tick">&#10003;</span> Email values must be valid (e.g. <code>user@domain.com</code>)</li>
            <li><span className="rule-cross">&#10007;</span> Extra columns are ignored — they won&apos;t cause errors</li>
            <li><span className="rule-cross">&#10007;</span> Rows with missing name <em>or</em> invalid email are skipped automatically</li>
          </ul>
        </div>
      )}
    </div>
  );
}

const DEFAULT_BODY = `Hello {{name}},

Please find the attached document.

Regards,
Admin Team`;

export default function EmailForm({
  formData,
  onChange,
  onExcelUpload,
  onPdfUpload,
  onSubmit,
  recipients,
  skippedRows,
  pdfFile,
  excelFile,
  errors,
}) {
  const excelRef = useRef(null);
  const pdfRef = useRef(null);

  function handleExcel(e) {
    const file = e.target.files[0];
    if (file) onExcelUpload(file);
  }

  function handlePdf(e) {
    const file = e.target.files[0];
    if (file) onPdfUpload(file);
  }

  function removeExcel(e) {
    e.stopPropagation();
    onExcelUpload(null);
    excelRef.current.value = '';
  }

  function removePdf(e) {
    e.stopPropagation();
    onPdfUpload(null);
    pdfRef.current.value = '';
  }

  return (
    <div className="card form-card">
      <div className="card-header">
        <h2>Campaign Configuration</h2>
        <p className="card-subtitle">Configure your sender, content, and recipient list</p>
      </div>

      {/* ── Gmail Credentials ── */}
      <section className="form-section">
        <div className="section-title">
          <span className="section-icon">&#128274;</span>
          Gmail Credentials
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="gmailEmail">Gmail Address <span className="required">*</span></label>
            <input
              id="gmailEmail"
              type="email"
              value={formData.gmailEmail}
              onChange={e => onChange('gmailEmail', e.target.value)}
              placeholder="you@gmail.com"
              className={errors.gmailEmail ? 'input-error' : ''}
              autoComplete="email"
            />
            {errors.gmailEmail && <span className="err-msg">{errors.gmailEmail}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="gmailPassword">
              App Password <span className="required">*</span>
            </label>
            <input
              id="gmailPassword"
              type="password"
              value={formData.gmailPassword}
              onChange={e => onChange('gmailPassword', e.target.value)}
              placeholder="16-character app password"
              className={errors.gmailPassword ? 'input-error' : ''}
              autoComplete="current-password"
            />
            {errors.gmailPassword && <span className="err-msg">{errors.gmailPassword}</span>}
            <span className="field-hint">
              Use a Gmail App Password, not your account password.&nbsp;
              <a
                href="https://myaccount.google.com/apppasswords"
                target="_blank"
                rel="noopener noreferrer"
              >
                Generate one &rarr;
              </a>
            </span>
          </div>
        </div>
      </section>

      {/* ── Email Content ── */}
      <section className="form-section">
        <div className="section-title">
          <span className="section-icon">&#9993;</span>
          Email Content
        </div>

        <div className="form-group">
          <label htmlFor="subject">
            Subject <span className="required">*</span>
          </label>
          <input
            id="subject"
            type="text"
            value={formData.subject}
            onChange={e => onChange('subject', e.target.value)}
            placeholder="Enter email subject line"
            className={errors.subject ? 'input-error' : ''}
          />
          {errors.subject && <span className="err-msg">{errors.subject}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="bodyTemplate">
            Body Template <span className="required">*</span>
            <span className="label-badge">&#123;&#123;name&#125;&#125; will be replaced per recipient</span>
          </label>
          <textarea
            id="bodyTemplate"
            value={formData.bodyTemplate}
            onChange={e => onChange('bodyTemplate', e.target.value)}
            rows={9}
            placeholder={DEFAULT_BODY}
            className={errors.bodyTemplate ? 'input-error' : ''}
          />
          {errors.bodyTemplate && <span className="err-msg">{errors.bodyTemplate}</span>}
        </div>
      </section>

      {/* ── File Uploads ── */}
      <section className="form-section">
        <div className="section-title">
          <span className="section-icon">&#128196;</span>
          Files
        </div>

        <div className="form-row">
          {/* Excel upload */}
          <div className="form-group">
            <label>
              Recipients Excel <span className="required">*</span>
              <span className="label-badge">.xlsx / .xls</span>
            </label>
            <div
              className={`file-drop ${excelFile ? 'file-drop--filled' : ''} ${errors.excel ? 'file-drop--error' : ''}`}
              onClick={() => excelRef.current.click()}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && excelRef.current.click()}
            >
              {excelFile ? (
                <div className="file-info">
                  <span className="file-icon">&#128202;</span>
                  <div className="file-meta">
                    <span className="file-name">{excelFile.name}</span>
                    <span className="file-detail">
                      {recipients.length} valid recipient{recipients.length !== 1 ? 's' : ''}
                      {skippedRows?.length > 0 && ` · ${skippedRows.length} skipped`}
                    </span>
                  </div>
                  <button className="btn-remove" onClick={removeExcel} title="Remove file">&#10005;</button>
                </div>
              ) : (
                <div className="file-placeholder">
                  <span className="upload-arrow">&#8679;</span>
                  <span>Click to upload Excel file</span>
                  <span className="file-note">Requires columns: Name, Email</span>
                </div>
              )}
            </div>
            <input ref={excelRef} type="file" accept=".xlsx,.xls" onChange={handleExcel} hidden />
            {errors.excel && <span className="err-msg">{errors.excel}</span>}
          </div>

          {/* PDF upload */}
          <div className="form-group">
            <label>
              PDF Attachment
              <span className="label-badge optional">Optional</span>
            </label>
            <div
              className={`file-drop ${pdfFile ? 'file-drop--filled' : ''}`}
              onClick={() => pdfRef.current.click()}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && pdfRef.current.click()}
            >
              {pdfFile ? (
                <div className="file-info">
                  <span className="file-icon">&#128196;</span>
                  <div className="file-meta">
                    <span className="file-name">{pdfFile.name}</span>
                    <span className="file-detail">{(pdfFile.size / 1024).toFixed(1)} KB</span>
                  </div>
                  <button className="btn-remove" onClick={removePdf} title="Remove file">&#10005;</button>
                </div>
              ) : (
                <div className="file-placeholder">
                  <span className="upload-arrow">&#8679;</span>
                  <span>Click to upload PDF</span>
                  <span className="file-note">Max ~3 MB (Vercel limit)</span>
                </div>
              )}
            </div>
            <input ref={pdfRef} type="file" accept=".pdf" onChange={handlePdf} hidden />
          </div>
        </div>

        {skippedRows?.length > 0 && (
          <div className="skipped-notice">
            <strong>&#9888; {skippedRows.length} row{skippedRows.length > 1 ? 's' : ''} skipped</strong> (invalid / missing data):{' '}
            {skippedRows.slice(0, 3).join(' · ')}
            {skippedRows.length > 3 && ` · …and ${skippedRows.length - 3} more`}
          </div>
        )}

        {/* Excel format guide */}
        <ExcelFormatGuide />
      </section>

      <div className="form-footer">
        <button className="btn btn-primary btn-lg" onClick={onSubmit}>
          Preview Recipients &rarr;
        </button>
      </div>
    </div>
  );
}
