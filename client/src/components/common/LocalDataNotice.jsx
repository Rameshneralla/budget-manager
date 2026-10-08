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
        Your data is saved in this browser on this device. Turn on{' '}
        <strong>Sync across devices</strong> below to see the same budget on your phone, tablet and
        laptop (stored in your own private GitHub repository - nowhere else). Without sync, clearing
        this site&apos;s browser data deletes it, so Export now and then as a backup.
      </div>
    </div>
  );
}
