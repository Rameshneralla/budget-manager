/** Export / import / backup endpoints (Settings > Data Management). */
const asyncHandler = require('../utils/asyncHandler');
const dataService = require('../services/dataService');

const dataController = {
  exportData: asyncHandler((req, res) => {
    const exported = dataService.exportData();
    const fileName = `budget-manager-export-${exported.exportedAt.slice(0, 10)}.json`;
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.json(exported);
  }),

  importData: asyncHandler((req, res) => {
    res.json({ data: dataService.importData(req.body, { source: 'import file' }) });
  }),

  backupDatabase: asyncHandler(async (req, res) => {
    res.status(201).json({ data: await dataService.backupDatabase() });
  }),
};

module.exports = dataController;
