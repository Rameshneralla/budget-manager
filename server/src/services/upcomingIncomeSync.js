/**
 * Keeps Income in step with Upcoming Income:
 *
 *   upcoming marked Received      -> an income record is created (status Received,
 *                                    actual received date = today) and linked to it
 *   still Received, edited        -> the linked income gets the new source/amount/purpose
 *   changed back from Received    -> the linked income record is removed
 *
 * The dashboard is calculated from income records, so its totals follow automatically.
 * Edits made directly on the linked income (payment method, dates, notes) are kept.
 * Runs inside the same transaction as the upcoming-income change.
 */
const incomeRepository = require('../repositories/incomeRepository');
const upcomingIncomeRepository = require('../repositories/upcomingIncomeRepository');
const monthRepository = require('../repositories/monthRepository');
const auditService = require('./auditService');
const { monthKeyFromDate, todayIsoDate } = require('../utils/dates');
const {
  ENTITY_TYPES,
  AUDIT_ACTIONS,
  INCOME_RECEIVED_STATUS,
  UPCOMING_RECEIVED_STATUS,
} = require('../constants');

const LINKED_INCOME_REFERENCE = 'From Upcoming Income';

/** Due date for the new income: the expected date, else today if it is in that month, else the 1st. */
function dueDateFor(upcoming) {
  if (upcoming.expectedDate) {
    return upcoming.expectedDate;
  }
  const today = todayIsoDate();
  return today.startsWith(upcoming.month) ? today : `${upcoming.month}-01`;
}

function buildLinkedIncome(upcoming, existingIncome) {
  const dueDate = existingIncome?.dueDate ?? dueDateFor(upcoming);
  return {
    month: monthKeyFromDate(dueDate),
    dueDate,
    receivedDate: existingIncome?.receivedDate || todayIsoDate(),
    source: upcoming.source,
    amount: upcoming.amount,
    purpose: upcoming.purpose,
    status: INCOME_RECEIVED_STATUS,
    paymentMethodId: existingIncome?.paymentMethodId ?? null,
    reference: existingIncome?.reference ?? LINKED_INCOME_REFERENCE,
    notes: existingIncome?.notes ?? upcoming.notes,
  };
}

function logIncome(action, income, summary) {
  auditService.log({ entityType: ENTITY_TYPES.INCOME, entityId: income.id, action, summary });
}

function addOrUpdateLinkedIncome(upcoming) {
  const existingIncome = upcoming.incomeId ? incomeRepository.findById(upcoming.incomeId) : null;
  const income = buildLinkedIncome(upcoming, existingIncome);
  monthRepository.ensureExists(income.month);

  if (existingIncome) {
    incomeRepository.update(existingIncome.id, income);
    return;
  }
  const created = incomeRepository.create(income);
  upcomingIncomeRepository.setIncomeId(upcoming.id, created.id);
  logIncome(
    AUDIT_ACTIONS.CREATED,
    created,
    `Income "${created.source}" added from Upcoming Income (marked Received)`
  );
}

function removeLinkedIncome(upcoming) {
  const income = incomeRepository.findById(upcoming.incomeId);
  upcomingIncomeRepository.setIncomeId(upcoming.id, null);
  if (!income) {
    return;
  }
  incomeRepository.deleteById(income.id);
  monthRepository.deleteUnused();
  logIncome(
    AUDIT_ACTIONS.DELETED,
    income,
    `Income "${income.source}" removed (upcoming income no longer Received)`
  );
}

/** afterWrite hook for upcomingIncomeService. */
function syncIncomeWithUpcoming(upcoming) {
  if (upcoming.status === UPCOMING_RECEIVED_STATUS) {
    addOrUpdateLinkedIncome(upcoming);
  } else if (upcoming.incomeId) {
    removeLinkedIncome(upcoming);
  }
}

module.exports = { syncIncomeWithUpcoming };
