/**
 * Everything specific to the Expenses page: table columns, filters, form fields,
 * form <-> API conversion and labels. RecordManager does the rest.
 */
import { useMemo } from 'react';
import { FiCheckCircle, FiClock, FiRepeat, FiTrendingDown } from 'react-icons/fi';
import { expenseService } from '../../services/expenseService';
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
  selectFilter,
  statusColumn,
  textColumn,
  toOptions,
} from '../common/records/recordConfigHelpers';

const DEFAULT_EXPENSE_STATUS = 'Paid';
const DEFAULT_EXPENSE_TYPE = 'Regular';
const DEFAULT_PAYMENT_METHOD_NAME = 'Phone Pay';

function describeExpense(expense) {
  return expense.purpose ? `${expense.payee} - ${expense.purpose}` : expense.payee;
}

function buildFormValueConverter(paymentMethods) {
  const defaultPaymentMethod = paymentMethods.find(
    (method) => method.name === DEFAULT_PAYMENT_METHOD_NAME
  );

  return function toFormValues(expense, monthKey) {
    if (!expense) {
      return {
        date: defaultDateForMonth(monthKey),
        categoryId: '',
        payee: '',
        amount: '',
        purpose: '',
        expenseType: DEFAULT_EXPENSE_TYPE,
        paymentMethodId: toInputValue(defaultPaymentMethod?.id),
        reference: '',
        endPeriod: '',
        status: DEFAULT_EXPENSE_STATUS,
        notes: '',
      };
    }
    return {
      date: expense.date,
      categoryId: toInputValue(expense.categoryId),
      payee: expense.payee,
      amount: toInputValue(expense.amount),
      purpose: toInputValue(expense.purpose),
      expenseType: expense.expenseType,
      paymentMethodId: toInputValue(expense.paymentMethodId),
      reference: toInputValue(expense.reference),
      endPeriod: toInputValue(expense.endPeriod),
      status: expense.status,
      notes: toInputValue(expense.notes),
    };
  };
}

function toPayload(values) {
  return {
    date: values.date,
    categoryId: toNullableId(values.categoryId),
    payee: values.payee.trim(),
    amount: Number(values.amount),
    purpose: toNullableText(values.purpose),
    expenseType: values.expenseType,
    paymentMethodId: toNullableId(values.paymentMethodId),
    reference: toNullableText(values.reference),
    endPeriod: toNullableText(values.endPeriod),
    status: values.status,
    notes: toNullableText(values.notes),
  };
}

export function useExpenseConfig() {
  const { meta } = useBudget();

  return useMemo(() => {
    const statuses = meta.statuses.expense;
    const statusOptions = toOptions(statuses);
    const typeOptions = toOptions(meta.expenseTypes);
    const categoryOptions = lookupToOptions(meta.categories);
    const paymentMethodOptions = lookupToOptions(meta.paymentMethods);

    return {
      title: 'Expenses',
      subtitle: 'EMIs, interest, bills and one-time spending',
      singular: 'Expense',
      pluralLabel: 'expenses',
      addLabel: 'Add Expense',
      emptyTitle: () => 'No expenses recorded for this month.',
      emptyMessage: 'Add an expense to start tracking this month.',
      service: expenseService,
      statuses,
      describe: describeExpense,

      columns: [
        dateColumn('date', 'Date'),
        textColumn('category', 'Category', { sortable: true, showInCard: true }),
        textColumn('payee', 'Payee / Name', { sortable: true, primary: true }),
        amountColumn(),
        textColumn('purpose', 'Purpose', { wrap: true }),
        {
          key: 'expenseType',
          label: 'Expense Type',
          sortable: true,
          showInCard: true,
          render: (expense) => <span className="type-badge">{expense.expenseType}</span>,
        },
        textColumn('paymentMethod', 'Payment Method', { sortable: true, showInCard: true }),
        textColumn('reference', 'Reference / Account', { wrap: true, showInCard: true }),
        textColumn('endPeriod', 'Due / End Date', { showInCard: true }),
        statusColumn(),
      ],
      card: {
        title: (expense) => expense.payee,
        subtitle: (expense) =>
          [formatDate(expense.date), expense.purpose].filter(Boolean).join(' · '),
        amount: (expense) => formatCurrency(expense.amount),
      },
      defaultSort: { key: 'date', direction: SORT_DIRECTIONS.ASC },
      // Grouped by category with subtotals by default, like the budget sheet.
      groupBy: {
        label: 'Group by category',
        getGroupLabel: (expense) => expense.category,
        order: meta.categories.map((category) => category.name),
      },

      searchFields: ['payee', 'purpose', 'reference', 'notes'],
      searchLabel: 'Search',
      searchPlaceholder: 'Search name, purpose, reference...',
      filters: [
        selectFilter('categoryId', 'Category', categoryOptions),
        selectFilter('status', 'Status', statusOptions),
        selectFilter('paymentMethodId', 'Payment Method', paymentMethodOptions),
        selectFilter('expenseType', 'Expense Type', typeOptions),
        ...dateRangeFilters('date'),
      ],

      formFields: [
        { name: 'date', label: 'Date', type: 'date', required: true },
        {
          name: 'categoryId',
          label: 'Category',
          type: 'select',
          required: true,
          options: categoryOptions,
        },
        {
          name: 'payee',
          label: 'Payee / Name',
          type: 'text',
          required: true,
          placeholder: 'e.g. House EMI',
        },
        { name: 'amount', label: 'Amount', type: 'amount', required: true },
        { name: 'purpose', label: 'Purpose', type: 'text' },
        {
          name: 'expenseType',
          label: 'Expense Type',
          type: 'select',
          required: true,
          options: typeOptions,
        },
        {
          name: 'paymentMethodId',
          label: 'Payment Method',
          type: 'select',
          required: true,
          options: paymentMethodOptions,
        },
        { name: 'reference', label: 'Reference / Account', type: 'text' },
        {
          name: 'endPeriod',
          label: 'Due / End Date',
          type: 'text',
          maxLength: VALIDATION_LIMITS.MAX_END_PERIOD_LENGTH,
          placeholder: 'e.g. Nov-2027',
          helpText: 'When this commitment ends, e.g. 2038, Jun-2027 or Closed.',
        },
        { name: 'status', label: 'Status', type: 'select', required: true, options: statusOptions },
        {
          name: 'notes',
          label: 'Notes',
          type: 'textarea',
          maxLength: VALIDATION_LIMITS.MAX_NOTES_LENGTH,
        },
      ],
      toFormValues: buildFormValueConverter(meta.paymentMethods),
      toPayload,

      buildSummary: (records) => [
        { label: 'Total Expenses', amount: sumAmounts(records), icon: FiTrendingDown },
        { label: 'Paid', amount: sumAmountsByStatus(records, 'Paid'), icon: FiCheckCircle },
        { label: 'Pending', amount: sumAmountsByStatus(records, 'Pending'), icon: FiClock },
        {
          label: 'Regular Commitments',
          amount: sumAmounts(records.filter((expense) => expense.expenseType === 'Regular')),
          icon: FiRepeat,
        },
      ],
    };
  }, [meta]);
}
