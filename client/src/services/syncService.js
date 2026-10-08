/**
 * Sync across devices (GitHub Pages build only). These requests are answered
 * in the browser by local-backend/localApi.js -> sync/syncManager.js.
 */
import { api } from './api';

export const syncService = {
  getStatus: () => api.get('/sync/status'),
  /** choice: null | 'cloud' | 'device' (only needed when both sides already have data) */
  connect: ({ owner, repo, token, choice = null }) =>
    api.post('/sync/connect', { owner, repo, token, choice }),
  syncNow: () => api.post('/sync/now'),
  resolveConflict: (keep) => api.post('/sync/resolve', { keep }),
  disconnect: () => api.post('/sync/disconnect'),
};
