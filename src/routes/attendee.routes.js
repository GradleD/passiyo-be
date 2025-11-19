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
