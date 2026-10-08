/** Logs one line per API request in development: "PATCH /api/income/2/status 200 4ms". */
function requestLogger(req, res, next) {
  const startedAt = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - startedAt}ms`);
  });
  next();
}

module.exports = requestLogger;
