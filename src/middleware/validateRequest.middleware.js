import { validationResult } from 'express-validator';
import { StatusCodes } from 'http-status-codes';
import { createError } from '../utils/error.util.js';

/**
 * Middleware to validate request using express-validator
 * If validation fails, it will return an error response
 * Otherwise, it will call next()
 */
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.param,
      message: error.msg
    }));
    
    return next(
      createError(
        StatusCodes.UNPROCESSABLE_ENTITY,
        'Validation failed',
        errorMessages
      )
    );
  }
  
  next();
};

/**
 * Middleware to validate file uploads
 * @param {string} fieldName - Name of the file field
 * @param {string[]} allowedTypes - Array of allowed MIME types
 * @param {number} maxSize - Maximum file size in bytes
 */
export const validateFileUpload = (fieldName, allowedTypes, maxSize) => {
  return (req, res, next) => {
    if (!req.files || !req.files[fieldName]) {
      return next(
        createError(StatusCodes.BAD_REQUEST, `No ${fieldName} file uploaded`)
      );
    }
    
    const file = req.files[fieldName];
    
    // Check file type
    if (!allowedTypes.includes(file.mimetype)) {
      return next(
        createError(
          StatusCodes.UNSUPPORTED_MEDIA_TYPE,
          `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
        )
      );
    }
    
    // Check file size
    if (file.size > maxSize) {
      return next(
        createError(
          StatusCodes.PAYLOAD_TOO_LARGE,
          `File size too large. Maximum size: ${maxSize / 1024 / 1024}MB`
        )
      );
    }
    
    next();
  };
};
