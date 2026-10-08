/** Validation rules for an expense record (create and full update). */
const FieldValidator = require('./FieldValidator');
const {
  EXPENSE_STATUSES,
  EXPENSE_SETTLED_STATUSES,
  EXPENSE_TYPES,
  LIMITS,
} = require('../constants');

function validateExpenseInput(body) {
  const v = new FieldValidator(body);

  const expense = {
    dueDate: v.isoDate('dueDate', 'Due date'),
    paidDate: v.isoDate('paidDate', 'Actual paid date', { required: false }),
    categoryId: v.id('categoryId', 'Category'),
    payee: v.requiredText('payee', 'Payee / Name'),
    amount: v.amount('amount'),
    purpose: v.optionalText('purpose', 'Purpose'),
    expenseType: v.oneOf('expenseType', 'Expense type', EXPENSE_TYPES),
    paymentMethodId: v.id('paymentMethodId', 'Payment method'),
    reference: v.optionalText('reference', 'Reference / Account'),
    endPeriod: v.optionalText('endPeriod', 'End date', 50),
    status: v.oneOf('status', 'Status', EXPENSE_STATUSES),
    notes: v.optionalText('notes', 'Notes', LIMITS.MAX_NOTES_LENGTH),
  };

  if (expense.paidDate && expense.status && !EXPENSE_SETTLED_STATUSES.includes(expense.status)) {
    v.addError(
      'paidDate',
      `Actual paid date can only be set when the status is ${EXPENSE_SETTLED_STATUSES.join(' or ')}.`
    );
  }

  v.throwIfInvalid();
  return expense;
}

module.exports = { validateExpenseInput };
