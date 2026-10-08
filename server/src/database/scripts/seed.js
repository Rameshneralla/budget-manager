/**
 * CLI: load seed data into SQLite - database/seed.private.json (your real data,
 * git-ignored) if it exists, otherwise the fictional sample data.
 *
 *   npm run seed         seeds only when the database has no budget data yet
 *   npm run seed:reset   REPLACES all budget data with the seed data
 */
const env = require('../../config/env');
const { runMigrations } = require('../migrator');
const { closeDb } = require('../connection');
const { seedInitialData } = require('../../services/seedService');

const reset = process.argv.includes('--reset');

runMigrations();
const result = seedInitialData({ reset });

console.log(`Database: ${env.databasePath}`);
if (result.seeded) {
  console.log(`Seed data loaded from ${result.isSample ? 'FICTIONAL sample data' : result.filePath}:`, result.counts);
} else {
  console.log('Database already contains data - nothing seeded. Use `npm run seed:reset` to replace it.');
}
closeDb();
