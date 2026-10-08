/** SQL for the `audit_logs` table (history of created/updated/deleted records). */
const { getDb } = require('../database/connection');

function toAuditLog(row) {
  return {
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    action: row.action,
    summary: row.summary,
    details: row.details ? JSON.parse(row.details) : null,
    createdAt: row.created_at,
  };
}

const auditLogRepository = {
  create({ entityType, entityId = null, action, summary, details = null }) {
    getDb()
      .prepare(
        `INSERT INTO audit_logs (entity_type, entity_id, action, summary, details)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(entityType, entityId, action, summary, details ? JSON.stringify(details) : null);
  },

  findRecent(limit) {
    return getDb()
      .prepare('SELECT * FROM audit_logs ORDER BY created_at DESC, id DESC LIMIT ?')
      .all(limit)
      .map(toAuditLog);
  },
};

module.exports = auditLogRepository;
