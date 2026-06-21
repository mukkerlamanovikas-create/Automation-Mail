import { useState } from 'react';
import FileDropZone from '../ui/FileDropZone';
import { parseFile } from '../../utils/excelParser';

export default function RecipientUploader({ onRecipients }) {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleFile = async f => {
    setFile(f);
    setResult(null);
    setError('');
    try {
      const parsed = await parseFile(f);
      setResult(parsed);
      onRecipients(parsed);
    } catch (err) {
      setError(err.message);
      onRecipients(null);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setResult(null);
    setError('');
    onRecipients(null);
  };

  return (
    <div>
      <FileDropZone
        accept=".csv,.xlsx,.xls"
        file={file}
        onFile={handleFile}
        onRemove={handleRemove}
        label="Drop CSV or Excel file here"
        hint="Supported: .csv, .xlsx, .xls — must have Email column"
        error={error}
      />
      {result && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--success)', marginBottom: 8 }}>
            ✓ {result.recipients.length} valid recipients
            {result.duplicatesRemoved > 0 && ` | ${result.duplicatesRemoved} duplicates removed`}
            {result.skipped.length > 0 && ` | ${result.skipped.length} rows skipped`}
          </div>
          <table className="data-table" style={{ fontSize: 12 }}>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {result.recipients.slice(0, 5).map((r, i) => (
                <tr key={i}>
                  <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                  <td>{r.name}</td>
                  <td style={{ color: 'var(--primary)', fontFamily: 'monospace' }}>{r.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {result.recipients.length > 5 && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              …and {result.recipients.length - 5} more
            </div>
          )}
        </div>
      )}
    </div>
  );
}
