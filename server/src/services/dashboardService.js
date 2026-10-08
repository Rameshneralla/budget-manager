/**
 * Builds the dashboard for one month. Every number is calculated from the
 * transaction tables on each request, so it is always in sync with the records.
 *
 * Formulas
 *   Available Balance = Received Income - Paid Expenses
 *   Potential Balance = Total Income   - Total Expenses
 */
const dashboardRepository = require('../repositories/dashboardRepository');
const { validateMonthQuery } = require('../validators/commonValidators');
const { paiseToRupees } = require('../utils/money');

const PERCENT_DECIMAL_PLACES = 1;

/** Share of `partPaise` in `totalPaise`, e.g. 70.3 (percent, one decimal). */
function percentageOf(partPaise, totalPaise) {
  if (totalPaise === 0) {
    return 0;
  }
  const factor = 10 ** PERCENT_DECIMAL_PLACES;
  return Math.round((partPaise / totalPaise) * 100 * factor) / factor;
}

function buildSummary(incomeTotals, expenseTotals, upcomingTotals) {
  return {
    totalIncome: paiseToRupees(incomeTotals.total_paise),
    receivedIncome: paiseToRupees(incomeTotals.received_paise),
    pendingIncome: paiseToRupees(incomeTotals.pending_paise),

    totalExpenses: paiseToRupees(expenseTotals.total_paise),
    paidExpenses: paiseToRupees(expenseTotals.paid_paise),
    pendingExpenses: paiseToRupees(expenseTotals.pending_paise),
    closedExpenses: paiseToRupees(expenseTotals.closed_paise),
    regularCommitments: paiseToRupees(expenseTotals.regular_paise),
    oneTimeExpenses: paiseToRupees(expenseTotals.additional_paise),

    upcomingIncome: paiseToRupees(upcomingTotals.total_paise),
    upcomingIncomeOutstanding: paiseToRupees(upcomingTotals.outstanding_paise),

    availableBalance: paiseToRupees(incomeTotals.received_paise - expenseTotals.paid_paise),
    potentialBalance: paiseToRupees(incomeTotals.total_paise - expenseTotals.total_paise),
  };
}

function buildCategoryBreakdown(categoryRows, totalExpensesPaise) {
  return categoryRows.map((row) => ({
    categoryId: row.category_id,
    category: row.category_name,
    amount: paiseToRupees(row.amount_paise),
    percentage: percentageOf(row.amount_paise, totalExpensesPaise),
    count: row.record_count,
  }));
}

function buildPaymentMethodSummary(paymentRows, totalExpensesPaise) {
  return paymentRows.map((row) => ({
    paymentMethodId: row.payment_method_id,
    paymentMethod: row.payment_method_name,
    amount: paiseToRupees(row.amount_paise),
    percentage: percentageOf(row.amount_paise, totalExpensesPaise),
    count: row.record_count,
  }));
}

function getDashboard(rawMonth) {
  const monthKey = validateMonthQuery({ month: rawMonth });

  const incomeTotals = dashboardRepository.getIncomeTotals(monthKey);
  const expenseTotals = dashboardRepository.getExpenseTotals(monthKey);
  const upcomingTotals = dashboardRepository.getUpcomingIncomeTotals(monthKey);
  const categoryRows = dashboardRepository.getExpenseCategoryBreakdown(monthKey);
  const paymentRows = dashboardRepository.getExpensePaymentMethodSummary(monthKey);

  return {
    month: monthKey,
    summary: buildSummary(incomeTotals, expenseTotals, upcomingTotals),
    counts: {
      income: incomeTotals.record_count,
      expenses: expenseTotals.record_count,
      upcomingIncome: upcomingTotals.record_count,
    },
    categoryBreakdown: buildCategoryBreakdown(categoryRows, expenseTotals.total_paise),
    paymentMethodSummary: buildPaymentMethodSummary(paymentRows, expenseTotals.total_paise),
  };
}

module.exports = { getDashboard };
