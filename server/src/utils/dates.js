/** Date helpers. Dates are 'YYYY-MM-DD' strings; months are 'YYYY-MM' strings. */

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_KEY_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

/** True for real calendar dates only (rejects 2026-02-30). */
function isValidIsoDate(value) {
  if (typeof value !== 'string' || !ISO_DATE_PATTERN.test(value)) {
    return false;
  }
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
}

function isValidMonthKey(value) {
  return typeof value === 'string' && MONTH_KEY_PATTERN.test(value);
}

/** '2026-10-05' -> '2026-10' */
function monthKeyFromDate(isoDate) {
  return isoDate.slice(0, 7);
}

/**
 * The budget month a record belongs to: the month the money actually moved
 * (paid / received date) once known, otherwise the month it is due.
 * e.g. due 2026-08-20, paid 2026-10-03 -> '2026-10'
 */
function budgetMonthKey(actualDate, dueDate) {
  return monthKeyFromDate(actualDate || dueDate);
}

/** Today as 'YYYY-MM-DD' in local time (not UTC, so late-evening entries keep the right day). */
function todayIsoDate() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

module.exports = {
  isValidIsoDate,
  isValidMonthKey,
  monthKeyFromDate,
  budgetMonthKey,
  todayIsoDate,
};
