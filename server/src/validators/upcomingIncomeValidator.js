/** Validation rules for an upcoming income record (create and full update). */
const FieldValidator = require('./FieldValidator');
const { UPCOMING_INCOME_STATUSES, LIMITS } = require('../constants');
const { monthKeyFromDate } = require('../utils/dates');

function validateUpcomingIncomeInput(body) {
  const v = new FieldValidator(body);

  const upcomingIncome = {
    month: v.monthKey('month'),
    expectedDate: v.isoDate('expectedDate', 'Expected date', { required: false }),
    source: v.requiredText('source', 'Source'),
    amount: v.amount('amount'),
    purpose: v.optionalText('purpose', 'Purpose'),
    status: v.oneOf('status', 'Status', UPCOMING_INCOME_STATUSES),
    notes: v.optionalText('notes', 'Notes', LIMITS.MAX_NOTES_LENGTH),
  };

  const { month, expectedDate } = upcomingIncome;
  if (month && expectedDate && monthKeyFromDate(expectedDate) !== month) {
    v.addError('expectedDate', 'Expected date must fall within the selected month.');
  }

  v.throwIfInvalid();
  return upcomingIncome;
}

module.exports = { validateUpcomingIncomeInput };
