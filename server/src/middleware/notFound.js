/** 404 for unknown /api routes. */
const { NotFoundError } = require('../utils/errors');

function notFound(req, res, next) {
  next(new NotFoundError(`API route not found: ${req.method} ${req.originalUrl}`));
}

module.exports = notFound;
