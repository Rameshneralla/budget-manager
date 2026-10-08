/** SQL for the `upcoming_income` table. Converts rows <-> API objects (paise <-> rupees). */
const { getDb } = require('../database/connection');
const { rupeesToPaise, paiseToRupees } = require('../utils/money');
const { createRecordTableHelpers, placeholdersFor, SQL_NOW } = require('./recordTableHelpers');

const SELECT_UPCOMING_INCOME = `
  SELECT
    u.id, u.month_key, u.expected_date, u.source, u.amount_paise, u.purpose,
    u.status, u.notes, u.created_at, u.updated_at
  FROM upcoming_income u`;

// Records without an expected date sort after dated ones.
const ORDER_BY_DATE = 'ORDER BY u.expected_date IS NULL, u.expected_date, u.id';

function toUpcomingIncome(row) {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    month: row.month_key,
    expectedDate: row.expected_date,
    source: row.source,
    amount: paiseToRupees(row.amount_paise),
    purpose: row.purpose,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRowParams(upcomingIncome) {
  return {
    monthKey: upcomingIncome.month,
    expectedDate: upcomingIncome.expectedDate,
    source: upcomingIncome.source,
    amountPaise: rupeesToPaise(upcomingIncome.amount),
    purpose: upcomingIncome.purpose,
    status: upcomingIncome.status,
    notes: upcomingIncome.notes,
  };
}

const upcomingIncomeRepository = {
  ...createRecordTableHelpers('upcoming_income'),

  findByMonth(monthKey) {
    const sql = `${SELECT_UPCOMING_INCOME} WHERE u.month_key = ? ${ORDER_BY_DATE}`;
    return getDb().prepare(sql).all(monthKey).map(toUpcomingIncome);
  },

  findAll() {
    const sql = `${SELECT_UPCOMING_INCOME} ORDER BY u.month_key, u.expected_date IS NULL, u.expected_date, u.id`;
    return getDb().prepare(sql).all().map(toUpcomingIncome);
  },

  findById(id) {
    return toUpcomingIncome(getDb().prepare(`${SELECT_UPCOMING_INCOME} WHERE u.id = ?`).get(id));
  },

  findByIds(ids) {
    const sql = `${SELECT_UPCOMING_INCOME} WHERE u.id IN (${placeholdersFor(ids)}) ${ORDER_BY_DATE}`;
    return getDb()
      .prepare(sql)
      .all(...ids)
      .map(toUpcomingIncome);
  },

  create(upcomingIncome) {
    const result = getDb()
      .prepare(
        `INSERT INTO upcoming_income
           (month_key, expected_date, source, amount_paise, purpose, status, notes)
         VALUES
           (@monthKey, @expectedDate, @source, @amountPaise, @purpose, @status, @notes)`
      )
      .run(toRowParams(upcomingIncome));
    return this.findById(result.lastInsertRowid);
  },

  update(id, upcomingIncome) {
    getDb()
      .prepare(
        `UPDATE upcoming_income SET
           month_key = @monthKey, expected_date = @expectedDate, source = @source,
           amount_paise = @amountPaise, purpose = @purpose, status = @status, notes = @notes,
           updated_at = ${SQL_NOW}
         WHERE id = @id`
      )
      .run({ ...toRowParams(upcomingIncome), id });
    return this.findById(id);
  },
};

module.exports = upcomingIncomeRepository;
