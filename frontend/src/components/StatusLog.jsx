import { useEffect, useRef } from 'react';

const ICON = { success: '✓', error: '✗', info: 'ℹ' };

export default function StatusLog({ logs }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="card log-card">
      <div className="card-header log-header">
        <h3>Activity Log</h3>
        <span className="log-count">{logs.length} event{logs.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="log-body">
        {logs.length === 0 ? (
          <div className="log-empty">Activity will appear here once sending starts…</div>
        ) : (
          logs.map((entry, i) => (
            <div key={i} className={`log-row log-row--${entry.type}`}>
              <span className="log-time">{entry.timestamp}</span>
              <span className={`log-icon log-icon--${entry.type}`}>{ICON[entry.type]}</span>
              <span className="log-msg">{entry.message}</span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
