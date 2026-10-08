/**
 * Loads the initial budget data into SQLite.
 *
 * Flow: seed file (JSON, export format) -> dataService.importData -> SQLite
 * The React app never reads these files; it only reads the API.
 *
 * Which file is used:
 *   1. SEED_FILE (default: database/seed.private.json) - your REAL data. It is
 *      git-ignored so personal finances never reach the public repository.
 *   2. Otherwise seed-data/sample-data.json - FICTIONAL demo data (committed, used by tests).
 */
const fs = require('fs');
const path = require('path');
const env = require('../config/env');
const dataService = require('./dataService');

const SAMPLE_SEED_FILE = path.join(__dirname, '..', 'database', 'seed-data', 'sample-data.json');

/** Returns { filePath, isSample } for the seed file that will be loaded. */
function resolveSeedFile() {
  if (env.seedFile && fs.existsSync(env.seedFile)) {
    return { filePath: env.seedFile, isSample: false };
  }
  return { filePath: SAMPLE_SEED_FILE, isSample: true };
}

/**
 * @param {{ reset?: boolean }} options reset=true replaces existing data with the seed data.
 * @returns {{ seeded: boolean, counts?: object, filePath?: string, isSample?: boolean }}
 */
function seedInitialData({ reset = false } = {}) {
  if (!reset && !dataService.isDatabaseEmpty()) {
    return { seeded: false };
  }
  const { filePath, isSample } = resolveSeedFile();
  const payload = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const source = isSample ? 'sample data (fictional)' : `seed file ${path.basename(filePath)}`;
  const counts = dataService.importData(payload, { source });
  return { seeded: true, counts, filePath, isSample };
}

module.exports = { seedInitialData };
