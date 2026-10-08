/** Dashboard API: totals, category breakdown and payment-method summary for one month. */
import { api } from './api';

export const dashboardService = {
  getDashboard: (month) => api.get('/dashboard', { month }),
};
