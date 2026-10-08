/**
 * Express application (no network listening here - see server.js).
 * Keeping app creation separate lets tests start the app on a random port.
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const env = require('./config/env');
const apiRoutes = require('./routes');
const requestLogger = require('./middleware/requestLogger');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const serveClient = require('./middleware/serveClient');

const DEFAULT_BODY_LIMIT = '1mb';
const IMPORT_BODY_LIMIT = '10mb';

function createApp() {
  const app = express();

  app.disable('x-powered-by');
  // Behind a hosting proxy (Railway, Render, Fly...) this gives the real client
  // IP for login rate limiting.
  if (env.isProduction) {
    app.set('trust proxy', 1);
  }
  app.use(helmet());
  app.use(cors({ origin: env.corsOrigins }));

  // The import endpoint accepts whole export files, so it gets a larger limit.
  app.use('/api/data/import', express.json({ limit: IMPORT_BODY_LIMIT }));
  app.use(express.json({ limit: DEFAULT_BODY_LIMIT }));

  if (env.nodeEnv === 'development') {
    app.use('/api', requestLogger);
  }

  app.use('/api', apiRoutes);
  app.use('/api', notFound);

  serveClient(app, env.clientDistDir);

  app.use(errorHandler);
  return app;
}

module.exports = createApp;
