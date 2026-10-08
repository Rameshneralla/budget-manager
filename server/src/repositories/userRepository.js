/** SQL for the `users` table (currently the single application owner). */
const { getDb } = require('../database/connection');

const userRepository = {
  findOwner() {
    const row = getDb()
      .prepare('SELECT id, full_name, app_title, currency_code FROM users ORDER BY id LIMIT 1')
      .get();
    if (!row) {
      return null;
    }
    return {
      id: row.id,
      fullName: row.full_name,
      appTitle: row.app_title,
      currencyCode: row.currency_code,
    };
  },
};

module.exports = userRepository;
