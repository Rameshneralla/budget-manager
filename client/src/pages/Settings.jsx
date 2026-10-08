/** Settings: data management (export / import / backup) and the change history. */
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import PageHeader from '../components/common/PageHeader';
import ExportDataCard from '../components/settings/ExportDataCard';
import ImportDataCard from '../components/settings/ImportDataCard';
import BackupDatabaseCard from '../components/settings/BackupDatabaseCard';
import RecentActivity from '../components/dashboard/RecentActivity';
import LocalDataNotice from '../components/common/LocalDataNotice';
import { useBudget } from '../context/BudgetContext';
import { useApiData } from '../hooks/useApiData';
import { referenceService } from '../services/referenceService';

const SETTINGS_ACTIVITY_LIMIT = 50;

export default function Settings() {
  const { dataVersion } = useBudget();
  const activityState = useApiData(
    () => referenceService.getRecentActivity(SETTINGS_ACTIVITY_LIMIT),
    [dataVersion]
  );

  return (
    <>
      <PageHeader title="Settings" subtitle="Data management and change history" />

      <LocalDataNotice />

      <h2 className="section-title">Data Management</h2>
      <Row className="g-3 mb-4">
        <Col xs={12} md={6} xl={4}>
          <ExportDataCard />
        </Col>
        <Col xs={12} md={6} xl={4}>
          <ImportDataCard />
        </Col>
        <Col xs={12} md={6} xl={4}>
          <BackupDatabaseCard />
        </Col>
      </Row>

      <RecentActivity
        title="Change History"
        activity={activityState.data}
        isLoading={activityState.isLoading}
        error={activityState.error}
        onRetry={activityState.reload}
      />
    </>
  );
}
