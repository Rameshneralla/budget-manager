/**
 * GitHub Pages build only: explains that data is stored in this browser, and
 * (when the database is empty) points to Settings > Import Data.
 */
import { Link } from 'react-router-dom';
import { FiHardDrive, FiUpload } from 'react-icons/fi';
import { IS_LOCAL_MODE } from '../../constants/appMode';
import { ROUTES } from '../../constants';

export default function LocalDataNotice({ isEmpty = false }) {
  if (!IS_LOCAL_MODE) {
    return null;
  }

  if (isEmpty) {
    return (
      <div className="notice notice--primary" role="note">
        <FiUpload aria-hidden="true" className="notice__icon" />
        <div>
          <strong>No data yet.</strong> Load your budget from an export file in{' '}
          <Link to={ROUTES.SETTINGS}>Settings › Import Data</Link>, or start adding records.
        </div>
      </div>
    );
  }

  return (
    <div className="notice" role="note">
      <FiHardDrive aria-hidden="true" className="notice__icon" />
      <div>
        Your data is stored <strong>only in this browser on this device</strong> — it is never
        uploaded. Export regularly as a backup, and use Import to move it to another device.
        Clearing this site&apos;s browser data deletes it.
      </div>
    </div>
  );
}
