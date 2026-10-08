/** Business rules for expense records. Shared CRUD workflow: createRecordService.js */
const createRecordService = require('./createRecordService');
const expenseRepository = require('../repositories/expenseRepository');
const { validateExpenseInput } = require('../validators/expenseValidator');
const { assertCategoryExists, assertPaymentMethodExists } = require('./referenceChecks');
const { monthKeyFromDate, todayIsoDate } = require('../utils/dates');
const {
  ENTITY_TYPES,
  EXPENSE_STATUSES,
  EXPENSE_PAID_STATUS,
  EXPENSE_SETTLED_STATUSES,
} = require('../constants');

/**
 * Status menu / bulk actions keep the actual paid date in step:
 * Paid -> today (unless already set), Closed -> unchanged, Pending -> cleared.
 */
function applyExpenseStatusChange(expense) {
  if (expense.status === EXPENSE_PAID_STATUS) {
    return { ...expense, paidDate: expense.paidDate || todayIsoDate() };
  }
  if (EXPENSE_SETTLED_STATUSES.includes(expense.status)) {
    return expense;
  }
  return { ...expense, paidDate: null };
}

const expenseService = createRecordService({
  entityType: ENTITY_TYPES.EXPENSE,
  entityLabel: 'Expense',
  repository: expenseRepository,
  validateInput: validateExpenseInput,
  statuses: EXPENSE_STATUSES,
  // The budget month is the month the expense is due in.
  getMonthKey: (expense) => monthKeyFromDate(expense.dueDate),
  describe: (expense) =>
    expense.purpose ? `${expense.payee} - ${expense.purpose}` : expense.payee,
  checkReferences: (expense) => {
    assertCategoryExists(expense.categoryId);
    assertPaymentMethodExists(expense.paymentMethodId);
  },
  applyStatusChange: applyExpenseStatusChange,
  auditedFields: [
    'dueDate',
    'paidDate',
    'category',
    'payee',
    'amount',
    'purpose',
    'expenseType',
    'paymentMethod',
    'reference',
    'endPeriod',
    'status',
    'notes',
  ],
});

module.exports = expenseService;
