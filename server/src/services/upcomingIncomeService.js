/** Business rules for upcoming (expected) income. Shared CRUD workflow: createRecordService.js */
const createRecordService = require('./createRecordService');
const upcomingIncomeRepository = require('../repositories/upcomingIncomeRepository');
const { validateUpcomingIncomeInput } = require('../validators/upcomingIncomeValidator');
const { syncIncomeWithUpcoming } = require('./upcomingIncomeSync');
const { ENTITY_TYPES, UPCOMING_INCOME_STATUSES } = require('../constants');

const upcomingIncomeService = createRecordService({
  entityType: ENTITY_TYPES.UPCOMING_INCOME,
  entityLabel: 'Upcoming income',
  repository: upcomingIncomeRepository,
  validateInput: validateUpcomingIncomeInput,
  statuses: UPCOMING_INCOME_STATUSES,
  getMonthKey: (upcomingIncome) => upcomingIncome.month,
  describe: (upcomingIncome) => upcomingIncome.source,
  // Marking it Received adds it to Income (and so to the dashboard) - see upcomingIncomeSync.js
  afterWrite: syncIncomeWithUpcoming,
  auditedFields: ['month', 'expectedDate', 'source', 'amount', 'purpose', 'status', 'notes'],
});

module.exports = upcomingIncomeService;
