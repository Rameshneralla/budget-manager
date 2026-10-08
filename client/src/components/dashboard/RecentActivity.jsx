/** Latest changes from the audit log (GET /api/activity). */
import { FiActivity, FiEdit2, FiPlus, FiRefreshCw, FiTrash2, FiUpload } from 'react-icons/fi';
import { EmptyState, ErrorState, LoadingState } from '../common/StateBlocks';
import { formatDateTime } from '../../utils/formatters';

const ACTION_APPEARANCE = {
  Created: { icon: FiPlus, tone: 'positive' },
  Updated: { icon: FiEdit2, tone: 'info' },
  'Status Changed': { icon: FiRefreshCw, tone: 'warning' },
  Deleted: { icon: FiTrash2, tone: 'negative' },
  Imported: { icon: FiUpload, tone: 'primary' },
};
const DEFAULT_ACTION_APPEARANCE = { icon: FiActivity, tone: 'neutral' };

export default function RecentActivity({
  activity,
  isLoading,
  error,
  onRetry,
  title = 'Recent Activity',
}) {
  let content;
  if (isLoading && !activity) {
    content = <LoadingState compact message="Loading activity..." />;
  } else if (error) {
    content = <ErrorState compact message={error.message} onRetry={onRetry} />;
  } else if (!activity || activity.length === 0) {
    content = <EmptyState compact icon={FiActivity} title="No activity yet." />;
  } else {
    content = (
      <ul className="activity-list">
        {activity.map((entry) => {
          const { icon: Icon, tone } = ACTION_APPEARANCE[entry.action] ?? DEFAULT_ACTION_APPEARANCE;
          return (
            <li key={entry.id} className="activity-list__item">
              <span className={`activity-list__icon tone-${tone}`} aria-hidden="true">
                <Icon />
              </span>
              <div className="min-w-0">
                <p className="activity-list__summary">
                  <span className="visually-hidden">{entry.action}: </span>
                  {entry.summary}
                </p>
                <time className="activity-list__time" dateTime={entry.createdAt}>
                  {formatDateTime(entry.createdAt)}
                </time>
              </div>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className="panel">
      <div className="panel__header">
        <h2 className="panel__title">{title}</h2>
      </div>
      <div className="panel__body">{content}</div>
    </div>
  );
}
