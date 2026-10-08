/**
 * Complete management screen for one record type: header with month selector
 * and Add button, summary totals, search/filters, bulk actions, table (or
 * mobile cards), pagination, add/edit modal and delete confirmations.
 *
 * Income, Expenses and Upcoming Income pages only pass a `config` object that
 * describes their columns, filters, form fields and labels - see e.g.
 * components/income/useIncomeConfig.js. Shared behaviour lives here once.
 */
import { useMemo, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { FiPlus } from 'react-icons/fi';
import PageHeader from '../PageHeader';
import MonthSelector from '../MonthSelector';
import SummaryStrip from '../SummaryStrip';
import StatusMenu from '../StatusMenu';
import ConfirmDialog from '../ConfirmDialog';
import RecordFormModal from '../form/RecordFormModal';
import FilterBar from '../table/FilterBar';
import BulkActionsBar from '../table/BulkActionsBar';
import TablePagination from '../table/TablePagination';
import RecordListBody from './RecordListBody';
import { useBudget } from '../../../context/BudgetContext';
import { useApiData } from '../../../hooks/useApiData';
import { useTableState } from '../../../hooks/useTableState';
import { useSelection } from '../../../hooks/useSelection';
import { useRecordActions } from '../../../hooks/useRecordActions';
import { formatMonthLabel, pluralize } from '../../../utils/formatters';
import { groupRecords } from '../../../utils/tableUtils';

const EMPTY_RECORDS = [];

export default function RecordManager({ config }) {
  const { selectedMonth, dataVersion } = useBudget();
  const monthLabel = formatMonthLabel(selectedMonth);

  const { data, isLoading, error, reload } = useApiData(
    () => config.service.listByMonth(selectedMonth),
    [config.service, selectedMonth, dataVersion]
  );
  const records = data ?? EMPTY_RECORDS;

  const table = useTableState(records, config);

  // Optional grouping (config.groupBy), e.g. expenses by category with subtotals.
  const [isGrouped, setIsGrouped] = useState(Boolean(config.groupBy));
  const groups = useMemo(() => {
    if (!isGrouped || !config.groupBy) {
      return null;
    }
    const { getGroupLabel, order } = config.groupBy;
    return groupRecords(table.pageRecords, getGroupLabel, order);
  }, [isGrouped, config.groupBy, table.pageRecords]);
  const visibleIds = useMemo(
    () => table.filteredRecords.map((record) => record.id),
    [table.filteredRecords]
  );
  const selection = useSelection(visibleIds);
  const actions = useRecordActions(config.service, {
    singular: config.singular,
    describe: config.describe,
  });

  // Add / edit modal. `formKey` remounts the form so each opening starts fresh.
  const [form, setForm] = useState({ isOpen: false, record: null, key: 0 });
  // Pending delete confirmation: { record } for one, { ids } for bulk.
  const [pendingDelete, setPendingDelete] = useState(null);

  const openForm = (record = null) =>
    setForm((current) => ({ isOpen: true, record, key: current.key + 1 }));
  const closeForm = () => setForm((current) => ({ ...current, isOpen: false }));

  async function handleSubmit(values) {
    await actions.save(config.toPayload(values), form.record?.id);
    closeForm();
  }

  async function handleConfirmDelete() {
    if (pendingDelete.record) {
      await actions.remove(pendingDelete.record);
    } else {
      await actions.bulkRemove(pendingDelete.ids);
      selection.clear();
    }
    setPendingDelete(null);
  }

  async function handleBulkStatus(status) {
    try {
      await actions.bulkChangeStatus([...selection.selectedIds], status);
      selection.clear();
    } catch {
      // Toast already shown; keep the selection so the user can retry.
    }
  }

  // The status cell is interactive: pick a new status straight from the badge.
  const columns = useMemo(
    () =>
      config.columns.map((column) =>
        column.key === 'status'
          ? {
              ...column,
              render: (record) => (
                <StatusMenu
                  status={record.status}
                  statuses={config.statuses}
                  recordLabel={config.describe(record)}
                  onChange={(status) => actions.changeStatus(record, status).catch(() => {})}
                />
              ),
            }
          : column
      ),
    [config, actions]
  );

  const deleteMessage = pendingDelete?.record
    ? `Are you sure you want to delete "${config.describe(pendingDelete.record)}"? This cannot be undone.`
    : `Are you sure you want to delete ${pluralize(pendingDelete?.ids.length ?? 0, 'selected transaction')}?`;

  return (
    <>
      <PageHeader title={config.title} subtitle={`${config.subtitle} · ${monthLabel}`}>
        <MonthSelector />
        <Button variant="primary" onClick={() => openForm()}>
          <FiPlus aria-hidden="true" /> {config.addLabel}
        </Button>
      </PageHeader>

      <SummaryStrip items={config.buildSummary(records)} />

      <section className="records-panel" aria-label={`${config.title} records`}>
        <FilterBar
          searchLabel={config.searchLabel}
          searchPlaceholder={config.searchPlaceholder}
          table={table}
          filters={config.filters}
        >
          {config.groupBy && (
            <Form.Check
              type="switch"
              id="group-records"
              className="filter-bar__toggle"
              label={config.groupBy.label}
              checked={isGrouped}
              onChange={(event) => setIsGrouped(event.target.checked)}
            />
          )}
        </FilterBar>

        {selection.selectedCount > 0 && (
          <BulkActionsBar
            selectedCount={selection.selectedCount}
            statuses={config.statuses}
            onChangeStatus={handleBulkStatus}
            onDelete={() => setPendingDelete({ ids: [...selection.selectedIds] })}
            onClear={selection.clear}
          />
        )}

        <RecordListBody
          config={config}
          monthLabel={monthLabel}
          isLoading={isLoading}
          error={error}
          onRetry={reload}
          totalRecords={records.length}
          table={table}
          columns={columns}
          groups={groups}
          selection={selection}
          onAdd={() => openForm()}
          onEdit={openForm}
          onDelete={(record) => setPendingDelete({ record })}
        />

        {table.filteredRecords.length > 0 && (
          <TablePagination
            page={table.page}
            totalPages={table.totalPages}
            pageSize={table.pageSize}
            totalRecords={table.filteredRecords.length}
            onPageChange={table.setPage}
            onPageSizeChange={table.setPageSize}
          />
        )}
      </section>

      <RecordFormModal
        key={form.key}
        show={form.isOpen}
        title={form.record ? `Edit ${config.singular}` : config.addLabel}
        fields={config.formFields}
        initialValues={config.toFormValues(form.record, selectedMonth)}
        onSubmit={handleSubmit}
        onHide={closeForm}
      />

      <ConfirmDialog
        show={Boolean(pendingDelete)}
        title={pendingDelete?.record ? 'Delete Transaction?' : 'Delete Selected Transactions?'}
        message={deleteMessage}
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
