/**
 * Restores data from a JSON export (POST /api/data/import).
 * Import REPLACES all budget data, so it always asks for confirmation first.
 */
import { useRef, useState } from 'react';
import Button from 'react-bootstrap/Button';
import { toast } from 'react-toastify';
import { FiUpload } from 'react-icons/fi';
import SettingsCard from './SettingsCard';
import ConfirmDialog from '../common/ConfirmDialog';
import { dataService } from '../../services/dataService';
import { useBudget } from '../../context/BudgetContext';
import { readJsonFile } from '../../utils/fileDownload';
import { pluralize } from '../../utils/formatters';

function describeFieldErrors(fieldErrors) {
  const firstErrors = Object.entries(fieldErrors).slice(0, 3);
  return firstErrors.map(([field, message]) => `${field}: ${message}`).join(' ');
}

export default function ImportDataCard() {
  const { notifyDataChanged } = useBudget();
  const fileInputRef = useRef(null);
  const [pendingImport, setPendingImport] = useState(null); // { fileName, payload }

  async function handleFileSelected(event) {
    const file = event.target.files?.[0];
    event.target.value = ''; // allow choosing the same file again
    if (!file) {
      return;
    }
    try {
      setPendingImport({ fileName: file.name, payload: await readJsonFile(file) });
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function handleConfirmImport() {
    try {
      const counts = await dataService.importData(pendingImport.payload);
      toast.success(
        `Imported ${pluralize(counts.income, 'income record')}, ${pluralize(counts.expenses, 'expense')} and ${pluralize(
          counts.upcomingIncome,
          'upcoming income record'
        )}`
      );
      setPendingImport(null);
      notifyDataChanged();
    } catch (error) {
      toast.error(
        `Unable to import data. ${error.message} ${describeFieldErrors(error.fieldErrors || {})}`
      );
      throw error;
    }
  }

  return (
    <SettingsCard
      icon={FiUpload}
      tone="warning"
      title="Import Data"
      description="Restore from a JSON file created with Export Data. This replaces all current income, expenses and upcoming income."
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="visually-hidden-file"
        onChange={handleFileSelected}
        tabIndex={-1}
        aria-hidden="true"
      />
      <Button variant="outline-secondary" onClick={() => fileInputRef.current?.click()}>
        <FiUpload aria-hidden="true" /> Choose JSON File
      </Button>

      <ConfirmDialog
        show={Boolean(pendingImport)}
        title="Replace All Data?"
        message={`Importing "${pendingImport?.fileName ?? ''}" will replace ALL current budget data. Export a copy first if you may need it. Continue?`}
        confirmLabel="Import and Replace"
        onConfirm={handleConfirmImport}
        onCancel={() => setPendingImport(null)}
      />
    </SettingsCard>
  );
}
