/**
 * Queries that are identical for every record table (income, expenses,
 * upcoming_income): deletes, bulk deletes and counts. Status changes go through
 * each repository's update(), so services can adjust related fields at the same time.
 *
 * `tableName` always comes from code (see the repositories), never from user
 * input, so interpolating it is safe. All values use bound parameters.
 */
const { getDb } = require('../database/connection');

const SQL_NOW = "strftime('%Y-%m-%dT%H:%M:%fZ', 'now')";

function placeholdersFor(values) {
  return values.map(() => '?').join(', ');
}

function createRecordTableHelpers(tableName) {
  return {
    deleteById(id) {
      return getDb().prepare(`DELETE FROM ${tableName} WHERE id = ?`).run(id).changes;
    },

    deleteByIds(ids) {
      const sql = `DELETE FROM ${tableName} WHERE id IN (${placeholdersFor(ids)})`;
      return getDb()
        .prepare(sql)
        .run(...ids).changes;
    },

    deleteAll() {
      return getDb().prepare(`DELETE FROM ${tableName}`).run().changes;
    },

    countAll() {
      return getDb().prepare(`SELECT COUNT(*) AS total FROM ${tableName}`).get().total;
    },
  };
}

module.exports = { createRecordTableHelpers, placeholdersFor, SQL_NOW };
