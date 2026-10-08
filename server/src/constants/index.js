/**
 * Domain constants shared by validators, services and the /api/meta endpoint.
 * The frontend reads these through /api/meta, so this file is the single source of truth.
 * If you add a status here, also add it to the CHECK constraint in a new migration.
 */

const INCOME_STATUSES = Object.freeze(['Received', 'Pending']);
const EXPENSE_STATUSES = Object.freeze(['Paid', 'Pending', 'Closed']);
const UPCOMING_INCOME_STATUSES = Object.freeze(['Expected', 'Pending', 'Received']);
const EXPENSE_TYPES = Object.freeze(['Regular', 'Additional']);

const ENTITY_TYPES = Object.freeze({
  INCOME: 'income',
  EXPENSE: 'expense',
  UPCOMING_INCOME: 'upcoming_income',
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

const EXPORT_FORMAT = Object.freeze({
  NAME: 'budget-manager-export',
  VERSION: 1,
});

module.exports = {
  INCOME_STATUSES,
  EXPENSE_STATUSES,
  UPCOMING_INCOME_STATUSES,
  EXPENSE_TYPES,
  ENTITY_TYPES,
  AUDIT_ACTIONS,
  LIMITS,
  EXPORT_FORMAT,
  SESSION_COOKIE_NAME,
};
