/** Expense management page. Behaviour: RecordManager; Expense specifics: useExpenseConfig. */
import RecordManager from '../components/common/records/RecordManager';
import { useExpenseConfig } from '../components/expenses/useExpenseConfig';

export default function Expenses() {
  const config = useExpenseConfig();
  return <RecordManager config={config} />;
}
