/**
 * Dashboard number card.
 * tone: icon colour (primary, positive, negative, warning, info, neutral)
 * variants: extra looks from _cards.scss, e.g. ['hero', 'accent']
 */
import { formatCurrency } from '../../utils/formatters';

export default function StatCard({
  label,
  amount,
  icon: Icon,
  tone = 'primary',
  hint,
  variants = [],
}) {
  const className = ['stat-card', ...variants.map((variant) => `stat-card--${variant}`)].join(' ');
  const isNegative = amount < 0;

  return (
    <article className={className} aria-label={`${label}: ${formatCurrency(amount)}`}>
      <span className={`stat-card__icon tone-${tone}`} aria-hidden="true">
        <Icon />
      </span>
      <div className="stat-card__body">
        <h3 className="stat-card__label">{label}</h3>
        <p className={`stat-card__value amount${isNegative ? ' amount--negative' : ''}`}>
          {formatCurrency(amount)}
        </p>
        {hint && <p className="stat-card__hint">{hint}</p>}
      </div>
    </article>
  );
}
