/**
 * Building blocks for the record configs (income, expenses, upcoming income).
 * Each helper returns a plain column / filter / option definition consumed by
 * RecordManager, DataTable, RecordCardList, FilterBar and useTableState.
 */
import { displayText, formatCurrency, formatDate } from '../../../utils/formatters';

/* --------------------------------- Options -------------------------------- */

/** ['Paid', 'Pending'] -> [{ value: 'Paid', label: 'Paid' }, ...] */
export function toOptions(values) {
  return values.map((value) => ({ value, label: value }));
}

/** [{ id: 1, name: 'Cash' }] -> [{ value: '1', label: 'Cash' }] (form values are strings) */
export function lookupToOptions(rows) {
  return rows.map((row) => ({ value: String(row.id), label: row.name }));
}

/* --------------------------------- Columns -------------------------------- */

export function dateColumn(key, label, { showInCard = false } = {}) {
  return {
    key,
    label,
    sortable: true,
    showInCard,
    className: 'tabular',
    render: (record) => formatDate(record[key]),
  };
}

export function textColumn(
  key,
  label,
  { sortable = false, primary = false, wrap = false, showInCard = false } = {}
) {
  const classNames = [
    primary && 'cell-primary',
    wrap && 'cell-wrap',
    !primary && 'cell-muted',
  ].filter(Boolean);
  return {
    key,
    label,
    sortable,
    showInCard,
    className: classNames.join(' '),
    render: (record) => displayText(record[key]),
  };
}

export function amountColumn() {
  return {
    key: 'amount',
    label: 'Amount',
    sortable: true,
    className: 'amount text-end fw-semibold',
    headerClassName: 'text-end',
    render: (record) => formatCurrency(record.amount),
  };
}

/** Rendered as an interactive StatusMenu by RecordManager. */
export function statusColumn() {
  return { key: 'status', label: 'Status', sortable: true, render: (record) => record.status };
}

/* --------------------------------- Filters -------------------------------- */

export function selectFilter(key, label, options, getValue = (record) => record[key]) {
  return {
    key,
    label,
    type: 'select',
    options,
    matches: (record, value) => String(getValue(record) ?? '') === String(value),
  };
}

/** "From" / "To" date filters on a 'YYYY-MM-DD' field (string comparison is safe for ISO dates). */
export function dateRangeFilters(field) {
  return [
    {
      key: `${field}From`,
      label: 'From date',
      type: 'date',
      matches: (record, value) => Boolean(record[field]) && record[field] >= value,
    },
    {
      key: `${field}To`,
      label: 'To date',
      type: 'date',
      matches: (record, value) => Boolean(record[field]) && record[field] <= value,
    },
  ];
}
