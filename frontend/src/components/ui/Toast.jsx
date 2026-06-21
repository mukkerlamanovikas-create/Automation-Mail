import { useState, useEffect } from 'react';
import { toastEmitter } from '../../utils/toastEmitter';

export default function Toast() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const unsub = toastEmitter.subscribe(t => {
      setToasts(prev => [...prev, t]);
      setTimeout(() => setToasts(prev => prev.filter(x => x.id !== t.id)), 4000);
    });
    return unsub;
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast--${t.type}`}>
          <span>{t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
