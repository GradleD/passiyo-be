import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest.middleware.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validateFileUpload } from '../middleware/validateRequest.middleware.js';
import multer from 'multer';
import {
  createEventController,
  getEventsController,
  getEventController,
  updateEventController,
  deleteEventController,
  getEventStatsController,
  publishEventController
} from '../controllers/event.controller.js';

const router = Router();
const upload = multer({ dest: 'uploads/' });

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all events for the current organizer
router.get(
  '/',
  [
    query('status')
      .optional()
      .isIn(['draft', 'published', 'cancelled', 'completed'])
      .withMessage('Invalid status value'),
    validateRequest
  ],
  getEventsController
);

// Create a new event
router.post(
  '/',
  upload.single('image'),
  [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ max: 100 })
      .withMessage('Title must be less than 100 characters'),
    body('description')
      .trim()
      .notEmpty()
      .withMessage('Description is required'),
    body('start_date')
      .isISO8601()
      .withMessage('Invalid start date format. Use ISO8601 format (e.g., 2023-12-31T23:59:59Z)'),
    body('end_date')
      .isISO8601()
      .withMessage('Invalid end date format. Use ISO8601 format (e.g., 2023-12-31T23:59:59Z)'),
    body('location')
      .trim()
      .notEmpty()
      .withMessage('Location is required'),
    body('category')
      .optional()
      .isString()
      .withMessage('Category must be a string'),
    body('capacity')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Capacity must be a positive integer'),
    body('is_online')
      .optional()
      .isBoolean()
      .withMessage('is_online must be a boolean'),
    body('online_url')
      .optional()
      .isURL()
      .withMessage('Invalid online URL format'),
    validateRequest,
    validateFileUpload('image', ['image/jpeg', 'image/png', 'image/webp'], 5 * 1024 * 1024) // 5MB max
  ],
  createEventController
);

// Get a single event
router.get(
  '/:id',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid event ID format'),
    validateRequest
  ],
  getEventController
);

// Update an event
router.patch(
  '/:id',
  upload.single('image'),
  [
    param('id')
      .isUUID()
      .withMessage('Invalid event ID format'),
    body('title')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Title cannot be empty')
      .isLength({ max: 100 })
      .withMessage('Title must be less than 100 characters'),
    body('start_date')
      .optional()
      .isISO8601()
      .withMessage('Invalid start date format'),
    body('end_date')
      .optional()
      .isISO8601()
      .withMessage('Invalid end date format'),
    body('capacity')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Capacity must be a positive integer'),
    body('online_url')
      .optional()
      .isURL()
      .withMessage('Invalid online URL format'),
    validateRequest,
    validateFileUpload('image', ['image/jpeg', 'image/png', 'image/webp'], 5 * 1024 * 1024, true) // 5MB max, optional
  ],
  updateEventController
);

// Delete an event
router.delete(
  '/:id',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid event ID format'),
    validateRequest
  ],
  deleteEventController
);

// Publish an event
router.post(
  '/:id/publish',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid event ID format'),
    validateRequest
  ],
  publishEventController
);

// Get event statistics
router.get(
  '/:id/stats',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid event ID format'),
    validateRequest
  ],
  getEventStatsController
);

export default router;
