/**
 * Money is stored as integer paise in the database and exposed as rupees in the API.
 * Keep all conversions here so rounding behaves the same everywhere.
 */

const PAISE_PER_RUPEE = 100;

function rupeesToPaise(rupees) {
  return Math.round(Number(rupees) * PAISE_PER_RUPEE);
}

function paiseToRupees(paise) {
  return Number(paise || 0) / PAISE_PER_RUPEE;
}

module.exports = { rupeesToPaise, paiseToRupees };
