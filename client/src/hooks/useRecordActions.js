/**
 * Create / update / delete / status actions for one record type, with toast
 * notifications and an automatic app-wide refresh (dashboard, tables, months).
 *
 * Every action re-throws on failure so callers (e.g. forms) can react,
 * but the user always sees a toast either way.
 */
import { useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import { useBudget } from '../context/BudgetContext';
import { formatMonthLabel, pluralize } from '../utils/formatters';

/**
 * @param {object}   service       from services/createRecordService.js
 * @param {object}   labels
 * @param {string}   labels.singular   e.g. 'Income'
 * @param {Function} labels.describe   (record) => 'House Rent'
 */
export function useRecordActions(service, { singular, describe }) {
  const { notifyDataChanged, selectedMonth } = useBudget();

  const run = useCallback(
    async (action, successMessage, failureMessage) => {
      try {
        const result = await action();
        toast.success(
          typeof successMessage === 'function' ? successMessage(result) : successMessage
        );
        // Records count in the month they were paid / received (else the due month),
        // so a save can move one to another month.
        if (result?.month && selectedMonth && result.month !== selectedMonth) {
          toast.info(`${describe(result)} now appears under ${formatMonthLabel(result.month)}.`);
        }
        notifyDataChanged();
        return result;
      } catch (error) {
        toast.error(error.message ? `${failureMessage} ${error.message}` : failureMessage);
        throw error;
      }
    },
    [notifyDataChanged, selectedMonth, describe]
  );

  return useMemo(
    () => ({
      save: (payload, existingId) =>
        existingId
          ? run(
              () => service.update(existingId, payload),
              `${singular} updated successfully`,
              'Unable to save transaction.'
            )
          : run(
              () => service.create(payload),
              `${singular} added successfully`,
              'Unable to save transaction.'
            ),

      changeStatus: (record, status) =>
        run(
          () => service.changeStatus(record.id, status),
          `${describe(record)} status changed to ${status}`,
          'Unable to change status.'
        ),

      bulkChangeStatus: (ids, status) =>
        run(
          () => service.bulkChangeStatus(ids, status),
          (result) => `${pluralize(result.updatedCount, 'transaction')} updated successfully`,
          'Unable to update the selected transactions.'
        ),

      remove: (record) =>
        run(
          () => service.remove(record.id),
          `${singular} deleted successfully`,
          'Unable to delete transaction.'
        ),

      bulkRemove: (ids) =>
        run(
          () => service.bulkRemove(ids),
          (result) => `${pluralize(result.deletedCount, 'transaction')} deleted successfully`,
          'Unable to delete the selected transactions.'
        ),
    }),
    [run, service, singular, describe]
  );
}
