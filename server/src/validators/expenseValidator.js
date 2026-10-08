/** Validation rules for an expense record (create and full update). */
const FieldValidator = require('./FieldValidator');
const { EXPENSE_STATUSES, EXPENSE_TYPES, LIMITS } = require('../constants');

function validateExpenseInput(body) {
  const v = new FieldValidator(body);

  const expense = {
    date: v.isoDate('date', 'Date'),
    categoryId: v.id('categoryId', 'Category'),
    payee: v.requiredText('payee', 'Payee / Name'),
    amount: v.amount('amount'),
    purpose: v.optionalText('purpose', 'Purpose'),
    expenseType: v.oneOf('expenseType', 'Expense type', EXPENSE_TYPES),
    paymentMethodId: v.id('paymentMethodId', 'Payment method'),
    reference: v.optionalText('reference', 'Reference / Account'),
    endPeriod: v.optionalText('endPeriod', 'Due / End date', 50),
    status: v.oneOf('status', 'Status', EXPENSE_STATUSES),
    notes: v.optionalText('notes', 'Notes', LIMITS.MAX_NOTES_LENGTH),
  };

  v.throwIfInvalid();
  return expense;
}

module.exports = { validateExpenseInput };
