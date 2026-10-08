/**
 * Blocks API requests without a valid session cookie (401).
 * Does nothing when no APP_PASSWORD is configured (local, open mode).
 */
const env = require('../config/env');
const { AppError } = require('../utils/errors');
const { parseCookies } = require('../utils/cookies');
const { isValidSessionToken } = require('../services/authService');
const { SESSION_COOKIE_NAME } = require('../constants');

function hasValidSession(req) {
  return isValidSessionToken(parseCookies(req.headers.cookie)[SESSION_COOKIE_NAME]);
}

function requireAuth(req, res, next) {
  if (!env.auth.isEnabled || hasValidSession(req)) {
    next();
    return;
  }
  next(new AppError('Please sign in to continue.', 401, 'UNAUTHENTICATED'));
}

module.exports = { requireAuth, hasValidSession };
