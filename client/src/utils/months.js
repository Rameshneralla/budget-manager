/** Month-key helpers. A month key is a 'YYYY-MM' string, e.g. '2026-10'. */

function pad(number) {
  return String(number).padStart(2, '0');
}

/** Local date -> 'YYYY-MM-DD' (avoids the UTC shift of toISOString). */
export function toIsoDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function getCurrentMonthKey() {
  return toIsoDate(new Date()).slice(0, 7);
}

/**
 * A sensible default date for a new record in `monthKey`:
 * today if today is in that month, otherwise the first day of the month.
 */
export function defaultDateForMonth(monthKey) {
  const today = toIsoDate(new Date());
  return today.startsWith(monthKey) ? today : `${monthKey}-01`;
}

/** Picks the month to show first: the current month if it has data, else the latest one. */
export function pickInitialMonth(availableMonths, preferredMonth) {
  if (preferredMonth && availableMonths.includes(preferredMonth)) {
    return preferredMonth;
  }
  const currentMonth = getCurrentMonthKey();
  if (availableMonths.includes(currentMonth)) {
    return currentMonth;
  }
  return availableMonths[availableMonths.length - 1] || currentMonth;
}
