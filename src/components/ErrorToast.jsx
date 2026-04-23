export function ErrorToast({ message, onRetry, actions }) {
  return (
    <div className="error-toast" role="alert">
      <span className="error-toast-icon" aria-hidden="true">!</span>
      <div className="error-toast-body">
        <p className="error-toast-msg">{message}</p>
        <div className="error-toast-actions">
          {onRetry && (
            <button className="error-toast-retry" type="button" onClick={onRetry}>
              Retry
            </button>
          )}
          {actions}
        </div>
      </div>
    </div>
  );
}
