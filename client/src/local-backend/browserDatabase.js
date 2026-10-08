/**
 * Opens the in-browser SQLite database (sql.js / WebAssembly):
 * loads the saved file from IndexedDB, applies the SAME migration files the
 * server uses (server/src/database/migrations), and registers it with the
 * connection shim so the shared repositories can use it.
 */
import initSqlJs from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm-browser.wasm?url';
import connection from './shims/connection.cjs';
import { SqliteAdapter } from './sqliteAdapter';
import { loadDatabaseFile, saveDatabaseFile } from './browserStorage';

const migrationFiles = import.meta.glob('../../../server/src/database/migrations/*.sql', {
  query: '?raw',
  import: 'default',
  eager: true,
});

let adapterPromise = null;
let sqlModulePromise = null;

function applyMigrations(adapter) {
  adapter.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name       TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    )
  `);
  const applied = new Set(
    adapter
      .prepare('SELECT name FROM schema_migrations')
      .all()
      .map((row) => row.name)
  );

  Object.keys(migrationFiles)
    .sort()
    .forEach((filePath) => {
      const name = filePath.split('/').pop();
      if (applied.has(name)) {
        return;
      }
      adapter.transaction(() => {
        adapter.exec(migrationFiles[filePath]);
        adapter.prepare('INSERT INTO schema_migrations (name) VALUES (?)').run(name);
      })();
    });
}

async function openDatabase() {
  const savedFile = await loadDatabaseFile();
  return activateDatabase(savedFile);
}

/** Loads the sql.js WebAssembly module once. */
function getSqlModule() {
  if (!sqlModulePromise) {
    sqlModulePromise = initSqlJs({ locateFile: () => sqlWasmUrl });
  }
  return sqlModulePromise;
}

/** Opens `bytes` (or a new empty database), brings it up to date and makes it the live database. */
async function activateDatabase(bytes) {
  const SQL = await getSqlModule();
  const adapter = new SqliteAdapter(bytes ? new SQL.Database(bytes) : new SQL.Database());
  adapter.exec('PRAGMA foreign_keys = ON');
  applyMigrations(adapter);
  connection.setDb(adapter);
  await saveDatabaseFile(adapter.exportBytes());
  return adapter;
}

/** Opens the database once and returns the same adapter afterwards. */
export function getBrowserDatabase() {
  if (!adapterPromise) {
    adapterPromise = openDatabase().catch((error) => {
      adapterPromise = null;
      throw error;
    });
  }
  return adapterPromise;
}

export async function persistBrowserDatabase() {
  const adapter = await getBrowserDatabase();
  await saveDatabaseFile(adapter.exportBytes());
}

/** The current database file (used by backups and sync). */
export async function exportDatabaseBytes() {
  const adapter = await getBrowserDatabase();
  return adapter.exportBytes();
}

/**
 * Replaces the whole database with another copy (e.g. the synced copy from GitHub).
 * Migrations run on it too, so a copy saved by an older app version is upgraded.
 */
export async function replaceBrowserDatabase(bytes) {
  const previous = await getBrowserDatabase();
  const adapter = await activateDatabase(bytes);
  adapterPromise = Promise.resolve(adapter);
  previous.close();
  return adapter;
}
