/** Row of compact totals shown above a records table. items: [{ label, amount, icon }] */
import { formatCurrency } from '../../utils/formatters';

export default function SummaryStrip({ items }) {
  return (
    <div className="summary-strip">
      {items.map(({ label, amount, icon: Icon }) => (
        <div key={label} className="summary-strip__item">
          <div className="summary-strip__label">
            {Icon && <Icon aria-hidden="true" />}
            {label}
          </div>
          <div className="summary-strip__value amount">{formatCurrency(amount)}</div>
        </div>
      ))}
    </div>
  );
}
