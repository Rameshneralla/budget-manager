/** Controllers for the three record types, built from the shared controller factory. */
const createRecordController = require('./createRecordController');
const incomeService = require('../services/incomeService');
const expenseService = require('../services/expenseService');
const upcomingIncomeService = require('../services/upcomingIncomeService');

module.exports = {
  incomeController: createRecordController(incomeService),
  expenseController: createRecordController(expenseService),
  upcomingIncomeController: createRecordController(upcomingIncomeService),
};
