// src/logger/requestlogger
const morgan = require('morgan');
const logger = require('./logger');

// Function to sanitize request body
const sanitizeBody = (body) => {
  const sanitizedBody = { ...body };
  if (sanitizedBody.password) {
    sanitizedBody.password = '****REDACTED****';
  }
  // Add more fields to sanitize if needed
  return sanitizedBody;
};

// Define a custom token for request body logging
morgan.token('body', (req) => {
  try {
    const sanitizedBody = sanitizeBody(req.body);
    return JSON.stringify(sanitizedBody);
  } catch (error) {
    return 'Unable to stringify request body';
  }
});

// Create request logger middleware
const requestLogger = morgan(
  ':method :url :status :res[content-length] - :response-time ms :body',
  { 
    stream: logger.stream,
    skip: (req, res) => {
      // Skip some requests from logging by returning true here if needed
      return false;
    },
    // Can't show body because of this. If you want to show body, remove this line - but beware: it will cause the http logs to come after the routes' logs
    immediate: true,
  }
);

logger.info('Request logging enabled');

module.exports = requestLogger;
