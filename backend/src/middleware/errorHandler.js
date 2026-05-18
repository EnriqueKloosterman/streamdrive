function errorHandler(err, req, res, next) {
  console.error('[Error]', {
    method: req.method,
    path: req.originalUrl,
    message: err.message,
    code: err.code,
    statusCode: err.statusCode,
    driverError: err.parent?.message,
  });

  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'Internal server error.';

  res.status(statusCode).json({
    error: { code, message, details: err.details || {} },
  });
}

module.exports = { errorHandler };
