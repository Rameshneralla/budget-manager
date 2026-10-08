/**
 * Used instead of localApi.js in normal (server) builds - see vite.config.js -
 * so the in-browser backend and sql.js are never bundled there.
 */
export function handleLocalRequest() {
  throw new Error('The in-browser backend is only available in the GitHub Pages build.');
}
