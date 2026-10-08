/**
 * Entry point: prepares the database (migrations + first-run seed) and starts the API.
 */
const env = require('./config/env');
const createApp = require('./app');
const { runMigrations } = require('./database/migrator');
const { closeDb } = require('./database/connection');
const { seedInitialData } = require('./services/seedService');

function prepareDatabase() {
  const applied = runMigrations();
  if (applied.length > 0) {
    console.log(`Applied migrations: ${applied.join(', ')}`);
  }

  if (env.seedOnEmpty) {
    const result = seedInitialData();
    if (result.seeded) {
      const which = result.isSample ? 'FICTIONAL sample data' : result.filePath;
      console.log(`Database was empty - loaded ${which}.`, result.counts);
    }
  }
}

/** A deployed app must never be reachable without a password. */
function checkSecurityConfig() {
  if (env.isProduction && !env.auth.isEnabled) {
    console.error('APP_PASSWORD must be set when NODE_ENV=production. Refusing to start.');
    process.exit(1);
  }
  if (env.isProduction && !env.auth.sessionSecret) {
    console.warn('SESSION_SECRET is not set - users will be signed out on every restart.');
  }
  if (!env.auth.isEnabled) {
    console.warn('APP_PASSWORD is not set - the app is open without a login (local use only).');
  }
}

function start() {
  checkSecurityConfig();
  prepareDatabase();

  const server = createApp().listen(env.port, () => {
    console.log(`Budget Manager API running at http://localhost:${env.port}/api`);
    console.log(`Database: ${env.databasePath}`);
  });

  const shutdown = () => {
    server.close(() => {
      closeDb();
      process.exit(0);
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start();
