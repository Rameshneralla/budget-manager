/**
 * Single-password login for the owner.
 *
 * - The password comes from APP_PASSWORD (server/.env); it is never stored in the database.
 * - A successful login returns a session token "<expiresAt>.<signature>" signed
 *   with HMAC-SHA256. It is sent as an httpOnly cookie, so page scripts cannot read it.
 * - Repeated wrong passwords from one address are temporarily blocked.
 *
 * To support multiple users later, replace verifyPassword with a lookup in the
 * `users` table and put the user id in the token.
 */
const crypto = require('crypto');
const env = require('../config/env');
const { AppError } = require('../utils/errors');

const MS_PER_HOUR = 60 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;

const sessionSecret = env.auth.sessionSecret || crypto.randomBytes(32).toString('hex');
const failedAttemptsByClient = new Map(); // clientKey -> { count, firstFailedAt }

function hmac(value) {
  return crypto.createHmac('sha256', sessionSecret).update(value).digest();
}

/** Constant-time comparison (hashing first makes the lengths equal). */
function safeEqual(first, second) {
  return crypto.timingSafeEqual(hmac(String(first)), hmac(String(second)));
}

function sign(payload) {
  return hmac(payload).toString('base64url');
}

/* ------------------------------ Rate limiting ------------------------------ */

function getRecentFailures(clientKey) {
  const entry = failedAttemptsByClient.get(clientKey);
  if (!entry || Date.now() - entry.firstFailedAt > LOCKOUT_WINDOW_MS) {
    failedAttemptsByClient.delete(clientKey);
    return null;
  }
  return entry;
}

function recordFailure(clientKey) {
  const entry = getRecentFailures(clientKey) || { count: 0, firstFailedAt: Date.now() };
  entry.count += 1;
  failedAttemptsByClient.set(clientKey, entry);
}

function assertNotLockedOut(clientKey) {
  const entry = getRecentFailures(clientKey);
  if (entry && entry.count >= MAX_FAILED_ATTEMPTS) {
    throw new AppError(
      'Too many incorrect attempts. Please wait 15 minutes and try again.',
      429,
      'TOO_MANY_ATTEMPTS'
    );
  }
}

/* --------------------------------- Sessions -------------------------------- */

function createSessionToken() {
  const expiresAt = Date.now() + env.auth.sessionMaxAgeHours * MS_PER_HOUR;
  const payload = String(expiresAt);
  return { token: `${payload}.${sign(payload)}`, expiresAt };
}

function isValidSessionToken(token) {
  if (typeof token !== 'string') {
    return false;
  }
  const [payload, signature] = token.split('.');
  if (!payload || !signature) {
    return false;
  }
  const expectedSignature = sign(payload);
  const signatureMatches =
    signature.length === expectedSignature.length &&
    crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  return signatureMatches && Number(payload) > Date.now();
}

/**
 * Checks the password and returns a new session, or throws a 401 / 429 error.
 * @param {unknown} password
 * @param {string}  clientKey  usually the client IP, used for rate limiting
 */
function login(password, clientKey) {
  assertNotLockedOut(clientKey);
  if (typeof password !== 'string' || password === '' || !safeEqual(password, env.auth.password)) {
    recordFailure(clientKey);
    throw new AppError('Incorrect password.', 401, 'INVALID_PASSWORD');
  }
  failedAttemptsByClient.delete(clientKey);
  return createSessionToken();
}

module.exports = { login, isValidSessionToken };
