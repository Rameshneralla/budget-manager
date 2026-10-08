/**
 * Where the data lives, chosen at build time:
 *   'api'   (default) the React app calls the Express + SQLite server
 *   'local' GitHub Pages build: SQLite runs inside the browser and the data is
 *           stored on this device only (see src/local-backend)
 * Set with VITE_DATA_MODE (client/.env.pages sets 'local').
 */
export const IS_LOCAL_MODE = import.meta.env.VITE_DATA_MODE === 'local';
