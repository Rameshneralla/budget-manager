/**
 * App root: providers, toast container and routes.
 * To add a page: create it in pages/, add a <Route> here and a link in
 * components/layout/AppHeader.jsx (NAV_ITEMS).
 */
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { BudgetProvider } from './context/BudgetContext';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Income from './pages/Income';
import Expenses from './pages/Expenses';
import UpcomingIncome from './pages/UpcomingIncome';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import { ROUTES } from './constants';

const TOAST_AUTO_CLOSE_MS = 3500;

function ThemedToastContainer() {
  const { theme } = useTheme();
  return (
    <ToastContainer
      position="top-right"
      autoClose={TOAST_AUTO_CLOSE_MS}
      newestOnTop
      theme={theme}
    />
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BudgetProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
                <Route path={ROUTES.INCOME} element={<Income />} />
                <Route path={ROUTES.EXPENSES} element={<Expenses />} />
                <Route path={ROUTES.UPCOMING_INCOME} element={<UpcomingIncome />} />
                <Route path={ROUTES.SETTINGS} element={<Settings />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </BudgetProvider>
      </AuthProvider>
      <ThemedToastContainer />
    </ThemeProvider>
  );
}
