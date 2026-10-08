import { useBudget } from '../../context/BudgetContext';
import { APP_NAME, DEFAULT_OWNER_NAME } from '../../constants';

export default function AppFooter() {
  const { meta } = useBudget();
  const ownerName = meta?.owner?.fullName || DEFAULT_OWNER_NAME;

  return (
    <footer className="app-footer">
      <div className="app-container d-flex flex-wrap justify-content-between gap-2">
        <span>
          {ownerName} · {APP_NAME}
        </span>
        <span>All amounts in Indian Rupees (₹)</span>
      </div>
    </footer>
  );
}
