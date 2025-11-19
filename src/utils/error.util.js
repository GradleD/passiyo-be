/**
 * Create a custom error object
 * @param {number} status - HTTP status code
 * @param {string} message - Error message
 * @param {Array} errors - Array of error objects (optional)
 * @returns {Error} Custom error object
 */
export const createError = (status, message, errors = []) => {
  const error = new Error(message);
  error.status = status;
  error.errors = errors.length > 0 ? errors : undefined;
  return error;
};

/**
 * Error handling middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Something went wrong';
  
  // Log error for debugging
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path}`, {
    status,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    errors: err.errors
  });
  
  // Send error response
  res.status(status).json({
    status: 'error',
    message,
    ...(err.errors && { errors: err.errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * 404 Not Found handler
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const notFoundHandler = (req, res, next) => {
  next(createError(404, `Not Found - ${req.originalUrl}`));
};
