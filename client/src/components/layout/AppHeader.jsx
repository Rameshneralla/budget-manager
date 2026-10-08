/**
 * Top navigation: owner name, app name, page links, selected month and theme toggle.
 * Collapses into a mobile menu below the "lg" breakpoint.
 * Add a page link in NAV_ITEMS (and a <Route> in App.jsx).
 */
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import {
  FiCalendar,
  FiGrid,
  FiLogOut,
  FiSettings,
  FiTrendingDown,
  FiTrendingUp,
} from 'react-icons/fi';
import RbmLogo from '../common/RbmLogo';
import ThemeToggle from '../common/ThemeToggle';
import InstallApp from '../common/InstallApp';
import SyncIndicator from '../common/SyncIndicator';
import { useBudget } from '../../context/BudgetContext';
import { useAuth } from '../../context/AuthContext';
import { APP_NAME, DEFAULT_OWNER_NAME, ROUTES } from '../../constants';
import { formatMonthLabel } from '../../utils/formatters';

const NAV_ITEMS = [
  { to: ROUTES.DASHBOARD, label: 'Dashboard', icon: FiGrid, end: true },
  { to: ROUTES.INCOME, label: 'Income', icon: FiTrendingUp },
  { to: ROUTES.EXPENSES, label: 'Expenses', icon: FiTrendingDown },
  { to: ROUTES.SETTINGS, label: 'Settings', icon: FiSettings },
];

export default function AppHeader() {
  const { meta, selectedMonth } = useBudget();
  const { authRequired, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const ownerName = meta?.owner?.fullName || DEFAULT_OWNER_NAME;
  const appTitle = meta?.owner?.appTitle || APP_NAME;

  return (
    <header className="app-header">
      <Navbar expand="lg" expanded={isMenuOpen} onToggle={setIsMenuOpen} className="app-container">
        <Link to={ROUTES.DASHBOARD} className="app-brand me-3" onClick={() => setIsMenuOpen(false)}>
          <RbmLogo size={36} className="app-brand__logo" />
          <span className="app-brand__text">
            <span className="app-brand__name">{ownerName}</span>
            <span className="app-brand__tagline">{appTitle}</span>
          </span>
        </Link>

        <Navbar.Toggle aria-controls="main-navigation" aria-label="Toggle navigation menu" />

        <Navbar.Collapse id="main-navigation">
          <Nav as="nav" className="app-nav me-auto" aria-label="Main">
            {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <Nav.Link
                key={to}
                as={NavLink}
                to={to}
                end={end}
                onClick={() => setIsMenuOpen(false)}
              >
                <Icon aria-hidden="true" />
                {label}
              </Nav.Link>
            ))}
          </Nav>

          <div className="app-header__tools">
            {selectedMonth && (
              <span
                className="month-chip"
                aria-label={`Selected month: ${formatMonthLabel(selectedMonth)}`}
              >
                <FiCalendar aria-hidden="true" />
                {formatMonthLabel(selectedMonth)}
              </span>
            )}
            <SyncIndicator />
            <InstallApp />
            <ThemeToggle />
            {authRequired && (
              <button
                type="button"
                className="icon-button icon-button--bordered"
                onClick={logout}
                aria-label="Sign out"
                title="Sign out"
              >
                <FiLogOut aria-hidden="true" />
              </button>
            )}
          </div>
        </Navbar.Collapse>
      </Navbar>
    </header>
  );
}
