/** Heading for a group of records: name, record count and subtotal. */
import { formatCurrency, pluralize } from '../../../utils/formatters';

export default function GroupHeading({ group }) {
  return (
    <span className="group-heading">
      <span className="group-heading__label">{group.label}</span>
      <span className="group-heading__count">{pluralize(group.records.length, 'record')}</span>
      <span className="group-heading__total amount">{formatCurrency(group.total)}</span>
    </span>
  );
}
