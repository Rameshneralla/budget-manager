/**
 * Central place for all backend configuration.
 * Values come from server/.env (see .env.example); defaults keep local setup zero-config.
 */
const path = require('path');
const dotenv = require('dotenv');

const SERVER_ROOT = path.resolve(__dirname, '..', '..');
const PROJECT_ROOT = path.resolve(SERVER_ROOT, '..');

dotenv.config({ path: path.join(SERVER_ROOT, '.env'), quiet: true });

const IN_MEMORY_DATABASE = ':memory:';

function resolveFromProjectRoot(filePath) {
  if (filePath === IN_MEMORY_DATABASE || path.isAbsolute(filePath)) {
    return filePath;
  }
  return path.resolve(PROJECT_ROOT, filePath);
}

function parseList(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  databasePath: resolveFromProjectRoot(process.env.DATABASE_PATH || './database/budget.sqlite'),
  backupDir: resolveFromProjectRoot(process.env.BACKUP_DIR || './database/backups'),
  corsOrigins: parseList(process.env.CORS_ORIGIN || 'http://localhost:5173'),
  seedOnEmpty: (process.env.SEED_ON_EMPTY || 'true').toLowerCase() === 'true',
  // Private seed file with real data (git-ignored). Falls back to fictional sample data.
  seedFile: resolveFromProjectRoot(process.env.SEED_FILE || './database/seed.private.json'),
  clientDistDir: path.join(PROJECT_ROOT, 'client', 'dist'),
};

env.isProduction = env.nodeEnv === 'production';
env.isInMemoryDatabase = env.databasePath === IN_MEMORY_DATABASE;

// Login. When APP_PASSWORD is empty the app is open (local use only);
// server.js refuses to start in production without it.
env.auth = {
  password: process.env.APP_PASSWORD || '',
  // Signs session cookies. If unset, a random secret is used and everyone is
  // signed out whenever the server restarts.
  sessionSecret: process.env.SESSION_SECRET || '',
  sessionMaxAgeHours: Number(process.env.SESSION_MAX_AGE_HOURS) || 12,
};
env.auth.isEnabled = env.auth.password !== '';

module.exports = env;
