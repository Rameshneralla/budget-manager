/**
 * Login / logout / session status.
 *   GET  /api/auth/session  -> { authRequired, authenticated }
 *   POST /api/auth/login    { password } -> sets the session cookie
 *   POST /api/auth/logout   -> clears the session cookie
 */
const env = require('../config/env');
const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/authService');
const { hasValidSession } = require('../middleware/requireAuth');
const { SESSION_COOKIE_NAME } = require('../constants');

function cookieOptions() {
  return {
    httpOnly: true, // not readable from JavaScript
    sameSite: 'strict', // not sent with requests from other sites (CSRF protection)
    secure: env.isProduction, // HTTPS only in production
    path: '/',
  };
}

const authController = {
  getSession: asyncHandler((req, res) => {
    res.json({
      data: {
        authRequired: env.auth.isEnabled,
        authenticated: !env.auth.isEnabled || hasValidSession(req),
      },
    });
  }),

  login: asyncHandler((req, res) => {
    const { token, expiresAt } = authService.login(req.body?.password, req.ip);
    res.cookie(SESSION_COOKIE_NAME, token, { ...cookieOptions(), expires: new Date(expiresAt) });
    res.json({ data: { authenticated: true } });
  }),

  logout: asyncHandler((req, res) => {
    res.clearCookie(SESSION_COOKIE_NAME, cookieOptions());
    res.json({ data: { authenticated: false } });
  }),
};

module.exports = authController;
