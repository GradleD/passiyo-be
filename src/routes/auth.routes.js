import { Router } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest.middleware.js';
import { register, login, logout, refreshToken, getMe } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// @route   POST /api/auth/register
// @desc    Register a new organizer
// @access  Public

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new organizer
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, cancelled, completed]
 *         description: Filter events by status
 *     responses:
 *       200:
 *         description: List of events
 */
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('phone')
      .optional({ checkFalsy: true })
      .isMobilePhone()
      .withMessage('Please include a valid phone number'),
    body('company').trim().notEmpty().withMessage('Company name is required'),
  ],
  validateRequest,
  register
);

// @route   POST /api/auth/login
// @desc    Authenticate organizer & get token
// @access  Public

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate organizer & get token
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, cancelled, completed]
 *         description: Filter events by status
 *     responses:
 *       200:
 *         description: List of events
 */
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password').exists().withMessage('Password is required'),
  ],
  validateRequest,
  login
);

// @route   POST /api/auth/logout
// @desc    Logout organizer / clear refresh token cookie
// @access  Private

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout organizer / clear refresh token cookie
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, cancelled, completed]
 *         description: Filter events by status
 *     responses:
 *       200:
 *         description: List of events
 */
router.post('/logout', authenticate, logout);

// @route   POST /api/auth/refresh-token
// @desc    Refresh access token
// @access  Public

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, cancelled, completed]
 *         description: Filter events by status
 *     responses:
 *       200:
 *         description: List of events
 */
router.post('/refresh-token', refreshToken);

// @route   GET /api/auth/me
// @desc    Get current organizer profile
// @access  Private

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current organizer profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, cancelled, completed]
 *         description: Filter events by status
 *     responses:
 *       200:
 *         description: List of events
 */
router.get('/me', authenticate, getMe);

export default router;
