/**
 * App root: providers, toast container and routes.
 * To add a page: create it in pages/, add a <Route> here and a link in
 * components/layout/AppHeader.jsx (NAV_ITEMS).
 */
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { BudgetProvider } from './context/BudgetContext';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Income from './pages/Income';
import Expenses from './pages/Expenses';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import { ROUTES } from './constants';

const TOAST_AUTO_CLOSE_MS = 3500;
// '/' normally, '/budget-manager' on GitHub Pages (from Vite's base setting).
const ROUTER_BASENAME = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

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
          <BrowserRouter basename={ROUTER_BASENAME}>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
                <Route path={ROUTES.INCOME} element={<Income />} />
                <Route path={ROUTES.EXPENSES} element={<Expenses />} />
                {/* Upcoming income is now Income with status Expected (old links / bookmarks). */}
                <Route path="/upcoming-income" element={<Navigate to={ROUTES.INCOME} replace />} />
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
