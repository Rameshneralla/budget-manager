/** Business rules for income records. Shared CRUD workflow: createRecordService.js */
const createRecordService = require('./createRecordService');
const incomeRepository = require('../repositories/incomeRepository');
const { validateIncomeInput } = require('../validators/incomeValidator');
const { assertPaymentMethodExists } = require('./referenceChecks');
const { monthKeyFromDate } = require('../utils/dates');
const { ENTITY_TYPES, INCOME_STATUSES } = require('../constants');

const incomeService = createRecordService({
  entityType: ENTITY_TYPES.INCOME,
  entityLabel: 'Income',
  repository: incomeRepository,
  validateInput: validateIncomeInput,
  statuses: INCOME_STATUSES,
  getMonthKey: (income) => monthKeyFromDate(income.date),
  describe: (income) => income.source,
  checkReferences: (income) => {
    if (income.paymentMethodId) {
      assertPaymentMethodExists(income.paymentMethodId);
    }
  },
  auditedFields: [
    'date',
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
