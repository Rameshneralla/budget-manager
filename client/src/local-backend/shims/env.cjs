/**
 * Browser replacement for server/src/config/env.js. Only the values the shared
 * services read are needed; there is no server, port or login in the browser.
 */
module.exports = {
  nodeEnv: 'production',
  isProduction: true,
  isInMemoryDatabase: false,
  databasePath: 'indexeddb',
  backupDir: 'Downloads',
  seedOnEmpty: false,
  seedFile: '',
  auth: { password: '', sessionSecret: '', sessionMaxAgeHours: 12, isEnabled: false },
};
