/**
 * Minimal, dependency-free migration runner.
 *
 * Every *.sql file in ./migrations is applied once, in filename order, inside a
 * transaction. Applied files are recorded in the `schema_migrations` table.
 */
const fs = require('fs');
const path = require('path');
const { getDb } = require('./connection');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

function ensureMigrationsTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name       TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    )
  `);
}

function listMigrationFiles() {
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((fileName) => fileName.endsWith('.sql'))
    .sort();
}

/** Applies pending migrations and returns the names of the ones applied. */
function runMigrations() {
  const db = getDb();
  ensureMigrationsTable(db);

  const appliedNames = new Set(
    db.prepare('SELECT name FROM schema_migrations').all().map((row) => row.name)
  );
  const pendingFiles = listMigrationFiles().filter((fileName) => !appliedNames.has(fileName));

  const recordMigration = db.prepare('INSERT INTO schema_migrations (name) VALUES (?)');

  for (const fileName of pendingFiles) {
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, fileName), 'utf8');
    db.transaction(() => {
      db.exec(sql);
      recordMigration.run(fileName);
    })();
  }

  return pendingFiles;
}

module.exports = { runMigrations };
