/**
 * Search box + filter controls. Results update as you type/select (no reload).
 *
 * Filter definition: { key, label, type: 'select' | 'date', options?: [{ value, label }] }
 */
import { useState } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { FiFilter, FiRotateCcw } from 'react-icons/fi';
import SearchInput from '../SearchInput';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { MOBILE_MEDIA_QUERY } from '../../../constants';

function FilterControl({ filter, value, onChange }) {
  const id = `filter-${filter.key}`;
  return (
    <div>
      <Form.Label htmlFor={id}>{filter.label}</Form.Label>
      {filter.type === 'date' ? (
        <Form.Control
          id={id}
          type="date"
          value={value}
          onChange={(event) => onChange(filter.key, event.target.value)}
        />
      ) : (
        <Form.Select
          id={id}
          value={value}
          onChange={(event) => onChange(filter.key, event.target.value)}
        >
          <option value="">All</option>
          {filter.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Form.Select>
      )}
    </div>
  );
}

/** `children`: extra always-visible controls, e.g. a "Group by category" switch. */
export default function FilterBar({ searchLabel, searchPlaceholder, table, filters, children }) {
  // On phones the filters are folded away behind a button to keep the records in view.
  const isMobile = useMediaQuery(MOBILE_MEDIA_QUERY);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const activeFilterCount = filters.filter((filter) => table.filterValues[filter.key]).length;
  const showFilters = !isMobile || showMobileFilters;

  return (
    <div className="filter-bar" role="search">
      <div className="filter-bar__search">
        <SearchInput
          id="records-search"
          label={searchLabel}
          placeholder={searchPlaceholder}
          value={table.searchText}
          onChange={table.setSearchText}
        />
      </div>
      {isMobile && (
        <Button
          variant="outline-secondary"
          onClick={() => setShowMobileFilters((current) => !current)}
          aria-expanded={showMobileFilters}
          aria-controls="records-filters"
        >
          <FiFilter aria-hidden="true" />
          {showMobileFilters ? 'Hide filters' : 'Filters'}
          {activeFilterCount > 0 && ` (${activeFilterCount})`}
        </Button>
      )}
      {showFilters && <FilterControls id="records-filters" filters={filters} table={table} />}
      {children}
    </div>
  );
}

function FilterControls({ id, filters, table }) {
  return (
    <div id={id} className="filter-bar__controls">
      {filters.map((filter) => (
        <FilterControl
          key={filter.key}
          filter={filter}
          value={table.filterValues[filter.key]}
          onChange={table.setFilterValue}
        />
      ))}
      <Button
        variant="outline-secondary"
        className="filter-bar__reset"
        onClick={table.resetFilters}
        disabled={!table.hasActiveFilters}
      >
        <FiRotateCcw aria-hidden="true" /> Reset
      </Button>
    </div>
  );
}
