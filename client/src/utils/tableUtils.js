/**
 * Pure helpers for searching, filtering, sorting and paginating table records.
 * They know nothing about React, so they are easy to read and reuse.
 */
import { SORT_DIRECTIONS } from '../constants';

function normalize(value) {
  return String(value ?? '').toLowerCase();
}

/** True when any of `fields` contains the search text (case-insensitive). */
export function matchesSearch(record, searchText, fields) {
  const query = normalize(searchText).trim();
  if (!query) {
    return true;
  }
  return fields.some((field) => normalize(record[field]).includes(query));
}

/**
 * Applies every active filter. A filter definition looks like:
 *   { key: 'status', matches: (record, value) => record.status === value }
 * Filters whose value is empty are ignored.
 */
export function applyFilters(records, filterDefinitions, filterValues) {
  const activeFilters = filterDefinitions.filter((filter) => filterValues[filter.key]);
  if (activeFilters.length === 0) {
    return records;
  }
  return records.filter((record) =>
    activeFilters.every((filter) => filter.matches(record, filterValues[filter.key]))
  );
}

function isEmptyValue(value) {
  return value === null || value === undefined || value === '';
}

/** Compares numbers numerically and everything else as text. */
function compareValues(first, second) {
  if (typeof first === 'number' && typeof second === 'number') {
    return first - second;
  }
  return String(first).localeCompare(String(second), undefined, {
    sensitivity: 'base',
    numeric: true,
  });
}

/**
 * Sorts a copy of `records`. `getSortValue(record)` returns the value to compare.
 * Empty values always sort last; ties keep their original order (sort is stable).
 */
export function sortRecords(records, getSortValue, direction) {
  const multiplier = direction === SORT_DIRECTIONS.DESC ? -1 : 1;
  return [...records].sort((firstRecord, secondRecord) => {
    const first = getSortValue(firstRecord);
    const second = getSortValue(secondRecord);
    if (isEmptyValue(first) || isEmptyValue(second)) {
      return Number(isEmptyValue(first)) - Number(isEmptyValue(second));
    }
    return compareValues(first, second) * multiplier;
  });
}

export function paginate(records, page, pageSize) {
  const start = (page - 1) * pageSize;
  return records.slice(start, start + pageSize);
}

export function countPages(totalRecords, pageSize) {
  return Math.max(1, Math.ceil(totalRecords / pageSize));
}

export function sumAmounts(records) {
  return records.reduce((total, record) => total + Number(record.amount || 0), 0);
}

/**
 * Splits records into groups, e.g. expenses by category, keeping record order.
 * Groups follow `orderedLabels` (e.g. the category list); unknown labels go last.
 * Returns [{ label, records, total }].
 */
export function groupRecords(records, getGroupLabel, orderedLabels = []) {
  const groupsByLabel = new Map();
  records.forEach((record) => {
    const label = getGroupLabel(record);
    if (!groupsByLabel.has(label)) {
      groupsByLabel.set(label, []);
    }
    groupsByLabel.get(label).push(record);
  });

  const position = (label) => {
    const index = orderedLabels.indexOf(label);
    return index === -1 ? orderedLabels.length : index;
  };

  return [...groupsByLabel.entries()]
    .sort(([firstLabel], [secondLabel]) => position(firstLabel) - position(secondLabel))
    .map(([label, groupRecordsList]) => ({
      label,
      records: groupRecordsList,
      total: sumAmounts(groupRecordsList),
    }));
}

export function sumAmountsByStatus(records, status) {
  return sumAmounts(records.filter((record) => record.status === status));
}
