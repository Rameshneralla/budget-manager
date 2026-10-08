/**
 * Display formatting for money, dates and months. Use these everywhere instead
 * of calling Intl / toLocaleString directly so the whole app formats the same way.
 */
import { CURRENCY } from '../constants';

const wholeRupeeFormatter = new Intl.NumberFormat(CURRENCY.LOCALE, {
  style: 'currency',
  currency: CURRENCY.CODE,
  maximumFractionDigits: 0,
});

const paiseFormatter = new Intl.NumberFormat(CURRENCY.LOCALE, {
  style: 'currency',
  currency: CURRENCY.CODE,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const MONTH_NAMES_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const MONTH_NAMES_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** 125000 -> "₹1,25,000"; 99.5 -> "₹99.50" (paise shown only when present). */
export function formatCurrency(amount) {
  const value = Number(amount) || 0;
  const formatter = Number.isInteger(value) ? wholeRupeeFormatter : paiseFormatter;
  return formatter.format(value);
}

/** "2026-10-05" -> "05 Oct 2026". Returns the fallback for empty values. */
export function formatDate(isoDate, fallback = '—') {
  if (!isoDate) {
    return fallback;
  }
  const [year, month, day] = isoDate.split('-');
  const monthName = MONTH_NAMES_SHORT[Number(month) - 1];
  if (!monthName || !day) {
    return isoDate;
  }
  return `${day} ${monthName} ${year}`;
}

/** "2026-10" -> "October 2026" */
export function formatMonthLabel(monthKey) {
  if (!monthKey) {
    return '';
  }
  const [year, month] = monthKey.split('-');
  const monthName = MONTH_NAMES_LONG[Number(month) - 1];
  return monthName ? `${monthName} ${year}` : monthKey;
}

/** ISO timestamp -> "08 Oct 2026, 14:05" in the viewer's local time. */
export function formatDateTime(isoTimestamp) {
  if (!isoTimestamp) {
    return '';
  }
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) {
    return isoTimestamp;
  }
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day} ${MONTH_NAMES_SHORT[date.getMonth()]} ${date.getFullYear()}, ${hours}:${minutes}`;
}

/** 70.3 -> "70.3%" */
export function formatPercent(value) {
  return `${Number(value) || 0}%`;
}

/** Shows a dash for empty optional text fields. */
export function displayText(value, fallback = '—') {
  return value === null || value === undefined || value === '' ? fallback : value;
}

/** 1 -> "1 transaction", 5 -> "5 transactions" */
export function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}
