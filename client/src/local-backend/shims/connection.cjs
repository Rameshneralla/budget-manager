/**
 * Browser replacement for server/src/database/connection.js (swapped in by the
 * Vite build in "pages" mode). Exposes the same getDb / runInTransaction API, so
 * the server's repositories and services run unchanged on top of sql.js.
 * The database itself is opened by ../browserDatabase.js and registered with setDb().
 */
let database = null;

function setDb(adapter) {
  database = adapter;
}

function getDb() {
  if (!database) {
    throw new Error('The in-browser database has not been opened yet.');
  }
  return database;
}

function runInTransaction(work) {
  return getDb().transaction(work)();
}

function closeDb() {
  database = null;
}

module.exports = { getDb, closeDb, runInTransaction, setDb };
