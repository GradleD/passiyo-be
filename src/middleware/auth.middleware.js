import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import { createError } from '../utils/error.util.js';

/**
 * Middleware to authenticate JWT token
 */
export const authenticate = (req, res, next) => {
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(createError(401, 'No token provided, authorization denied'));
    }

    try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user from payload
    req.user = decoded;
    
    next();
    
  } catch (error) {
    next(createError(401, 'Invalid token'));
  }
};

/**
 * Middleware to check if user has required role(s)
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        createError(
          StatusCodes.FORBIDDEN,
          `User role ${req.user.role} is not authorized to access this route`
        )
      );
    }
    next();
  };
};

/**
 * Middleware to check if user is the owner of the resource
 */
export const isOwner = (model, param = 'id') => {
  return async (req, res, next) => {
    try {
      const resource = await model.findById(req.params[param]);
      
      if (!resource) {
        return next(createError(StatusCodes.NOT_FOUND, 'Resource not found'));
      }
      
      // Check if user is the owner of the resource
      if (resource.organizerId.toString() !== req.user.id) {
        return next(
          createError(
            StatusCodes.FORBIDDEN,
            'You are not authorized to perform this action'
          )
        );
      }
      
      req.resource = resource;
      next();
    } catch (error) {
      next(error);
    }
  };
};
