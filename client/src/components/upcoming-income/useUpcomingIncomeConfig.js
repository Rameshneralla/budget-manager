/**
 * Everything specific to the Upcoming Income page: table columns, filters,
 * form fields, form <-> API conversion and labels. RecordManager does the rest.
 */
import { useMemo } from 'react';
import { FiCalendar, FiCheckCircle, FiClock } from 'react-icons/fi';
import { upcomingIncomeService } from '../../services/upcomingIncomeService';
import { useBudget } from '../../context/BudgetContext';
import { VALIDATION_LIMITS } from '../../constants/validation';
import { FUTURE_MONTHS_IN_PICKER, SORT_DIRECTIONS } from '../../constants';
import { formatCurrency, formatDate, formatMonthLabel } from '../../utils/formatters';
import { buildMonthOptions } from '../../utils/months';
import { sumAmounts, sumAmountsByStatus } from '../../utils/tableUtils';
import { toInputValue, toNullableText } from '../../utils/validation';
import {
  amountColumn,
  dateColumn,
  selectFilter,
  statusColumn,
  textColumn,
  toOptions,
} from '../common/records/recordConfigHelpers';

const DEFAULT_UPCOMING_STATUS = 'Expected';

function toFormValues(upcomingIncome, monthKey) {
  if (!upcomingIncome) {
    return {
      month: monthKey,
      expectedDate: '',
      source: '',
      amount: '',
      status: DEFAULT_UPCOMING_STATUS,
      purpose: '',
      notes: '',
    };
  }
  return {
    month: upcomingIncome.month,
    expectedDate: toInputValue(upcomingIncome.expectedDate),
    source: upcomingIncome.source,
    amount: toInputValue(upcomingIncome.amount),
    status: upcomingIncome.status,
    purpose: toInputValue(upcomingIncome.purpose),
    notes: toInputValue(upcomingIncome.notes),
  };
}

function toPayload(values) {
  return {
    month: values.month,
    expectedDate: toNullableText(values.expectedDate),
    source: values.source.trim(),
    amount: Number(values.amount),
    status: values.status,
    purpose: toNullableText(values.purpose),
    notes: toNullableText(values.notes),
  };
}

function validateExpectedDateInMonth(expectedDate, values) {
  if (values.month && !expectedDate.startsWith(values.month)) {
    return 'Expected date must fall within the selected month.';
  }
  return undefined;
}

export function useUpcomingIncomeConfig() {
  const { meta, availableMonths, selectedMonth } = useBudget();

  return useMemo(() => {
    const statuses = meta.statuses.upcomingIncome;
    const statusOptions = toOptions(statuses);
    const monthOptions = buildMonthOptions(
      availableMonths,
      selectedMonth,
      FUTURE_MONTHS_IN_PICKER
    ).map((monthKey) => ({ value: monthKey, label: formatMonthLabel(monthKey) }));

    return {
      title: 'Upcoming Income',
      subtitle: 'Money you expect to receive',
      singular: 'Upcoming income',
      pluralLabel: 'upcoming income',
      addLabel: 'Add Upcoming Income',
      emptyTitle: () => 'No upcoming income available.',
      emptyMessage: 'Record income you are expecting so you can plan ahead.',
      service: upcomingIncomeService,
      statuses,
      describe: (upcomingIncome) => upcomingIncome.source,

      columns: [
        dateColumn('expectedDate', 'Expected Date', { showInCard: true }),
        textColumn('source', 'Source', { sortable: true, primary: true }),
        amountColumn(),
        textColumn('purpose', 'Purpose', { wrap: true, showInCard: true }),
        statusColumn(),
        textColumn('notes', 'Notes', { wrap: true, showInCard: true }),
      ],
      card: {
        title: (upcomingIncome) => upcomingIncome.source,
        subtitle: (upcomingIncome) =>
          upcomingIncome.expectedDate
            ? formatDate(upcomingIncome.expectedDate)
            : formatMonthLabel(upcomingIncome.month),
        amount: (upcomingIncome) => formatCurrency(upcomingIncome.amount),
      },
      defaultSort: { key: 'expectedDate', direction: SORT_DIRECTIONS.ASC },

      searchFields: ['source', 'purpose', 'notes'],
      searchLabel: 'Search',
      searchPlaceholder: 'Search source, purpose, notes...',
      filters: [selectFilter('status', 'Status', statusOptions)],

      formFields: [
        { name: 'month', label: 'Month', type: 'select', required: true, options: monthOptions },
        {
          name: 'expectedDate',
          label: 'Expected Date',
          type: 'date',
          helpText: 'Optional. Leave empty if only the month is known.',
          validate: validateExpectedDateInMonth,
        },
        {
          name: 'source',
          label: 'Source',
          type: 'text',
          required: true,
          placeholder: 'e.g. Loan interest, Bonus',
        },
        { name: 'amount', label: 'Amount', type: 'amount', required: true },
        { name: 'status', label: 'Status', type: 'select', required: true, options: statusOptions },
        { name: 'purpose', label: 'Purpose', type: 'text' },
        {
          name: 'notes',
          label: 'Notes',
          type: 'textarea',
          maxLength: VALIDATION_LIMITS.MAX_NOTES_LENGTH,
        },
      ],
      toFormValues,
      toPayload,

      buildSummary: (records) => [
        { label: 'Total Upcoming', amount: sumAmounts(records), icon: FiCalendar },
        { label: 'Received', amount: sumAmountsByStatus(records, 'Received'), icon: FiCheckCircle },
        {
          label: 'Still Expected',
          amount: sumAmounts(records.filter((record) => record.status !== 'Received')),
          icon: FiClock,
        },
      ],
    };
  }, [meta, availableMonths, selectedMonth]);
}
