/** Writes and reads the audit history. Services call this; controllers never do. */
const auditLogRepository = require('../repositories/auditLogRepository');
const { LIMITS } = require('../constants');

/** Returns only the fields whose value changed: { status: { from: 'Pending', to: 'Received' } } */
function diffRecords(before, after, fieldNames) {
  const changes = {};
  for (const field of fieldNames) {
    if (before[field] !== after[field]) {
      changes[field] = { from: before[field] ?? null, to: after[field] ?? null };
    }
  }
  return changes;
}

function log(entry) {
  auditLogRepository.create(entry);
}

function getRecentActivity(rawLimit) {
  const requested = Number(rawLimit) || LIMITS.DEFAULT_AUDIT_LOG_LIMIT;
  const limit = Math.min(Math.max(requested, 1), LIMITS.MAX_AUDIT_LOG_LIMIT);
  return auditLogRepository.findRecent(limit);
}

module.exports = { log, diffRecords, getRecentActivity };
