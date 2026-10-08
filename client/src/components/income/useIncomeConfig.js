/**
 * Everything specific to the Income page: table columns, filters, form fields,
 * form <-> API conversion and labels. RecordManager does the rest.
 *
 * Income has three types (Salary, House Rent, Other Income) and is grouped by
 * them. "Other Income" uses a short form: Income Date, Income From, Amount and
 * Income By (how it was paid).
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
const OTHER_INCOME = 'Other Income';

/** How income can arrive, in this order (names of payment methods from the server). */
const INCOME_PAYMENT_METHODS = ['UPI', 'Phone Pay', 'GPay', 'Paytm', 'Bank Transfer', 'Cash'];

const isOther = (values) => values.incomeType === OTHER_INCOME;
const hasType = (values) => values.incomeType !== '';
const isSalaryOrRent = (values) => hasType(values) && !isOther(values);

function toFormValues(income, monthKey) {
  if (!income) {
    return {
      incomeType: '',
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
    incomeType: income.incomeType,
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
  const isReceived = values.status === RECEIVED_STATUS;
  // Other income has one date: the day it came in (also its received date once Received).
  const receivedDate = isOther(values)
    ? isReceived
      ? values.dueDate
      : null
    : toNullableText(values.receivedDate);

  return {
    incomeType: values.incomeType,
    dueDate: values.dueDate,
    receivedDate,
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
    const typeOptions = toOptions(meta.incomeTypes);
    const incomePaymentOptions = lookupToOptions(
      INCOME_PAYMENT_METHODS.map((name) =>
        meta.paymentMethods.find((method) => method.name === name)
      ).filter(Boolean)
    );

    return {
      title: 'Income',
      subtitle: 'Salary, house rent and other income - received or still expected',
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
        textColumn('incomeType', 'Type', { sortable: true, showInCard: true }),
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

      groupBy: {
        label: 'Group by type',
        getGroupLabel: (income) => income.incomeType,
        order: meta.incomeTypes,
        // Shown on the collapsed heading, e.g. '1 expected'.
        outstandingStatus: EXPECTED_STATUS,
        outstandingLabel: 'expected',
      },

      searchFields: ['source', 'purpose', 'reference', 'notes'],
      searchLabel: 'Search',
      searchPlaceholder: 'Search source, purpose, reference...',
      filters: [
        selectFilter('incomeType', 'Type', typeOptions),
        selectFilter('status', 'Status', statusOptions),
        ...dateRangeFilters('dueDate'),
      ],

      // Choose the type first; the other fields then appear (fewer for Other Income).
      formFields: [
        {
          name: 'incomeType',
          label: 'Income Type',
          type: 'select',
          required: true,
          options: typeOptions,
          placeholder: 'Select type...',
        },
        {
          name: 'dueDate',
          label: (values) => (isOther(values) ? 'Income Date' : 'Due Date'),
          type: 'date',
          required: true,
          visible: hasType,
        },
        {
          name: 'source',
          label: (values) => (isOther(values) ? 'Income From' : 'Source'),
          type: 'text',
          required: true,
          visible: hasType,
          placeholder: (values) =>
            isOther(values)
              ? 'e.g. Ravi (interest), Bonus'
              : 'e.g. Salary, House Rent - ground floor',
        },
        { name: 'amount', label: 'Amount', type: 'amount', required: true, visible: hasType },
        {
          name: 'paymentMethodId',
          label: (values) => (isOther(values) ? 'Income By' : 'Payment Method'),
          type: 'select',
          required: isOther,
          visible: hasType,
          options: incomePaymentOptions,
        },
        {
          name: 'status',
          label: 'Status',
          type: 'select',
          required: true,
          visible: hasType,
          options: statusOptions,
          helpText: 'Expected = not received yet. Change it to Received when the money arrives.',
        },
        {
          name: 'receivedDate',
          label: 'Actual Received Date',
          type: 'date',
          visible: isSalaryOrRent,
          helpText:
            'When the money arrived (today when marked Received). The income counts in this month.',
          validate: onlyWithStatus([RECEIVED_STATUS], 'Actual received date'),
        },
        { name: 'purpose', label: 'Purpose', type: 'text', visible: isSalaryOrRent },
        { name: 'reference', label: 'Reference', type: 'text', visible: isSalaryOrRent },
        {
          name: 'notes',
          label: 'Notes',
          type: 'textarea',
          visible: hasType,
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
