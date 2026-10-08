/**
 * Central error handling. Every error ends here and becomes:
 *   { error: { code, message, details? } }
 * Raw database errors and stack traces are logged on the server, never sent to the client.
 */
const { AppError } = require('../utils/errors');

const GENERIC_MESSAGE = 'Something went wrong. Please try again.';
const DATABASE_MESSAGE = 'A database error occurred. Your changes were not saved.';

function isDatabaseError(error) {
  return typeof error.code === 'string' && error.code.startsWith('SQLITE_');
}

/** Maps known non-AppError errors (body parser, SQLite) to safe responses. */
function toSafeError(error) {
  if (error instanceof AppError) {
    return error;
  }
  if (error.type === 'entity.parse.failed') {
    return new AppError('The request body is not valid JSON.', 400, 'INVALID_JSON');
  }
  if (error.type === 'entity.too.large') {
    return new AppError('The request is too large.', 413, 'PAYLOAD_TOO_LARGE');
  }
  if (isDatabaseError(error)) {
    return new AppError(DATABASE_MESSAGE, 500, 'DATABASE_ERROR');
  }
  return new AppError(GENERIC_MESSAGE, 500, 'INTERNAL_ERROR');
}

// Express recognises error middleware by its four arguments.
function errorHandler(error, req, res, _next) {
  const safeError = toSafeError(error);

  if (safeError.statusCode >= 500) {
    console.error(`[${req.method} ${req.originalUrl}]`, error);
  }

  const body = { error: { code: safeError.code, message: safeError.message } };
  if (safeError.details) {
    body.error.details = safeError.details;
  }
  res.status(safeError.statusCode).json(body);
}

module.exports = errorHandler;
