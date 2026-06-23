function errorHandler(err, req, res, _next) {
  console.error('[error]', req.method, req.path, err.message, err.stack);
  const status = err.status || 500;
  res.status(status).json({ success: false, error: err.message || 'Internal server error' });
}

module.exports = { errorHandler };
