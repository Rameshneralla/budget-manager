/** CLI: `npm run migrate` - applies pending SQL migrations. */
const env = require('../../config/env');
const { runMigrations } = require('../migrator');
const { closeDb } = require('../connection');

const applied = runMigrations();
console.log(`Database: ${env.databasePath}`);
console.log(applied.length > 0 ? `Applied: ${applied.join(', ')}` : 'Database schema is up to date.');
closeDb();
