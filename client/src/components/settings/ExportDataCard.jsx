/** Downloads every record as a JSON file (GET /api/data/export). */
import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import { toast } from 'react-toastify';
import { FiDownload } from 'react-icons/fi';
import SettingsCard from './SettingsCard';
import { dataService } from '../../services/dataService';
import { downloadJson } from '../../utils/fileDownload';
import { toIsoDate } from '../../utils/months';

export default function ExportDataCard() {
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport() {
    setIsExporting(true);
    try {
      const exported = await dataService.exportData();
      downloadJson(exported, `budget-manager-export-${toIsoDate(new Date())}.json`);
      toast.success('Data exported successfully');
    } catch (error) {
      toast.error(`Unable to export data. ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <SettingsCard
      icon={FiDownload}
      tone="primary"
      title="Export Data"
      description="Download all income, expenses and upcoming income as a JSON file. Keep it as a backup or to move your data to another computer."
    >
      <Button variant="primary" onClick={handleExport} disabled={isExporting}>
        {isExporting ? (
          <Spinner animation="border" size="sm" aria-hidden="true" />
        ) : (
          <FiDownload aria-hidden="true" />
        )}
        Export JSON
      </Button>
    </SettingsCard>
  );
}
