/**
 * Single shared SQLite connection.
 *
 * Only repositories (and the migration/seed scripts) should import this file.
 * To move to PostgreSQL/MySQL later, replace this module and the SQL inside
 * server/src/repositories - services, controllers and the frontend stay unchanged.
 */
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const env = require('../config/env');

let connection = null;

function openDatabase(databasePath) {
  if (databasePath !== ':memory:') {
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  }

  const db = new Database(databasePath);
  db.pragma('journal_mode = WAL'); // better concurrency for reads while writing
  db.pragma('foreign_keys = ON'); // SQLite disables FK checks unless asked
  return db;
}

function getDb() {
  if (!connection) {
    connection = openDatabase(env.databasePath);
  }
  return connection;
}

function closeDb() {
  if (connection) {
    connection.close();
    connection = null;
  }
}

/** Runs `work` inside a transaction; rolls back automatically if it throws. */
function runInTransaction(work) {
  const db = getDb();
  return db.transaction(work)();
}

module.exports = { getDb, closeDb, runInTransaction };
