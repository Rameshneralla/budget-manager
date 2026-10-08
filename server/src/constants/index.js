/**
 * Domain constants shared by validators, services and the /api/meta endpoint.
 * The frontend reads these through /api/meta, so this file is the single source of truth.
 * If you add a status here, also add it to the CHECK constraint in a new migration.
 */

// Expected = not received yet (planned / upcoming income).
const INCOME_STATUSES = Object.freeze(['Expected', 'Received']);
const EXPENSE_STATUSES = Object.freeze(['Paid', 'Pending', 'Closed']);
const EXPENSE_TYPES = Object.freeze(['Regular', 'Additional']);
// Income groups. Add a type here and in a migration's CHECK constraint.
const INCOME_TYPES = Object.freeze(['Salary', 'House Rent', 'Other Income']);
const DEFAULT_INCOME_TYPE = 'Other Income';

// Statuses that mean the money actually moved, so an actual date may be recorded.
const INCOME_RECEIVED_STATUS = 'Received';
const EXPENSE_PAID_STATUS = 'Paid';
const EXPENSE_SETTLED_STATUSES = Object.freeze(['Paid', 'Closed']);

const ENTITY_TYPES = Object.freeze({
  INCOME: 'income',
  EXPENSE: 'expense',
});

const AUDIT_ACTIONS = Object.freeze({
  CREATED: 'Created',
  UPDATED: 'Updated',
  DELETED: 'Deleted',
  STATUS_CHANGED: 'Status Changed',
  IMPORTED: 'Imported',
});

const LIMITS = Object.freeze({
  MAX_TEXT_LENGTH: 200,
  MAX_NOTES_LENGTH: 1000,
  MAX_AMOUNT: 1_000_000_000, // ₹100 crore - guards against typos
  MAX_BULK_IDS: 500,
  DEFAULT_AUDIT_LOG_LIMIT: 50,
  MAX_AUDIT_LOG_LIMIT: 200,
});

const SESSION_COOKIE_NAME = 'budget_session';

// Version 2 added due/actual dates; version 3 folded upcoming income into income
// (status Expected); version 4 added incomeType. Older files still import and are converted.
const EXPORT_FORMAT = Object.freeze({
  NAME: 'budget-manager-export',
  VERSION: 4,
  SUPPORTED_VERSIONS: Object.freeze([1, 2, 3, 4]),
});

module.exports = {
  INCOME_STATUSES,
  EXPENSE_STATUSES,
  EXPENSE_TYPES,
  INCOME_TYPES,
  DEFAULT_INCOME_TYPE,
  INCOME_RECEIVED_STATUS,
  EXPENSE_PAID_STATUS,
  EXPENSE_SETTLED_STATUSES,
  ENTITY_TYPES,
  AUDIT_ACTIONS,
  LIMITS,
  EXPORT_FORMAT,
  SESSION_COOKIE_NAME,
};
