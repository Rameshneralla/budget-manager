/**
 * Accordion header for a group of records: name, record count, how many are
 * still outstanding (e.g. "1 pending") and the subtotal. Click to open / close.
 */
import { FiChevronRight } from 'react-icons/fi';
import { formatCurrency, pluralize } from '../../../utils/formatters';

export default function GroupHeading({ group, controlsId, onToggle }) {
  return (
    <button
      type="button"
      className={`group-heading${group.isOpen ? ' is-open' : ''}`}
      aria-expanded={group.isOpen}
      aria-controls={controlsId}
      onClick={onToggle}
    >
      <FiChevronRight className="group-heading__chevron" aria-hidden="true" />
      <span className="group-heading__label">{group.label}</span>
      <span className="group-heading__count">{pluralize(group.records.length, 'record')}</span>
      {group.outstandingCount > 0 && (
        <span className="group-heading__outstanding">
          {group.outstandingCount} {group.outstandingLabel}
        </span>
      )}
      <span className="group-heading__total amount">{formatCurrency(group.total)}</span>
    </button>
  );
}
