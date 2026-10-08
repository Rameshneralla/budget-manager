/**
 * Standard REST routes for a record type. Mounted at /api/income,
 * /api/expenses (see routes/index.js).
 *
 *   GET    /?month=YYYY-MM   list records for a month
 *   GET    /:id              one record
 *   POST   /                 create
 *   PUT    /:id              full update
 *   PATCH  /:id/status       change status only   { status }
 *   DELETE /:id              delete
 *   POST   /bulk-status      change many statuses  { ids: [], status }
 *   POST   /bulk-delete      delete many           { ids: [] }
 */
const express = require('express');

function createRecordRouter(controller) {
  const router = express.Router();

  // Bulk routes first so they are never captured by "/:id".
  router.post('/bulk-status', controller.bulkChangeStatus);
  router.post('/bulk-delete', controller.bulkRemove);

  router.get('/', controller.list);
  router.post('/', controller.create);
  router.get('/:id', controller.getOne);
  router.put('/:id', controller.update);
  router.patch('/:id/status', controller.changeStatus);
  router.delete('/:id', controller.remove);

  return router;
}

module.exports = createRecordRouter;
