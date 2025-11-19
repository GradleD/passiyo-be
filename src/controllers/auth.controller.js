import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import { supabase } from '../app.js';
import { generateTokens } from '../utils/jwt.utils.js';
import { createOrganizer, findOrganizerByEmail } from '../services/organizer.service.js';
import { createError } from '../utils/error.util.js';

/**
 * Register a new organizer
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, company } = req.body;

    // Check if organizer already exists
    const existingOrganizer = await findOrganizerByEmail(email);
    if (existingOrganizer) {
      return next(createError(StatusCodes.CONFLICT, 'Email already registered'));
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create organizer in database
    const organizerData = {
      name,
      email,
      password: hashedPassword,
      phone,
      company,
      status: 'active',
      role: 'organizer'
    };

    const organizer = await createOrganizer(organizerData);

    // Generate JWT tokens
    const { accessToken, refreshToken } = generateTokens({
      id: organizer.id,
      email: organizer.email,
      role: organizer.role
    });

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Return success response with access token
    res.status(StatusCodes.CREATED).json({
      status: 'success',
      data: {
        organizer: {
          id: organizer.id,
          name: organizer.name,
          email: organizer.email,
          company: organizer.company,
          role: organizer.role
        },
        token: accessToken
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login organizer
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find organizer by email
    const organizer = await findOrganizerByEmail(email);
    if (!organizer) {
      return next(createError(StatusCodes.UNAUTHORIZED, 'Invalid credentials'));
    }

    // Check if password is correct
    const isPasswordValid = await bcrypt.compare(password, organizer.password);
    if (!isPasswordValid) {
      return next(createError(StatusCodes.UNAUTHORIZED, 'Invalid credentials'));
    }

    // Generate JWT tokens
    const { accessToken, refreshToken } = generateTokens({
      id: organizer.id,
      email: organizer.email,
      role: organizer.role
    });

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Return success response with access token
    res.status(StatusCodes.OK).json({
      status: 'success',
      data: {
        organizer: {
          id: organizer.id,
          name: organizer.name,
          email: organizer.email,
          company: organizer.company,
          role: organizer.role
        },
        token: accessToken
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout organizer
 */
export const logout = (req, res) => {
  res.clearCookie('refreshToken');
  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'Successfully logged out'
  });
};

/**
 * Refresh access token
 */
export const refreshToken = (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      return next(createError(StatusCodes.UNAUTHORIZED, 'No refresh token provided'));
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    
    // Generate new access token
    const accessToken = jwt.sign(
      { id: decoded.id, email: decoded.email, role: decoded.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
    );

    res.status(StatusCodes.OK).json({
      status: 'success',
      data: {
        token: accessToken
      }
    });
  } catch (error) {
    next(createError(StatusCodes.FORBIDDEN, 'Invalid refresh token'));
  }
};

/**
 * Get current organizer profile
 */
export const getMe = async (req, res, next) => {
  try {
    const organizer = await findOrganizerById(req.user.id);
    
    if (!organizer) {
      return next(createError(StatusCodes.NOT_FOUND, 'Organizer not found'));
    }

    res.status(StatusCodes.OK).json({
      status: 'success',
      data: {
        organizer: {
          id: organizer.id,
          name: organizer.name,
          email: organizer.email,
          company: organizer.company,
          phone: organizer.phone,
          role: organizer.role,
          status: organizer.status,
          createdAt: organizer.created_at,
          updatedAt: organizer.updated_at
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
