/** Business rules for income records. Shared CRUD workflow: createRecordService.js */
const createRecordService = require('./createRecordService');
const incomeRepository = require('../repositories/incomeRepository');
const { validateIncomeInput } = require('../validators/incomeValidator');
const { assertPaymentMethodExists } = require('./referenceChecks');
const { budgetMonthKey, todayIsoDate } = require('../utils/dates');
const { ENTITY_TYPES, INCOME_STATUSES, INCOME_RECEIVED_STATUS } = require('../constants');

/**
 * Changing the status from the status menu or bulk actions keeps the actual
 * received date in step: Received -> today (unless already set); otherwise cleared.
 */
function applyIncomeStatusChange(income) {
  if (income.status === INCOME_RECEIVED_STATUS) {
    return { ...income, receivedDate: income.receivedDate || todayIsoDate() };
  }
  return { ...income, receivedDate: null };
}

const incomeService = createRecordService({
  entityType: ENTITY_TYPES.INCOME,
  entityLabel: 'Income',
  repository: incomeRepository,
  validateInput: validateIncomeInput,
  statuses: INCOME_STATUSES,
  // Counted in the month it was received; until then, the month it is due.
  getMonthKey: (income) => budgetMonthKey(income.receivedDate, income.dueDate),
  describe: (income) => income.source,
  checkReferences: (income) => {
    if (income.paymentMethodId) {
      assertPaymentMethodExists(income.paymentMethodId);
    }
  },
  applyStatusChange: applyIncomeStatusChange,
  auditedFields: [
    'incomeType',
    'dueDate',
    'receivedDate',
    'source',
    'amount',
    'purpose',
    'status',
    'paymentMethod',
    'reference',
    'notes',
  ],
});

module.exports = incomeService;
