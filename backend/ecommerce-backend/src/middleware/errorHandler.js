// Implement a global error handler in errorHandler.js.
// src/middleware/errorHandler.js

const logger = require('../logger/logger');

const { ValidationError, AuthenticationError, ForbiddenError, NotFoundError } = require('../errors/errors');

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Production error response
  if (err.isOperational) {
    if (err instanceof ValidationError) {
      logger.warn('Validation error: ', err);
    } else if (err instanceof AuthenticationError) {
      logger.info('Authentication error: ', err);
    } else if (err instanceof ForbiddenError) {
      logger.warn('Forbidden error: ', err);
    } else if (err instanceof NotFoundError) {
      logger.warn('Not found error: ', err);
    } else {
      logger.error('UNDEFINED OPERATIONAL ERROR: ', err);
    }

    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  }

  // if not operational, log everything
  logger.error('UNHANDLED ERROR: ', {
    message: err.message,
    stack: err.stack,
    error: err,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    body: req.body,
    headers: req.headers,
    params: req.params,
    query: req.query,
    user: req.user ? req.user.id : 'anonymous',
    session_id: req.session_id || 'no session',
    trackCookie: req.trackCookie || 'no track cookie',
  });

  if (process.env.NODE_ENV === 'development') {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  }

  // Programming or unknown errors: don't leak error details
  return res.status(500).json({
    status: 'error',
    message: 'Something went wrong'
  });
};

logger.info('Error handling enabled');

module.exports = errorHandler;
