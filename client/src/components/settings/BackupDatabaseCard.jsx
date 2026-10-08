/** Creates a timestamped copy of the SQLite file on the server (POST /api/data/backup). */
import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import { toast } from 'react-toastify';
import { FiDatabase } from 'react-icons/fi';
import SettingsCard from './SettingsCard';
import { dataService } from '../../services/dataService';
import { formatDateTime } from '../../utils/formatters';

export default function BackupDatabaseCard() {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [lastBackup, setLastBackup] = useState(null);

  async function handleBackup() {
    setIsBackingUp(true);
    try {
      const backup = await dataService.backupDatabase();
      setLastBackup(backup);
      toast.success('Database backup created successfully');
    } catch (error) {
      toast.error(`Unable to back up the database. ${error.message}`);
    } finally {
      setIsBackingUp(false);
    }
  }

  return (
    <SettingsCard
      icon={FiDatabase}
      tone="positive"
      title="Backup Database"
      description="Save a complete copy of the SQLite database in the server's backup folder (database/backups by default)."
    >
      <Button variant="outline-secondary" onClick={handleBackup} disabled={isBackingUp}>
        {isBackingUp ? (
          <Spinner animation="border" size="sm" aria-hidden="true" />
        ) : (
          <FiDatabase aria-hidden="true" />
        )}
        Create Backup
      </Button>
      {lastBackup && (
        <p className="form-text mb-0 mt-2" role="status">
          Saved <strong>{lastBackup.fileName}</strong> in <code>{lastBackup.folder}</code> at{' '}
          {formatDateTime(lastBackup.createdAt)}.
        </p>
      )}
    </SettingsCard>
  );
}
