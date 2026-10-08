/** SQL for the `months` table - the source of the month dropdown. */
const { getDb } = require('../database/connection');

const monthRepository = {
  /** Oldest first, e.g. ['2026-10', '2026-11']. */
  findAllKeys() {
    return getDb()
      .prepare('SELECT month_key FROM months ORDER BY month_key')
      .all()
      .map((row) => row.month_key);
  },

  exists(monthKey) {
    return Boolean(getDb().prepare('SELECT 1 FROM months WHERE month_key = ?').get(monthKey));
  },

  /** Inserts the month if it is new. Safe to call repeatedly. */
  ensureExists(monthKey) {
    getDb().prepare('INSERT OR IGNORE INTO months (month_key) VALUES (?)').run(monthKey);
  },

  /** Removes months that no longer have any record (e.g. after the last one was deleted). */
  deleteUnused() {
    return getDb()
      .prepare(
        `DELETE FROM months
         WHERE month_key NOT IN (
           SELECT month_key FROM income
           UNION SELECT month_key FROM expenses
         )`
      )
      .run().changes;
  },

  deleteAll() {
    return getDb().prepare('DELETE FROM months').run().changes;
  },
};

module.exports = monthRepository;
