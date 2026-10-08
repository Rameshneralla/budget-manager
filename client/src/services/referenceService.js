/** Reference data: available months, lookups (meta) and recent activity. */
import { api } from './api';

export const referenceService = {
  /** ['2026-10', ...] - drives the month dropdown. */
  getMonths: () => api.get('/months'),
  /** { owner, categories, paymentMethods, statuses, expenseTypes } */
  getMeta: () => api.get('/meta'),
  getRecentActivity: (limit) => api.get('/activity', { limit }),
};
