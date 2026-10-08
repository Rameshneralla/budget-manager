/** Validation rules for an income record (create and full update). */
const FieldValidator = require('./FieldValidator');
const { INCOME_STATUSES, INCOME_TYPES, INCOME_RECEIVED_STATUS, LIMITS } = require('../constants');

function validateIncomeInput(body) {
  const v = new FieldValidator(body);

  const income = {
    incomeType: v.oneOf('incomeType', 'Income type', INCOME_TYPES),
    dueDate: v.isoDate('dueDate', 'Due date'),
    receivedDate: v.isoDate('receivedDate', 'Actual received date', { required: false }),
    source: v.requiredText('source', 'Source'),
    amount: v.amount('amount'),
    purpose: v.optionalText('purpose', 'Purpose'),
    status: v.oneOf('status', 'Status', INCOME_STATUSES),
    paymentMethodId: v.id('paymentMethodId', 'Payment method', { required: false }),
    reference: v.optionalText('reference', 'Reference'),
    notes: v.optionalText('notes', 'Notes', LIMITS.MAX_NOTES_LENGTH),
  };

  if (income.receivedDate && income.status && income.status !== INCOME_RECEIVED_STATUS) {
    v.addError(
      'receivedDate',
      `Actual received date can only be set when the status is ${INCOME_RECEIVED_STATUS}.`
    );
  }

  v.throwIfInvalid();
  return income;
}

module.exports = { validateIncomeInput };
