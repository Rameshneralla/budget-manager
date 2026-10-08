/** Column header button that toggles sorting and announces the direction (aria-sort). */
import { FiArrowDown, FiArrowUp, FiChevronDown } from 'react-icons/fi';
import { SORT_DIRECTIONS } from '../../../constants';

export function getAriaSort(columnKey, sort) {
  if (sort.key !== columnKey) {
    return 'none';
  }
  return sort.direction === SORT_DIRECTIONS.ASC ? 'ascending' : 'descending';
}

export default function SortableHeader({ column, sort, onSort }) {
  const isActive = sort.key === column.key;
  let Icon = FiChevronDown;
  if (isActive) {
    Icon = sort.direction === SORT_DIRECTIONS.ASC ? FiArrowUp : FiArrowDown;
  }

  return (
    <button
      type="button"
      className={`sort-button${isActive ? ' is-active' : ''}`}
      onClick={() => onSort(column.key)}
      title={`Sort by ${column.label}`}
    >
      {column.label}
      <Icon aria-hidden="true" className={isActive ? '' : 'opacity-50'} />
    </button>
  );
}
