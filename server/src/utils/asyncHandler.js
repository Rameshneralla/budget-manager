/**
 * Wraps a controller so thrown errors reach the central error middleware.
 * (Express 5 already forwards rejected promises; this keeps intent explicit
 * and works for synchronous handlers too.)
 */
function asyncHandler(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = asyncHandler;
