/**
 * Form limits. Keep in sync with LIMITS in server/src/constants/index.js
 * (the server enforces them; the client only warns early).
 */
export const VALIDATION_LIMITS = Object.freeze({
  MAX_TEXT_LENGTH: 200,
  MAX_NOTES_LENGTH: 1000,
  MAX_END_PERIOD_LENGTH: 50,
  MAX_AMOUNT: 1_000_000_000,
});
