/**
 * Frontend constants. Domain values that the server owns (statuses, categories,
 * payment methods, expense types) are NOT duplicated here - they come from
 * GET /api/meta through BudgetContext. This file only holds UI configuration.
 */
import { FiCheckCircle, FiClock, FiXCircle, FiCalendar } from 'react-icons/fi';

export const APP_NAME = 'Personal Budget Manager';
export const DEFAULT_OWNER_NAME = 'Ramesh Nerella';

export const ROUTES = Object.freeze({
  DASHBOARD: '/',
  INCOME: '/income',
  EXPENSES: '/expenses',
  SETTINGS: '/settings',
});

export const CURRENCY = Object.freeze({
  LOCALE: 'en-IN',
  CODE: 'INR',
});

/**
 * How each status looks. `tone` maps to the .status-badge--{tone} SCSS modifier.
 * Every badge shows an icon AND text so status never relies on colour alone.
 * Add a new status here after adding it on the server (server/src/constants).
 */
export const STATUS_APPEARANCE = Object.freeze({
  Received: { tone: 'positive', icon: FiCheckCircle },
  Paid: { tone: 'positive', icon: FiCheckCircle },
  Pending: { tone: 'warning', icon: FiClock },
  Expected: { tone: 'info', icon: FiCalendar },
  Closed: { tone: 'neutral', icon: FiXCircle },
});

export const DEFAULT_STATUS_APPEARANCE = Object.freeze({ tone: 'neutral', icon: FiClock });

export const PAGE_SIZE_OPTIONS = Object.freeze([10, 25, 50, 100]);
export const DEFAULT_PAGE_SIZE = 25;

export const SORT_DIRECTIONS = Object.freeze({ ASC: 'asc', DESC: 'desc' });

/** Below this width tables turn into stacked record cards (matches Bootstrap "md"). */
export const MOBILE_MEDIA_QUERY = '(max-width: 767.98px)';

export const RECENT_ACTIVITY_LIMIT = 8;

/**
 * Chart series colours are CSS custom properties defined in styles/_variables.scss
 * (validated for colour-blind separation). Categories keep a fixed colour by position.
 */
export const CHART_SERIES_VARIABLES = Object.freeze([
  '--app-chart-1',
  '--app-chart-2',
  '--app-chart-3',
  '--app-chart-4',
]);

export const THEMES = Object.freeze({ LIGHT: 'light', DARK: 'dark' });
export const THEME_STORAGE_KEY = 'budget-manager.theme';
export const MONTH_STORAGE_KEY = 'budget-manager.month';
