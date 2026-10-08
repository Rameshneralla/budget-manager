/**
 * Builds the standard service for a record type (income, expense).
 *
 * Every record type supports the same operations - list by month, get, create,
 * update, delete, change status, bulk status and bulk delete - so the workflow
 * lives here once. Each concrete service (incomeService.js, ...) only supplies
 * what is different: its repository, validator, statuses and how to read its month.
 */
const monthRepository = require('../repositories/monthRepository');
const auditService = require('./auditService');
const { runInTransaction } = require('../database/connection');
const { NotFoundError } = require('../utils/errors');
const { AUDIT_ACTIONS } = require('../constants');
const {
  validateRecordId,
  validateMonthQuery,
  validateStatusChange,
  validateBulkStatusChange,
  validateBulkDelete,
} = require('../validators/commonValidators');

/**
 * @param {object}   config
 * @param {string}   config.entityType       value stored in audit_logs.entity_type
 * @param {string}   config.entityLabel      human name used in messages, e.g. 'Income'
 * @param {object}   config.repository       repository with find/create/update/delete methods
 * @param {Function} config.validateInput    (body) => cleaned input, throws ValidationError
 * @param {string[]} config.statuses         allowed status values
 * @param {Function} config.getMonthKey      (cleanInput) => 'YYYY-MM'
 * @param {Function} config.describe         (record) => short label, e.g. 'House Rent'
 * @param {Function} [config.checkReferences] (cleanInput) => void, throws ValidationError
 * @param {string[]} config.auditedFields    fields compared when logging an update
 * @param {Function} [config.applyStatusChange] (record with new status, previous record) => record
 *                   to save - e.g. fill in the actual received/paid date
 * @param {Function} [config.afterWrite]  (savedRecord, previousRecord | null) => void, runs in the
 *                   same transaction after every create / update / status change
 */
function createRecordService(config) {
  const {
    entityType,
    entityLabel,
    repository,
    validateInput,
    statuses,
    getMonthKey,
    describe,
    checkReferences = () => {},
    auditedFields,
    applyStatusChange = (record) => record,
    afterWrite = () => {},
  } = config;

  const notFoundMessage = `${entityLabel} record not found. It may have been deleted.`;

  function findExisting(id) {
    const record = repository.findById(id);
    if (!record) {
      throw new NotFoundError(notFoundMessage);
    }
    return record;
  }

  /** For bulk operations: every selected id must still exist. */
  function findAllExisting(ids) {
    const records = repository.findByIds(ids);
    if (records.length !== ids.length) {
      throw new NotFoundError(
        'Some selected records no longer exist. Please refresh the page and try again.'
      );
    }
    return records;
  }

  function prepareInput(body) {
    const input = validateInput(body);
    checkReferences(input);
    return { ...input, month: getMonthKey(input) };
  }

  function logStatusChange(record, fromStatus, toStatus) {
    auditService.log({
      entityType,
      entityId: record.id,
      action: AUDIT_ACTIONS.STATUS_CHANGED,
      summary: `${entityLabel} "${describe(record)}" status changed from ${fromStatus} to ${toStatus}`,
      details: { status: { from: fromStatus, to: toStatus } },
    });
  }

  /** Saves a status change (plus any fields applyStatusChange adds) and runs afterWrite. */
  function saveStatusChange(record, status) {
    const changed = applyStatusChange({ ...record, status }, record);
    const updated = repository.update(record.id, changed);
    logStatusChange(record, record.status, status);
    afterWrite(updated, record);
    return updated;
  }

  function logDeletion(record) {
    auditService.log({
      entityType,
      entityId: record.id,
      action: AUDIT_ACTIONS.DELETED,
      summary: `${entityLabel} "${describe(record)}" deleted`,
      details: { deletedRecord: record },
    });
  }

  return {
    statuses,

    listByMonth(rawMonth) {
      const monthKey = validateMonthQuery({ month: rawMonth });
      return repository.findByMonth(monthKey);
    },

    getById(rawId) {
      return findExisting(validateRecordId(rawId));
    },

    create(body) {
      const input = prepareInput(body);

      return runInTransaction(() => {
        monthRepository.ensureExists(input.month);
        const created = repository.create(input);
        auditService.log({
          entityType,
          entityId: created.id,
          action: AUDIT_ACTIONS.CREATED,
          summary: `${entityLabel} "${describe(created)}" created`,
        });
        afterWrite(created, null);
        return repository.findById(created.id);
      });
    },

    update(rawId, body) {
      const id = validateRecordId(rawId);
      const input = prepareInput(body);

      return runInTransaction(() => {
        const before = findExisting(id);
        monthRepository.ensureExists(input.month);
        const updated = repository.update(id, input);
        monthRepository.deleteUnused();
        auditService.log({
          entityType,
          entityId: id,
          action: AUDIT_ACTIONS.UPDATED,
          summary: `${entityLabel} "${describe(updated)}" updated`,
          details: auditService.diffRecords(before, updated, auditedFields),
        });
        afterWrite(updated, before);
        return repository.findById(id);
      });
    },

    changeStatus(rawId, body) {
      const id = validateRecordId(rawId);
      const status = validateStatusChange(body, statuses);

      return runInTransaction(() => {
        const before = findExisting(id);
        if (before.status === status) {
          return before;
        }
        saveStatusChange(before, status);
        return repository.findById(id);
      });
    },

    bulkChangeStatus(body) {
      const { ids, status } = validateBulkStatusChange(body, statuses);

      return runInTransaction(() => {
        const records = findAllExisting(ids);
        records
          .filter((record) => record.status !== status)
          .forEach((record) => saveStatusChange(record, status));
        return { updatedCount: records.length, status };
      });
    },

    remove(rawId) {
      const id = validateRecordId(rawId);

      return runInTransaction(() => {
        const record = findExisting(id);
        repository.deleteById(id);
        monthRepository.deleteUnused();
        logDeletion(record);
        return record;
      });
    },

    bulkRemove(body) {
      const ids = validateBulkDelete(body);

      return runInTransaction(() => {
        const records = findAllExisting(ids);
        const deletedCount = repository.deleteByIds(ids);
        monthRepository.deleteUnused();
        records.forEach(logDeletion);
        return { deletedCount };
      });
    },
  };
}

module.exports = createRecordService;
