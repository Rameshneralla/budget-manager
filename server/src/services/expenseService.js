/** Business rules for expense records. Shared CRUD workflow: createRecordService.js */
const createRecordService = require('./createRecordService');
const expenseRepository = require('../repositories/expenseRepository');
const { validateExpenseInput } = require('../validators/expenseValidator');
const { assertCategoryExists, assertPaymentMethodExists } = require('./referenceChecks');
const { monthKeyFromDate } = require('../utils/dates');
const { ENTITY_TYPES, EXPENSE_STATUSES } = require('../constants');

const expenseService = createRecordService({
  entityType: ENTITY_TYPES.EXPENSE,
  entityLabel: 'Expense',
  repository: expenseRepository,
  validateInput: validateExpenseInput,
  statuses: EXPENSE_STATUSES,
  getMonthKey: (expense) => monthKeyFromDate(expense.date),
  describe: (expense) =>
    expense.purpose ? `${expense.payee} - ${expense.purpose}` : expense.payee,
  checkReferences: (expense) => {
    assertCategoryExists(expense.categoryId);
    assertPaymentMethodExists(expense.paymentMethodId);
  },
  auditedFields: [
    'date',
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
