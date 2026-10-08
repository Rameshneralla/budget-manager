/** Upcoming income page. Behaviour: RecordManager; specifics: useUpcomingIncomeConfig. */
import RecordManager from '../components/common/records/RecordManager';
import { useUpcomingIncomeConfig } from '../components/upcoming-income/useUpcomingIncomeConfig';

export default function UpcomingIncome() {
  const config = useUpcomingIncomeConfig();
  return <RecordManager config={config} />;
}
