/**
 * Every API route in one place. Start here to find the controller for an endpoint.
 * All routes below are mounted under /api (see app.js).
 */
const express = require('express');
const createRecordRouter = require('./createRecordRouter');
const {
  incomeController,
  expenseController,
  upcomingIncomeController,
} = require('../controllers/recordControllers');
const dashboardController = require('../controllers/dashboardController');
const referenceController = require('../controllers/referenceController');
const dataController = require('../controllers/dataController');
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/requireAuth');

const router = express.Router();

// Public routes
router.get('/health', (req, res) => res.json({ data: { status: 'ok' } }));
router.get('/auth/session', authController.getSession);
router.post('/auth/login', authController.login);
router.post('/auth/logout', authController.logout);

// Everything below needs a signed-in session (when APP_PASSWORD is set).
router.use(requireAuth);

router.get('/meta', referenceController.getMeta);
router.get('/months', referenceController.listMonths);
router.get('/activity', referenceController.listActivity);
router.get('/dashboard', dashboardController.getDashboard);

router.use('/income', createRecordRouter(incomeController));
router.use('/expenses', createRecordRouter(expenseController));
router.use('/upcoming-income', createRecordRouter(upcomingIncomeController));

router.get('/data/export', dataController.exportData);
router.post('/data/import', dataController.importData);
router.post('/data/backup', dataController.backupDatabase);

module.exports = router;
