/**
 * Income still expected this month (status Expected), with a one-click
 * "Mark received". Marking it updates the Income page and dashboard totals.
 */
import { Link } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import { FiCalendar, FiCheck } from 'react-icons/fi';
import { EmptyState } from '../common/StateBlocks';
import { useRecordActions } from '../../hooks/useRecordActions';
import { incomeService } from '../../services/incomeService';
import { ROUTES } from '../../constants';
import { formatCurrency, formatDate } from '../../utils/formatters';

const RECEIVED_STATUS = 'Received';
const describeIncome = (income) => income.source;

export default function ExpectedIncomePanel({ expectedIncome }) {
  const actions = useRecordActions(incomeService, {
    singular: 'Income',
    describe: describeIncome,
  });

  return (
    <div className="panel">
      <div className="panel__header">
        <div>
          <h2 className="panel__title">Expected Income</h2>
          <p className="panel__subtitle">Not received yet this month</p>
        </div>
        <Link to={ROUTES.INCOME} className="small">
          Manage
        </Link>
      </div>
      <div className="panel__body">
        {expectedIncome.length === 0 ? (
          <EmptyState compact icon={FiCalendar} title="All income for this month is received." />
        ) : (
          <ul className="upcoming-list">
            {expectedIncome.map((income) => (
              <li key={income.id} className="upcoming-list__item">
                <div className="min-w-0">
                  <p className="upcoming-list__source">{income.source}</p>
                  <span className="upcoming-list__meta">Due {formatDate(income.dueDate)}</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <strong className="amount">{formatCurrency(income.amount)}</strong>
                  <Button
                    size="sm"
                    variant="outline-success"
                    onClick={() => actions.changeStatus(income, RECEIVED_STATUS).catch(() => {})}
                    aria-label={`Mark ${income.source} ${formatCurrency(income.amount)} as received`}
                  >
                    <FiCheck aria-hidden="true" /> Received
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
