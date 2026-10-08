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

/** '2026-12' + 1 -> '2027-01' */
export function addMonths(monthKey, count) {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 1 + count, 1);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
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

/**
 * Options for a month picker: every month that has data plus the next
 * `futureCount` months after the selected one, sorted and de-duplicated.
 */
export function buildMonthOptions(availableMonths, selectedMonth, futureCount) {
  const months = new Set(availableMonths);
  months.add(selectedMonth);
  for (let offset = 1; offset <= futureCount; offset += 1) {
    months.add(addMonths(selectedMonth, offset));
  }
  return [...months].sort();
}
