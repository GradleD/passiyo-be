import { Router } from 'express';
import { param, query, body } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  registerAttendeeController,
  getAttendeesController,
  getAttendeeController,
  updateAttendeeController,
  checkInAttendeeController,
  getAttendeeStatsController,
  searchAttendeesController
} from '../controllers/attendee.controller.js';

const router = Router();

/**
 * @swagger
 * /api/attendees:
 *   get:
 *     summary: Get all attendees for the current organizer
 *     tags: [Attendees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [registered, checked_in, cancelled]
 *         description: Filter attendees by status
 *     responses:
 *       200:
 *         description: List of attendees
 */
// Apply authentication middleware to all routes
router.use(authenticate);

// Register a new attendee for an event
router.post(
  '/events/:eventId/attendees',
  [
    param('eventId')
      .isUUID()
      .withMessage('Invalid event ID format'),
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required'),
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('phone')
      .optional({ checkFalsy: true })
      .isMobilePhone()
      .withMessage('Please provide a valid phone number'),
    body('ticket_type_id')
      .optional()
      .isUUID()
      .withMessage('Invalid ticket type ID format'),
    validateRequest
  ],
  registerAttendeeController
);

/**
 * @swagger
 * /api/attendees/events/{eventId}/attendees:
 *   get:
 *     summary: Get all attendees for an event
 *     tags: [Attendees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Event ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [registered, checked_in, cancelled]
 *         description: Filter attendees by status
 *     responses:
 *       200:
 *         description: List of attendees
 */
// Get all attendees for an event
router.get(
  '/events/:eventId/attendees',
  [
    param('eventId')
      .isUUID()
      .withMessage('Invalid event ID format'),
    query('status')
      .optional()
      .isIn(['registered', 'checked_in', 'cancelled'])
      .withMessage('Invalid status value'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer')
      .toInt(),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
      .toInt(),
    validateRequest
  ],
  getAttendeesController
);

/**
 * @swagger
 * /api/attendees/events/{eventId}/attendees/search:
 *   get:
 *     summary: Search attendees by name or email
 *     tags: [Attendees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Event ID
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: Search query
 *     responses:
 *       200:
 *         description: List of attendees
 */
// Search attendees by name or email
router.get(
  '/events/:eventId/attendees/search',
  [
    param('eventId')
      .isUUID()
      .withMessage('Invalid event ID format'),
    query('q')
      .trim()
      .notEmpty()
      .withMessage('Search query is required')
      .isLength({ min: 2 })
      .withMessage('Search query must be at least 2 characters'),
    validateRequest
  ],
  searchAttendeesController
);

/**
 * @swagger
 * /api/attendees/{attendeeId}:
 *   get:
 *     summary: Get a single attendee
 *     tags: [Attendees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attendeeId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Attendee ID
 *     responses:
 *       200:
 *         description: Attendee details
 */
// Get a single attendee
router.get(
  '/attendees/:attendeeId',
  [
    param('attendeeId')
      .isUUID()
      .withMessage('Invalid attendee ID format'),
    validateRequest
  ],
  getAttendeeController
);

/**
 * @swagger
 * /api/attendees/{attendeeId}:
 *   patch:
 *     summary: Update attendee information
 *     tags: [Attendees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attendeeId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Attendee ID
 *     responses:
 *       200:
 *         description: Attendee details
 */
// Update attendee information
router.patch(
  '/attendees/:attendeeId',
  [
    param('attendeeId')
      .isUUID()
      .withMessage('Invalid attendee ID format'),
    body('name')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Name cannot be empty'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('phone')
      .optional({ checkFalsy: true })
      .isMobilePhone()
      .withMessage('Please provide a valid phone number'),
    body('status')
      .optional()
      .isIn(['registered', 'checked_in', 'cancelled'])
      .withMessage('Invalid status value'),
    validateRequest
  ],
  updateAttendeeController
);

/**
 * @swagger
 * /api/attendees/{attendeeId}/check-in:
 *   post:
 *     summary: Check in an attendee
 *     tags: [Attendees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attendeeId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Attendee ID
 *     responses:
 *       200:
 *         description: Attendee details
 */
// Check in an attendee
router.post(
  '/attendees/:attendeeId/check-in',
  [
    param('attendeeId')
      .isUUID()
      .withMessage('Invalid attendee ID format'),
    validateRequest
  ],
  checkInAttendeeController
);

/**
 * @swagger
 * /api/attendees/events/{eventId}/attendees/stats:
 *   get:
 *     summary: Get attendee statistics for an event
 *     tags: [Attendees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Attendee statistics
 */
// Get attendee statistics for an event
router.get(
  '/events/:eventId/attendees/stats',
  [
    param('eventId')
      .isUUID()
      .withMessage('Invalid event ID format'),
    validateRequest
  ],
  getAttendeeStatsController
);

export default router;
