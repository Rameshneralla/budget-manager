/** Settings > Data Management: JSON export/import and SQLite backup. */
import { api, request } from './api';

export const dataService = {
  /** The export file is returned as-is (no { data } envelope). */
  exportData: () => request('GET', '/data/export', { unwrap: false }),
  /** Replaces ALL budget data with the file contents. Returns record counts. */
  importData: (payload) => api.post('/data/import', payload),
  /** Writes a timestamped .sqlite copy on the server. */
  backupDatabase: () => api.post('/data/backup'),
};
