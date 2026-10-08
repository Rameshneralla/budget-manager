/** SQL for the `income` table. Converts rows <-> API objects (paise <-> rupees). */
const { getDb } = require('../database/connection');
const { rupeesToPaise, paiseToRupees } = require('../utils/money');
const { createRecordTableHelpers, placeholdersFor, SQL_NOW } = require('./recordTableHelpers');

const SELECT_INCOME = `
  SELECT
    i.id, i.month_key, i.income_type, i.due_date, i.received_date, i.source, i.amount_paise,
    i.purpose,
    i.status, i.payment_method_id, pm.name AS payment_method_name,
    i.reference, i.notes, i.created_at, i.updated_at
  FROM income i
  LEFT JOIN payment_methods pm ON pm.id = i.payment_method_id`;

const ORDER_BY_DATE = 'ORDER BY i.due_date, i.id';

function toIncome(row) {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    month: row.month_key,
    incomeType: row.income_type,
    dueDate: row.due_date,
    receivedDate: row.received_date,
    source: row.source,
    amount: paiseToRupees(row.amount_paise),
    purpose: row.purpose,
    status: row.status,
    paymentMethodId: row.payment_method_id,
    paymentMethod: row.payment_method_name,
    reference: row.reference,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRowParams(income) {
  return {
    monthKey: income.month,
    incomeType: income.incomeType,
    dueDate: income.dueDate,
    receivedDate: income.receivedDate ?? null,
    source: income.source,
    amountPaise: rupeesToPaise(income.amount),
    purpose: income.purpose,
    status: income.status,
    paymentMethodId: income.paymentMethodId,
    reference: income.reference,
    notes: income.notes,
  };
}

const incomeRepository = {
  ...createRecordTableHelpers('income'),

  findByMonth(monthKey) {
    const rows = getDb()
      .prepare(`${SELECT_INCOME} WHERE i.month_key = ? ${ORDER_BY_DATE}`)
      .all(monthKey);
    return rows.map(toIncome);
  },

  findAll() {
    return getDb().prepare(`${SELECT_INCOME} ${ORDER_BY_DATE}`).all().map(toIncome);
  },

  findById(id) {
    return toIncome(getDb().prepare(`${SELECT_INCOME} WHERE i.id = ?`).get(id));
  },

  findByIds(ids) {
    const sql = `${SELECT_INCOME} WHERE i.id IN (${placeholdersFor(ids)}) ${ORDER_BY_DATE}`;
    return getDb()
      .prepare(sql)
      .all(...ids)
      .map(toIncome);
  },

  create(income) {
    const result = getDb()
      .prepare(
        `INSERT INTO income
           (month_key, income_type, due_date, received_date, source, amount_paise, purpose,
            status, payment_method_id, reference, notes)
         VALUES
           (@monthKey, @incomeType, @dueDate, @receivedDate, @source, @amountPaise, @purpose,
            @status, @paymentMethodId, @reference, @notes)`
      )
      .run(toRowParams(income));
    return this.findById(result.lastInsertRowid);
  },

  update(id, income) {
    getDb()
      .prepare(
        `UPDATE income SET
           month_key = @monthKey, income_type = @incomeType, due_date = @dueDate,
           received_date = @receivedDate,
           source = @source,
           amount_paise = @amountPaise, purpose = @purpose, status = @status,
           payment_method_id = @paymentMethodId, reference = @reference, notes = @notes,
           updated_at = ${SQL_NOW}
         WHERE id = @id`
      )
      .run({ ...toRowParams(income), id });
    return this.findById(id);
  },
};

module.exports = incomeRepository;
