/** Loading, empty and error states used by every API-driven screen. */
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import { FiAlertCircle, FiInbox, FiRefreshCw } from 'react-icons/fi';

export function LoadingState({ message = 'Loading...', compact = false }) {
  return (
    <div
      className={`state-block${compact ? ' state-block--compact' : ''}`}
      role="status"
      aria-live="polite"
    >
      <Spinner animation="border" variant="primary" aria-hidden="true" />
      <p className="state-block__message">{message}</p>
    </div>
  );
}

export function EmptyState({ title, message, action, icon: Icon = FiInbox, compact = false }) {
  return (
    <div className={`state-block${compact ? ' state-block--compact' : ''}`}>
      <span className="state-block__icon tone-neutral" aria-hidden="true">
        <Icon />
      </span>
      <p className="state-block__title">{title}</p>
      {message && <p className="state-block__message">{message}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', message, onRetry, compact = false }) {
  return (
    <div className={`state-block${compact ? ' state-block--compact' : ''}`} role="alert">
      <span className="state-block__icon tone-negative" aria-hidden="true">
        <FiAlertCircle />
      </span>
      <p className="state-block__title">{title}</p>
      {message && <p className="state-block__message">{message}</p>}
      {onRetry && (
        <Button variant="outline-secondary" size="sm" onClick={onRetry}>
          <FiRefreshCw aria-hidden="true" /> Try again
        </Button>
      )}
    </div>
  );
}
