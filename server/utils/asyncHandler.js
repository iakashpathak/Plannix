// Express 4 does not catch rejected promises in async handlers. This wrapper forwards them to next(err).
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
