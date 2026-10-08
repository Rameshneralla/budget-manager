/**
 * Application error types. Throw these from services; the central error
 * middleware turns them into consistent JSON responses.
 */

class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = undefined) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

class ValidationError extends AppError {
  /** @param {Record<string, string>} fieldErrors e.g. { amount: 'Amount must be greater than 0' } */
  constructor(fieldErrors, message = 'Please correct the highlighted fields.') {
    super(message, 400, 'VALIDATION_ERROR', fieldErrors);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'The requested record was not found.') {
    super(message, 404, 'NOT_FOUND');
  }
}

module.exports = { AppError, ValidationError, NotFoundError };
