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

module.exports = { isValidIsoDate, isValidMonthKey, monthKeyFromDate };
