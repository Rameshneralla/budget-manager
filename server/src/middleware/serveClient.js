/**
 * Serves the built React app (client/dist) when it exists, so `npm run build`
 * followed by `npm start` runs the whole application from one port.
 * In development the Vite dev server serves the client instead.
 */
const fs = require('fs');
const path = require('path');
const express = require('express');

function serveClient(app, clientDistDir) {
  const indexFile = path.join(clientDistDir, 'index.html');
  if (!fs.existsSync(indexFile)) {
    return false;
  }

  app.use(express.static(clientDistDir));

  // Client-side routes (/income, /expenses, ...) all load index.html.
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) {
      next();
      return;
    }
    res.sendFile(indexFile);
  });
  return true;
}

module.exports = serveClient;
