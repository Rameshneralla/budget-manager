/** Validators shared by every record type (ids, month query, status, bulk payloads). */
const FieldValidator = require('./FieldValidator');

function validateRecordId(rawId) {
  const v = new FieldValidator({ id: rawId });
  const id = v.id('id', 'Record id');
  v.throwIfInvalid();
  return id;
}

function validateMonthQuery(query) {
  const v = new FieldValidator(query);
  const month = v.monthKey('month');
  v.throwIfInvalid();
  return month;
}

function validateStatusChange(body, allowedStatuses) {
  const v = new FieldValidator(body);
  const status = v.oneOf('status', 'Status', allowedStatuses);
  v.throwIfInvalid();
  return status;
}

function validateBulkStatusChange(body, allowedStatuses) {
  const v = new FieldValidator(body);
  const ids = v.idList('ids');
  const status = v.oneOf('status', 'Status', allowedStatuses);
  v.throwIfInvalid();
  return { ids, status };
}

function validateBulkDelete(body) {
  const v = new FieldValidator(body);
  const ids = v.idList('ids');
  v.throwIfInvalid();
  return ids;
}

module.exports = {
  validateRecordId,
  validateMonthQuery,
  validateStatusChange,
  validateBulkStatusChange,
  validateBulkDelete,
};
