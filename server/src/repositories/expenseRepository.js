/** SQL for the `expenses` table. Converts rows <-> API objects (paise <-> rupees). */
const { getDb } = require('../database/connection');
const { rupeesToPaise, paiseToRupees } = require('../utils/money');
const { createRecordTableHelpers, placeholdersFor, SQL_NOW } = require('./recordTableHelpers');

const SELECT_EXPENSE = `
  SELECT
    e.id, e.month_key, e.transaction_date, e.category_id, c.name AS category_name,
    e.payee, e.amount_paise, e.purpose, e.expense_type,
    e.payment_method_id, pm.name AS payment_method_name,
    e.reference, e.end_period, e.status, e.notes, e.created_at, e.updated_at
  FROM expenses e
  JOIN categories c ON c.id = e.category_id
  JOIN payment_methods pm ON pm.id = e.payment_method_id`;

const ORDER_BY_DATE = 'ORDER BY e.transaction_date, c.sort_order, e.id';

function toExpense(row) {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    month: row.month_key,
    date: row.transaction_date,
    categoryId: row.category_id,
    category: row.category_name,
    payee: row.payee,
    amount: paiseToRupees(row.amount_paise),
    purpose: row.purpose,
    expenseType: row.expense_type,
    paymentMethodId: row.payment_method_id,
    paymentMethod: row.payment_method_name,
    reference: row.reference,
    endPeriod: row.end_period,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRowParams(expense) {
  return {
    monthKey: expense.month,
    date: expense.date,
    categoryId: expense.categoryId,
    payee: expense.payee,
    amountPaise: rupeesToPaise(expense.amount),
    purpose: expense.purpose,
    expenseType: expense.expenseType,
    paymentMethodId: expense.paymentMethodId,
    reference: expense.reference,
    endPeriod: expense.endPeriod,
    status: expense.status,
    notes: expense.notes,
  };
}

const expenseRepository = {
  ...createRecordTableHelpers('expenses'),

  findByMonth(monthKey) {
    const rows = getDb()
      .prepare(`${SELECT_EXPENSE} WHERE e.month_key = ? ${ORDER_BY_DATE}`)
      .all(monthKey);
    return rows.map(toExpense);
  },

  findAll() {
    return getDb().prepare(`${SELECT_EXPENSE} ${ORDER_BY_DATE}`).all().map(toExpense);
  },

  findById(id) {
    return toExpense(getDb().prepare(`${SELECT_EXPENSE} WHERE e.id = ?`).get(id));
  },

  findByIds(ids) {
    const sql = `${SELECT_EXPENSE} WHERE e.id IN (${placeholdersFor(ids)}) ${ORDER_BY_DATE}`;
    return getDb()
      .prepare(sql)
      .all(...ids)
      .map(toExpense);
  },

  create(expense) {
    const result = getDb()
      .prepare(
        `INSERT INTO expenses
           (month_key, transaction_date, category_id, payee, amount_paise, purpose,
            expense_type, payment_method_id, reference, end_period, status, notes)
         VALUES
           (@monthKey, @date, @categoryId, @payee, @amountPaise, @purpose,
            @expenseType, @paymentMethodId, @reference, @endPeriod, @status, @notes)`
      )
      .run(toRowParams(expense));
    return this.findById(result.lastInsertRowid);
  },

  update(id, expense) {
    getDb()
      .prepare(
        `UPDATE expenses SET
           month_key = @monthKey, transaction_date = @date, category_id = @categoryId,
           payee = @payee, amount_paise = @amountPaise, purpose = @purpose,
           expense_type = @expenseType, payment_method_id = @paymentMethodId,
           reference = @reference, end_period = @endPeriod, status = @status, notes = @notes,
           updated_at = ${SQL_NOW}
         WHERE id = @id`
      )
      .run({ ...toRowParams(expense), id });
    return this.findById(id);
  },
};

module.exports = expenseRepository;
