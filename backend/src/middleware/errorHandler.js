function errorHandler(err, req, res, next) {
  console.error('[Error]', err.message);

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
