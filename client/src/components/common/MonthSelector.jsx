/**
 * Month dropdown. Options come from the database via BudgetContext
 * (GET /api/months) - never hard-coded. Changing it updates every page.
 */
import Form from 'react-bootstrap/Form';
import { useBudget } from '../../context/BudgetContext';
import { formatMonthLabel } from '../../utils/formatters';

export default function MonthSelector({ id = 'month-selector' }) {
  const { availableMonths, selectedMonth, setSelectedMonth } = useBudget();

  return (
    <div className="month-selector">
      <Form.Label htmlFor={id}>Month</Form.Label>
      <Form.Select
        id={id}
        value={selectedMonth}
        onChange={(event) => setSelectedMonth(event.target.value)}
      >
        {availableMonths.map((monthKey) => (
          <option key={monthKey} value={monthKey}>
            {formatMonthLabel(monthKey)}
          </option>
        ))}
      </Form.Select>
    </div>
  );
}
