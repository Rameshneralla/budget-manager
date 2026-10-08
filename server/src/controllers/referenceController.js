/** Read-only reference endpoints: months, meta (lookups) and recent activity. */
const asyncHandler = require('../utils/asyncHandler');
const monthService = require('../services/monthService');
const metaService = require('../services/metaService');
const auditService = require('../services/auditService');

const referenceController = {
  listMonths: asyncHandler((req, res) => {
    res.json({ data: monthService.listMonths() });
  }),

  getMeta: asyncHandler((req, res) => {
    res.json({ data: metaService.getMeta() });
  }),

  listActivity: asyncHandler((req, res) => {
    res.json({ data: auditService.getRecentActivity(req.query.limit) });
  }),
};

module.exports = referenceController;
