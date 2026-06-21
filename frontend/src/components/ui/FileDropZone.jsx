import { useRef } from 'react';

function fmtSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileDropZone({ accept, onFile, file, onRemove, label, hint, error }) {
  const inputRef = useRef(null);

  const handleDrop = e => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) onFile(dropped);
  };

  return (
    <div>
      <div
        className={`file-drop ${file ? 'file-drop--filled' : ''} ${error ? 'file-drop--error' : ''}`}
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => !file && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          style={{ display: 'none' }}
          onChange={e => e.target.files[0] && onFile(e.target.files[0])}
        />
        {file ? (
          <div className="file-info">
            <span className="file-icon">📎</span>
            <div className="file-meta">
              <div className="file-name">{file.name}</div>
              <div className="file-detail">{fmtSize(file.size)}</div>
            </div>
            <button
              className="btn-remove"
              onClick={e => { e.stopPropagation(); onRemove?.(); }}
              title="Remove file"
            >✕</button>
          </div>
        ) : (
          <div className="file-placeholder">
            <span className="upload-arrow">⬆</span>
            <span>{label || 'Click or drag file here'}</span>
            {hint && <span className="file-note">{hint}</span>}
          </div>
        )}
      </div>
      {error && <p className="err-msg" style={{ marginTop: 4 }}>{error}</p>}
    </div>
  );
}
