/**
 * Search + filters + sorting + pagination for a list of records.
 * The record pages only describe WHAT can be filtered/sorted (config objects);
 * this hook does the work using the pure helpers in utils/tableUtils.js.
 *
 * @param {object[]} records
 * @param {object}   config
 * @param {string[]} config.searchFields   record fields the search box looks in
 * @param {object[]} config.filters        [{ key, matches(record, value) }]
 * @param {object[]} config.columns        [{ key, sortValue?(record) }]
 * @param {{ key: string, direction: 'asc'|'desc' }} config.defaultSort
 */
import { useCallback, useMemo, useState } from 'react';
import { DEFAULT_PAGE_SIZE, SORT_DIRECTIONS } from '../constants';
import {
  applyFilters,
  countPages,
  matchesSearch,
  paginate,
  sortRecords,
} from '../utils/tableUtils';

function buildEmptyFilterValues(filters) {
  return Object.fromEntries(filters.map((filter) => [filter.key, '']));
}

export function useTableState(records, { searchFields, filters, columns, defaultSort }) {
  const [searchText, setSearchTextState] = useState('');
  const [filterValues, setFilterValues] = useState(() => buildEmptyFilterValues(filters));
  const [sort, setSort] = useState(defaultSort);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(DEFAULT_PAGE_SIZE);

  const setSearchText = useCallback((text) => {
    setSearchTextState(text);
    setPage(1);
  }, []);

  const setFilterValue = useCallback((key, value) => {
    setFilterValues((current) => ({ ...current, [key]: value }));
    setPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setSearchTextState('');
    setFilterValues(buildEmptyFilterValues(filters));
    setPage(1);
  }, [filters]);

  const setPageSize = useCallback((size) => {
    setPageSizeState(size);
    setPage(1);
  }, []);

  /** Clicking the active column flips the direction; a new column starts ascending. */
  const toggleSort = useCallback((key) => {
    setSort((current) => ({
      key,
      direction:
        current.key === key && current.direction === SORT_DIRECTIONS.ASC
          ? SORT_DIRECTIONS.DESC
          : SORT_DIRECTIONS.ASC,
    }));
  }, []);

  const filteredRecords = useMemo(() => {
    const searched = records.filter((record) => matchesSearch(record, searchText, searchFields));
    return applyFilters(searched, filters, filterValues);
  }, [records, searchText, searchFields, filters, filterValues]);

  const sortedRecords = useMemo(() => {
    const column = columns.find((candidate) => candidate.key === sort.key);
    const getSortValue = column?.sortValue ?? ((record) => record[sort.key]);
    return sortRecords(filteredRecords, getSortValue, sort.direction);
  }, [filteredRecords, columns, sort]);

  const totalPages = countPages(sortedRecords.length, pageSize);
  const currentPage = Math.min(page, totalPages);
  const pageRecords = useMemo(
    () => paginate(sortedRecords, currentPage, pageSize),
    [sortedRecords, currentPage, pageSize]
  );

  const hasActiveFilters = searchText.trim() !== '' || Object.values(filterValues).some(Boolean);

  return {
    searchText,
    setSearchText,
    filterValues,
    setFilterValue,
    resetFilters,
    hasActiveFilters,
    sort,
    toggleSort,
    page: currentPage,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    filteredRecords: sortedRecords,
    pageRecords,
  };
}
