export default function ProgressTracker({
  total,
  sent,
  failed,
  currentEmail,
  currentIndex,
  countdown,
  isRunning,
  isComplete,
  onCancel,
  onReset,
}) {
  const done = sent + failed;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const pending = total - done;

  return (
    <div className="card progress-card">
      <div className="card-header">
        <h2>{isComplete ? 'Campaign Complete' : 'Sending in Progress…'}</h2>
        <p className="card-subtitle">
          {isComplete
            ? `Finished sending ${total} email${total !== 1 ? 's' : ''}`
            : `Email ${currentIndex} of ${total}`}
        </p>
      </div>

      {/* Progress bar */}
      <div className="progress-wrap">
        <div className="progress-bar">
          <div
            className={`progress-fill ${isComplete && failed === 0 ? 'progress-fill--success' : ''}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="progress-pct">{pct}%</span>
      </div>

      {/* Stats grid */}
      <div className="stats-grid">
        <div className="stat stat--total">
          <div className="stat-value">{total}</div>
          <div className="stat-label">Total</div>
        </div>
        <div className="stat stat--sent">
          <div className="stat-value">{sent}</div>
          <div className="stat-label">Sent</div>
        </div>
        <div className="stat stat--failed">
          <div className="stat-value">{failed}</div>
          <div className="stat-label">Failed</div>
        </div>
        <div className="stat stat--pending">
          <div className="stat-value">{pending}</div>
          <div className="stat-label">Pending</div>
        </div>
      </div>

      {/* Status line */}
      <div className="status-line">
        {isRunning && currentEmail && (
          <div className="status-sending">
            <span className="spinner" />
            <span>Sending to <strong>{currentEmail}</strong></span>
          </div>
        )}
        {isRunning && countdown > 0 && (
          <div className="status-countdown">
            <span className="countdown-icon">&#9201;</span>
            <span>Next email in <strong>{countdown}s</strong>…</span>
          </div>
        )}
        {isComplete && failed === 0 && (
          <div className="status-complete status-complete--ok">
            &#10003;&nbsp; All {sent} emails delivered successfully!
          </div>
        )}
        {isComplete && failed > 0 && (
          <div className="status-complete status-complete--warn">
            &#9888;&nbsp; Done — {sent} sent, {failed} failed. Check the activity log below.
          </div>
        )}
      </div>

      <div className="progress-actions">
        {isRunning && (
          <button className="btn btn-danger" onClick={onCancel}>
            &#9632;&nbsp; Stop Sending
          </button>
        )}
        {isComplete && (
          <button className="btn btn-primary" onClick={onReset}>
            &#8635;&nbsp; New Campaign
          </button>
        )}
      </div>
    </div>
  );
}
