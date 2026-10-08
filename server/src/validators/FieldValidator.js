/**
 * Small, readable input validator.
 *
 * Each method reads one field from the input, records a user-friendly error
 * message if it is invalid, and returns the cleaned value. Call
 * `throwIfInvalid()` at the end to raise a ValidationError with every field error.
 *
 *   const v = new FieldValidator(req.body);
 *   const source = v.requiredText('source', 'Source');
 *   v.throwIfInvalid();
 */
const { ValidationError } = require('../utils/errors');
const { isValidIsoDate, isValidMonthKey } = require('../utils/dates');
const { LIMITS } = require('../constants');

const MAX_DECIMAL_PLACES = 2;

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === '';
}

class FieldValidator {
  constructor(input) {
    this.input = input && typeof input === 'object' ? input : {};
    this.errors = {};
  }

  addError(field, message) {
    if (!this.errors[field]) {
      this.errors[field] = message;
    }
  }

  get hasErrors() {
    return Object.keys(this.errors).length > 0;
  }

  throwIfInvalid() {
    if (this.hasErrors) {
      throw new ValidationError(this.errors);
    }
  }

  requiredText(field, label, maxLength = LIMITS.MAX_TEXT_LENGTH) {
    const value = this.input[field];
    if (isBlank(value)) {
      this.addError(field, `${label} is required.`);
      return null;
    }
    return this.checkTextLength(field, label, String(value).trim(), maxLength);
  }

  /** Returns trimmed text, or null when empty. */
  optionalText(field, label, maxLength = LIMITS.MAX_TEXT_LENGTH) {
    const value = this.input[field];
    if (isBlank(value)) {
      return null;
    }
    return this.checkTextLength(field, label, String(value).trim(), maxLength);
  }

  checkTextLength(field, label, text, maxLength) {
    if (text.length > maxLength) {
      this.addError(field, `${label} must be ${maxLength} characters or fewer.`);
    }
    return text;
  }

  amount(field, label = 'Amount') {
    const value = this.input[field];
    if (isBlank(value)) {
      this.addError(field, `${label} is required.`);
      return null;
    }

    const amount = Number(value);
    if (!Number.isFinite(amount)) {
      this.addError(field, `${label} must be a number.`);
      return null;
    }
    if (amount <= 0) {
      this.addError(field, `${label} must be greater than 0.`);
      return null;
    }
    if (amount > LIMITS.MAX_AMOUNT) {
      this.addError(field, `${label} is too large.`);
      return null;
    }
    const scaled = amount * 10 ** MAX_DECIMAL_PLACES;
    if (Math.abs(scaled - Math.round(scaled)) > 1e-6) {
      this.addError(field, `${label} can have at most ${MAX_DECIMAL_PLACES} decimal places.`);
      return null;
    }
    return amount;
  }

  isoDate(field, label, { required = true } = {}) {
    const value = this.input[field];
    if (isBlank(value)) {
      if (required) {
        this.addError(field, `${label} is required.`);
      }
      return null;
    }
    if (!isValidIsoDate(String(value))) {
      this.addError(field, `${label} must be a valid date (YYYY-MM-DD).`);
      return null;
    }
    return String(value);
  }

  monthKey(field, label = 'Month') {
    const value = this.input[field];
    if (isBlank(value)) {
      this.addError(field, `${label} is required.`);
      return null;
    }
    if (!isValidMonthKey(String(value))) {
      this.addError(field, `${label} must be a valid month (YYYY-MM).`);
      return null;
    }
    return String(value);
  }

  oneOf(field, label, allowedValues) {
    const value = this.input[field];
    if (isBlank(value)) {
      this.addError(field, `${label} is required.`);
      return null;
    }
    if (!allowedValues.includes(value)) {
      this.addError(field, `${label} must be one of: ${allowedValues.join(', ')}.`);
      return null;
    }
    return value;
  }

  id(field, label, { required = true } = {}) {
    const value = this.input[field];
    if (isBlank(value)) {
      if (required) {
        this.addError(field, `${label} is required.`);
      }
      return null;
    }
    const id = Number(value);
    if (!Number.isInteger(id) || id <= 0) {
      this.addError(field, `${label} is invalid.`);
      return null;
    }
    return id;
  }

  idList(field, label = 'Selection') {
    const value = this.input[field];
    if (!Array.isArray(value) || value.length === 0) {
      this.addError(field, `${label} must contain at least one record.`);
      return [];
    }
    if (value.length > LIMITS.MAX_BULK_IDS) {
      this.addError(field, `${label} can contain at most ${LIMITS.MAX_BULK_IDS} records.`);
      return [];
    }
    const ids = value.map(Number);
    if (!ids.every((id) => Number.isInteger(id) && id > 0)) {
      this.addError(field, `${label} contains an invalid record id.`);
      return [];
    }
    return [...new Set(ids)];
  }
}

module.exports = FieldValidator;
