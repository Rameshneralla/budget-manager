/**
 * Aggregate queries for the dashboard. Totals are always calculated from the
 * transaction tables - nothing here reads stored totals.
 * All amounts returned are in paise; the dashboard service converts them.
 */
const { getDb } = require('../database/connection');

const dashboardRepository = {
  getIncomeTotals(monthKey) {
    return getDb()
      .prepare(
        `SELECT
           COUNT(*)                                                         AS record_count,
           COALESCE(SUM(amount_paise), 0)                                   AS total_paise,
           COALESCE(SUM(CASE WHEN status = 'Received' THEN amount_paise END), 0) AS received_paise,
           COALESCE(SUM(CASE WHEN status = 'Pending'  THEN amount_paise END), 0) AS pending_paise
         FROM income
         WHERE month_key = ?`
      )
      .get(monthKey);
  },

  getExpenseTotals(monthKey) {
    return getDb()
      .prepare(
        `SELECT
           COUNT(*)                                                                AS record_count,
           COALESCE(SUM(amount_paise), 0)                                          AS total_paise,
           COALESCE(SUM(CASE WHEN status = 'Paid'    THEN amount_paise END), 0)    AS paid_paise,
           COALESCE(SUM(CASE WHEN status = 'Pending' THEN amount_paise END), 0)    AS pending_paise,
           COALESCE(SUM(CASE WHEN status = 'Closed'  THEN amount_paise END), 0)    AS closed_paise,
           COALESCE(SUM(CASE WHEN expense_type = 'Regular'    THEN amount_paise END), 0) AS regular_paise,
           COALESCE(SUM(CASE WHEN expense_type = 'Additional' THEN amount_paise END), 0) AS additional_paise
         FROM expenses
         WHERE month_key = ?`
      )
      .get(monthKey);
  },

  getUpcomingIncomeTotals(monthKey) {
    return getDb()
      .prepare(
        `SELECT
           COUNT(*)                                                                AS record_count,
           COALESCE(SUM(amount_paise), 0)                                          AS total_paise,
           COALESCE(SUM(CASE WHEN status <> 'Received' THEN amount_paise END), 0)  AS outstanding_paise
         FROM upcoming_income
         WHERE month_key = ?`
      )
      .get(monthKey);
  },

  /** Every category is returned (with 0 when unused) so the breakdown is stable. */
  getExpenseCategoryBreakdown(monthKey) {
    return getDb()
      .prepare(
        `SELECT
           c.id                              AS category_id,
           c.name                            AS category_name,
           COALESCE(SUM(e.amount_paise), 0)  AS amount_paise,
           COUNT(e.id)                       AS record_count
         FROM categories c
         LEFT JOIN expenses e ON e.category_id = c.id AND e.month_key = ?
         GROUP BY c.id
         ORDER BY c.sort_order, c.name`
      )
      .all(monthKey);
  },

  /** Only payment methods actually used in the month, largest first. */
  getExpensePaymentMethodSummary(monthKey) {
    return getDb()
      .prepare(
        `SELECT
           pm.id                   AS payment_method_id,
           pm.name                 AS payment_method_name,
           SUM(e.amount_paise)     AS amount_paise,
           COUNT(e.id)             AS record_count
         FROM expenses e
         JOIN payment_methods pm ON pm.id = e.payment_method_id
         WHERE e.month_key = ?
         GROUP BY pm.id
         ORDER BY amount_paise DESC, pm.sort_order`
      )
      .all(monthKey);
  },
};

module.exports = dashboardRepository;
