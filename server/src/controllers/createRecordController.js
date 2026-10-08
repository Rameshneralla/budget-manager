/**
 * HTTP handlers for a record service built with createRecordService.
 * Controllers only translate HTTP <-> service calls; all rules live in services.
 * Responses use the envelope { data: ... }.
 */
const asyncHandler = require('../utils/asyncHandler');

const HTTP_CREATED = 201;

function createRecordController(service) {
  return {
    list: asyncHandler((req, res) => {
      res.json({ data: service.listByMonth(req.query.month) });
    }),

    getOne: asyncHandler((req, res) => {
      res.json({ data: service.getById(req.params.id) });
    }),

    create: asyncHandler((req, res) => {
      res.status(HTTP_CREATED).json({ data: service.create(req.body) });
    }),

    update: asyncHandler((req, res) => {
      res.json({ data: service.update(req.params.id, req.body) });
    }),

    changeStatus: asyncHandler((req, res) => {
      res.json({ data: service.changeStatus(req.params.id, req.body) });
    }),

    remove: asyncHandler((req, res) => {
      res.json({ data: service.remove(req.params.id) });
    }),

    bulkChangeStatus: asyncHandler((req, res) => {
      res.json({ data: service.bulkChangeStatus(req.body) });
    }),

    bulkRemove: asyncHandler((req, res) => {
      res.json({ data: service.bulkRemove(req.body) });
    }),
  };
}

module.exports = createRecordController;
