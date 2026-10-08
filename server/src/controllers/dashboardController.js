const asyncHandler = require('../utils/asyncHandler');
const dashboardService = require('../services/dashboardService');

const dashboardController = {
  getDashboard: asyncHandler((req, res) => {
    res.json({ data: dashboardService.getDashboard(req.query.month) });
  }),
};

module.exports = dashboardController;
