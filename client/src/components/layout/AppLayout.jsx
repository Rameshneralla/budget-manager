/**
 * Page shell. Pages render only after the lookups and month list have loaded,
 * so every page can rely on `meta` and `selectedMonth` being available.
 */
import { Outlet } from 'react-router-dom';
import AppHeader from './AppHeader';
import AppFooter from './AppFooter';
import { useBudget } from '../../context/BudgetContext';
import { ErrorState, LoadingState } from '../common/StateBlocks';

function PageContent() {
  const { isReady, loadError, retryLoad } = useBudget();

  if (loadError) {
    return (
      <ErrorState
        title="Unable to load the budget"
        message={loadError.message}
        onRetry={retryLoad}
      />
    );
  }
  if (!isReady) {
    return <LoadingState message="Loading your budget..." />;
  }
  return <Outlet />;
}

export default function AppLayout() {
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <AppHeader />
      <main id="main-content" className="app-main" tabIndex={-1}>
        <div className="app-container">
          <PageContent />
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
