/**
 * Browser events used by the GitHub sync (GitHub Pages build).
 * Fired by local-backend/sync/syncManager.js; listened to by the React app.
 */
export const SYNC_EVENTS = Object.freeze({
  /** Data from another device replaced this device's data - screens should reload. */
  DATA_REPLACED: 'budget-manager:data-replaced',
  /** Sync status changed (detail = status object, see syncManager getSyncStatus). */
  STATUS_CHANGED: 'budget-manager:sync-status',
});
