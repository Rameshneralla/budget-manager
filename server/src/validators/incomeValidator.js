/** Validation rules for an income record (create and full update). */
const FieldValidator = require('./FieldValidator');
const { INCOME_STATUSES, LIMITS } = require('../constants');

function validateIncomeInput(body) {
  const v = new FieldValidator(body);

  const income = {
    date: v.isoDate('date', 'Date'),
    source: v.requiredText('source', 'Source'),
    amount: v.amount('amount'),
    purpose: v.optionalText('purpose', 'Purpose'),
    status: v.oneOf('status', 'Status', INCOME_STATUSES),
    paymentMethodId: v.id('paymentMethodId', 'Payment method', { required: false }),
    reference: v.optionalText('reference', 'Reference'),
    notes: v.optionalText('notes', 'Notes', LIMITS.MAX_NOTES_LENGTH),
  };

  v.throwIfInvalid();
  return income;
}

module.exports = { validateIncomeInput };
