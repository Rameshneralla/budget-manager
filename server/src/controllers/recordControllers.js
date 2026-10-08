/** Controllers for the two record types, built from the shared controller factory. */
const createRecordController = require('./createRecordController');
const incomeService = require('../services/incomeService');
const expenseService = require('../services/expenseService');

module.exports = {
  incomeController: createRecordController(incomeService),
  expenseController: createRecordController(expenseService),
};
