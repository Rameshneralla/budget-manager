/** SQL for reference data: expense categories and payment methods. */
const { getDb } = require('../database/connection');

const lookupRepository = {
  findAllCategories() {
    return getDb()
      .prepare('SELECT id, name, description FROM categories ORDER BY sort_order, name')
      .all();
  },

  findAllPaymentMethods() {
    return getDb().prepare('SELECT id, name FROM payment_methods ORDER BY sort_order, name').all();
  },

  categoryExists(id) {
    return Boolean(getDb().prepare('SELECT 1 FROM categories WHERE id = ?').get(id));
  },

  paymentMethodExists(id) {
    return Boolean(getDb().prepare('SELECT 1 FROM payment_methods WHERE id = ?').get(id));
  },
};

module.exports = lookupRepository;
