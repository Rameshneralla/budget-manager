/**
 * Everything specific to the Income page: table columns, filters, form fields,
 * form <-> API conversion and labels. RecordManager does the rest.
 *
 * To add an income field: add it to the server validator/repository, then add
 * a column and/or form field here.
 */
import { useMemo } from 'react';
import { FiCalendar, FiCheckCircle, FiTrendingUp } from 'react-icons/fi';
import { incomeService } from '../../services/incomeService';
import { useBudget } from '../../context/BudgetContext';
import { VALIDATION_LIMITS } from '../../constants/validation';
import { SORT_DIRECTIONS } from '../../constants';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { defaultDateForMonth } from '../../utils/months';
import { sumAmounts, sumAmountsByStatus } from '../../utils/tableUtils';
import { toInputValue, toNullableId, toNullableText } from '../../utils/validation';
import {
  amountColumn,
  dateColumn,
  dateRangeFilters,
  lookupToOptions,
  onlyWithStatus,
  selectFilter,
  statusColumn,
  textColumn,
  toOptions,
} from '../common/records/recordConfigHelpers';

const RECEIVED_STATUS = 'Received';
const EXPECTED_STATUS = 'Expected';
const DEFAULT_INCOME_STATUS = RECEIVED_STATUS;

function toFormValues(income, monthKey) {
  if (!income) {
    return {
      dueDate: defaultDateForMonth(monthKey),
      receivedDate: '',
      source: '',
      amount: '',
      status: DEFAULT_INCOME_STATUS,
      paymentMethodId: '',
      purpose: '',
      reference: '',
      notes: '',
    };
  }
  return {
    dueDate: income.dueDate,
    receivedDate: toInputValue(income.receivedDate),
    source: income.source,
    amount: toInputValue(income.amount),
    status: income.status,
    paymentMethodId: toInputValue(income.paymentMethodId),
    purpose: toInputValue(income.purpose),
    reference: toInputValue(income.reference),
    notes: toInputValue(income.notes),
  };
}

function toPayload(values) {
  return {
    dueDate: values.dueDate,
    receivedDate: toNullableText(values.receivedDate),
    source: values.source.trim(),
    amount: Number(values.amount),
    status: values.status,
    paymentMethodId: toNullableId(values.paymentMethodId),
    purpose: toNullableText(values.purpose),
    reference: toNullableText(values.reference),
    notes: toNullableText(values.notes),
  };
}

export function useIncomeConfig() {
  const { meta } = useBudget();

  return useMemo(() => {
    const statuses = meta.statuses.income;
    const statusOptions = toOptions(statuses);
    const paymentMethodOptions = lookupToOptions(meta.paymentMethods);

    return {
      title: 'Income',
      subtitle: 'Salary, rent and other income - received or still expected',
      singular: 'Income',
      pluralLabel: 'income records',
      addLabel: 'Add Income',
      emptyTitle: (monthLabel) => `No income records found for ${monthLabel}.`,
      emptyMessage: 'Add your first income record for this month.',
      service: incomeService,
      statuses,
      describe: (income) => income.source,

      columns: [
        dateColumn('dueDate', 'Due Date'),
        textColumn('source', 'Source', { sortable: true, primary: true }),
        amountColumn(),
        dateColumn('receivedDate', 'Received Date', { showInCard: true }),
        textColumn('purpose', 'Purpose', { wrap: true, showInCard: true }),
        statusColumn(),
        textColumn('paymentMethod', 'Payment Method', { sortable: true, showInCard: true }),
        textColumn('reference', 'Reference', { wrap: true, showInCard: true }),
        textColumn('notes', 'Notes', { wrap: true, showInCard: true }),
      ],
      card: {
        title: (income) => income.source,
        subtitle: (income) => `Due ${formatDate(income.dueDate)}`,
        amount: (income) => formatCurrency(income.amount),
      },
      defaultSort: { key: 'dueDate', direction: SORT_DIRECTIONS.ASC },

      searchFields: ['source', 'purpose', 'reference', 'notes'],
      searchLabel: 'Search',
      searchPlaceholder: 'Search source, purpose, reference...',
      filters: [selectFilter('status', 'Status', statusOptions), ...dateRangeFilters('dueDate')],

      formFields: [
        { name: 'dueDate', label: 'Due Date', type: 'date', required: true },
        {
          name: 'source',
          label: 'Source',
          type: 'text',
          required: true,
          placeholder: 'e.g. Salary, House Rent',
        },
        { name: 'amount', label: 'Amount', type: 'amount', required: true },
        {
          name: 'status',
          label: 'Status',
          type: 'select',
          required: true,
          options: statusOptions,
          helpText: 'Expected = not received yet. Change it to Received when the money arrives.',
        },
        {
          name: 'receivedDate',
          label: 'Actual Received Date',
          type: 'date',
          helpText: 'When the money arrived. Filled in automatically when marked Received.',
          validate: onlyWithStatus([RECEIVED_STATUS], 'Actual received date'),
        },
        {
          name: 'paymentMethodId',
          label: 'Payment Method',
          type: 'select',
          options: paymentMethodOptions,
        },
        { name: 'purpose', label: 'Purpose', type: 'text' },
        { name: 'reference', label: 'Reference', type: 'text' },
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
        { label: 'Total Income', amount: sumAmounts(records), icon: FiTrendingUp },
        {
          label: 'Received',
          amount: sumAmountsByStatus(records, RECEIVED_STATUS),
          icon: FiCheckCircle,
        },
        {
          label: 'Expected',
          amount: sumAmountsByStatus(records, EXPECTED_STATUS),
          icon: FiCalendar,
        },
      ],
    };
  }, [meta]);
}
