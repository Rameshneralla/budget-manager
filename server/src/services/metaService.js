/**
 * Reference data the frontend needs to build forms and filters:
 * owner profile, categories, payment methods, statuses and expense types.
 */
const lookupRepository = require('../repositories/lookupRepository');
const userRepository = require('../repositories/userRepository');
const { INCOME_STATUSES, EXPENSE_STATUSES, EXPENSE_TYPES, INCOME_TYPES } = require('../constants');

function getMeta() {
  return {
    owner: userRepository.findOwner(),
    categories: lookupRepository.findAllCategories(),
    paymentMethods: lookupRepository.findAllPaymentMethods(),
    statuses: {
      income: INCOME_STATUSES,
      expense: EXPENSE_STATUSES,
    },
    expenseTypes: EXPENSE_TYPES,
    incomeTypes: INCOME_TYPES,
  };
}

module.exports = { getMeta };
