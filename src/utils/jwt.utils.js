import jwt from 'jsonwebtoken';
import { createError } from './error.util.js';

/**
 * Generate JWT tokens
 * @param {Object} payload - Payload to sign
 * @returns {Object} Access and refresh tokens
 */
export const generateTokens = (payload) => {
  const accessToken = jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
  );

  const refreshToken = jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  return { accessToken, refreshToken };
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @param {boolean} isRefresh - Whether the token is a refresh token
 * @returns {Object} Decoded token payload
 */
export const verifyToken = (token, isRefresh = false) => {
  try {
    const secret = isRefresh 
      ? process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
      : process.env.JWT_SECRET;
    
    return jwt.verify(token, secret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw createError(401, 'Token expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw createError(401, 'Invalid token');
    }
    throw error;
  }
};

/**
 * Get token from request headers or cookies
 * @param {Object} req - Express request object
 * @returns {string} Token
 */
export const getTokenFromRequest = (req) => {
  // Get token from header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }

  // Get token from cookies
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }

  return null;
};

/**
 * Set JWT tokens in response cookies
 * @param {Object} res - Express response object
 * @param {string} accessToken - Access token
 * @param {string} refreshToken - Refresh token
 */
export const setTokenCookies = (res, accessToken, refreshToken) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  res.cookie('accessToken', accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie('refreshToken', refreshToken, cookieOptions);
};

/**
 * Clear JWT tokens from response cookies
 * @param {Object} res - Express response object
 */
export const clearTokenCookies = (res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
};
