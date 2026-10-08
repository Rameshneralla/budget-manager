/**
 * Dashboard (landing page): totals, charts and summaries for the selected month.
 * Data: GET /api/dashboard?month=, GET /api/upcoming-income?month=, GET /api/activity.
 * Everything re-loads automatically after any change (dataVersion).
 */
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import PageHeader from '../components/common/PageHeader';
import MonthSelector from '../components/common/MonthSelector';
import { ErrorState, LoadingState } from '../components/common/StateBlocks';
import SummaryCards from '../components/dashboard/SummaryCards';
import IncomeVsExpensesChart from '../components/dashboard/IncomeVsExpensesChart';
import CategoryBreakdown from '../components/dashboard/CategoryBreakdown';
import PaymentMethodSummary from '../components/dashboard/PaymentMethodSummary';
import UpcomingIncomePanel from '../components/dashboard/UpcomingIncomePanel';
import RecentActivity from '../components/dashboard/RecentActivity';
import { useBudget } from '../context/BudgetContext';
import { useApiData } from '../hooks/useApiData';
import { dashboardService } from '../services/dashboardService';
import { upcomingIncomeService } from '../services/upcomingIncomeService';
import { referenceService } from '../services/referenceService';
import { RECENT_ACTIVITY_LIMIT } from '../constants';
import { formatMonthLabel } from '../utils/formatters';

function DashboardContent({ dashboard, upcomingIncome, activityState }) {
  const { summary } = dashboard;

  return (
    <>
      <SummaryCards summary={summary} counts={dashboard.counts} />

      <Row className="g-3 mb-3">
        <Col xs={12} lg={7}>
          <IncomeVsExpensesChart summary={summary} />
        </Col>
        <Col xs={12} lg={5}>
          <UpcomingIncomePanel upcomingIncome={upcomingIncome} />
        </Col>
      </Row>

      <Row className="g-3 mb-3">
        <Col xs={12} lg={6}>
          <CategoryBreakdown
            categories={dashboard.categoryBreakdown}
            totalExpenses={summary.totalExpenses}
          />
        </Col>
        <Col xs={12} lg={6}>
          <div className="d-flex flex-column gap-3 h-100">
            <PaymentMethodSummary paymentMethods={dashboard.paymentMethodSummary} />
            <RecentActivity
              activity={activityState.data}
              isLoading={activityState.isLoading}
              error={activityState.error}
              onRetry={activityState.reload}
            />
          </div>
        </Col>
      </Row>
    </>
  );
}

export default function Dashboard() {
  const { selectedMonth, dataVersion } = useBudget();

  const dashboardState = useApiData(
    () => dashboardService.getDashboard(selectedMonth),
    [selectedMonth, dataVersion]
  );
  const upcomingState = useApiData(
    () => upcomingIncomeService.listByMonth(selectedMonth),
    [selectedMonth, dataVersion]
  );
  const activityState = useApiData(
    () => referenceService.getRecentActivity(RECENT_ACTIVITY_LIMIT),
    [dataVersion]
  );

  const error = dashboardState.error || upcomingState.error;
  const isFirstLoad = !dashboardState.data || !upcomingState.data;

  let content;
  if (error) {
    content = (
      <ErrorState
        title="Unable to load the dashboard. Please try again."
        message={error.message}
        onRetry={() => {
          dashboardState.reload();
          upcomingState.reload();
        }}
      />
    );
  } else if (isFirstLoad) {
    content = <LoadingState message="Loading dashboard..." />;
  } else {
    content = (
      <DashboardContent
        dashboard={dashboardState.data}
        upcomingIncome={upcomingState.data}
        activityState={activityState}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`Budget overview for ${formatMonthLabel(selectedMonth)}`}
      >
        <MonthSelector id="dashboard-month" />
      </PageHeader>
      {content}
    </>
  );
}
