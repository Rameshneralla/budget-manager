/** Income management page. Behaviour: RecordManager; Income specifics: useIncomeConfig. */
import RecordManager from '../components/common/records/RecordManager';
import { useIncomeConfig } from '../components/income/useIncomeConfig';

export default function Income() {
  const config = useIncomeConfig();
  return <RecordManager config={config} />;
}
