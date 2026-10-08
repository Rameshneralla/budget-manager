/** Upcoming income for the selected month, with a link to manage it. */
import { Link } from 'react-router-dom';
import { FiCalendar } from 'react-icons/fi';
import StatusBadge from '../common/StatusBadge';
import { EmptyState } from '../common/StateBlocks';
import { ROUTES } from '../../constants';
import { formatCurrency, formatDate, formatMonthLabel } from '../../utils/formatters';

export default function UpcomingIncomePanel({ upcomingIncome }) {
  return (
    <div className="panel">
      <div className="panel__header">
        <div>
          <h2 className="panel__title">Upcoming Income</h2>
          <p className="panel__subtitle">Expected this month</p>
        </div>
        <Link to={ROUTES.UPCOMING_INCOME} className="small">
          Manage
        </Link>
      </div>
      <div className="panel__body">
        {upcomingIncome.length === 0 ? (
          <EmptyState compact icon={FiCalendar} title="No upcoming income available." />
        ) : (
          <ul className="upcoming-list">
            {upcomingIncome.map((item) => (
              <li key={item.id} className="upcoming-list__item">
                <div className="min-w-0">
                  <p className="upcoming-list__source">{item.source}</p>
                  <span className="upcoming-list__meta">
                    {item.expectedDate
                      ? formatDate(item.expectedDate)
                      : formatMonthLabel(item.month)}
                  </span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <strong className="amount">{formatCurrency(item.amount)}</strong>
                  <StatusBadge status={item.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
