/**
 * Small cloud icon in the header showing the sync state (GitHub Pages build,
 * once sync is set up). Clicking it opens Settings.
 */
import { useNavigate } from 'react-router-dom';
import { FiAlertTriangle, FiCloud, FiCloudOff, FiRefreshCw } from 'react-icons/fi';
import { useSyncStatus } from '../../hooks/useSyncStatus';
import { ROUTES } from '../../constants';

const APPEARANCE = {
  syncing: { icon: FiRefreshCw, label: 'Syncing...', className: 'sync-indicator--syncing' },
  offline: { icon: FiCloudOff, label: 'Offline - changes will sync later', className: '' },
  conflict: {
    icon: FiAlertTriangle,
    label: 'Sync needs your choice',
    className: 'sync-indicator--alert',
  },
  error: { icon: FiAlertTriangle, label: 'Sync problem', className: 'sync-indicator--alert' },
};
const DEFAULT_APPEARANCE = { icon: FiCloud, label: 'Synced', className: 'sync-indicator--ok' };

export default function SyncIndicator() {
  const { status } = useSyncStatus();
  const navigate = useNavigate();

  if (!status?.configured) {
    return null;
  }
  const { icon: Icon, label, className } = APPEARANCE[status.state] ?? DEFAULT_APPEARANCE;
  const title = status.message ? `${label}: ${status.message}` : label;

  return (
    <button
      type="button"
      className={`icon-button icon-button--bordered sync-indicator ${className}`.trim()}
      onClick={() => navigate(ROUTES.SETTINGS)}
      aria-label={`Sync status: ${title}`}
      title={title}
    >
      <Icon aria-hidden="true" />
    </button>
  );
}
