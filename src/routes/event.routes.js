/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Event management endpoints
 */

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

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Get all events for the current organizer
 *     tags: [Events]
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
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Create a new event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - start_date
 *               - end_date
 *               - location
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 100
 *                 description: Event title
 *               description:
 *                 type: string
 *                 description: Event description
 *               start_date:
 *                 type: string
 *                 format: date-time
 *                 description: Event start date in ISO8601 format
 *               end_date:
 *                 type: string
 *                 format: date-time
 *                 description: Event end date in ISO8601 format
 *               location:
 *                 type: string
 *                 description: Event location
 *               category:
 *                 type: string
 *                 description: Event category
 *               capacity:
 *                 type: integer
 *                 minimum: 1
 *                 description: Maximum number of attendees
 *               is_online:
 *                 type: boolean
 *                 description: Whether the event is online
 *               online_url:
 *                 type: string
 *                 format: uri
 *                 description: URL for online events
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Event image (JPEG, PNG, or WebP, max 5MB)
 *     responses:
 *       201:
 *         description: Event created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     summary: Get a single event by ID
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       400:
 *         description: Invalid event ID format
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Event not found
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /api/events/{id}:
 *   patch:
 *     summary: Update an existing event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Event ID to update
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 100
 *                 description: Event title
 *               description:
 *                 type: string
 *                 description: Event description
 *               start_date:
 *                 type: string
 *                 format: date-time
 *                 description: New start date in ISO8601 format
 *               end_date:
 *                 type: string
 *                 format: date-time
 *                 description: New end date in ISO8601 format
 *               location:
 *                 type: string
 *                 description: New event location
 *               category:
 *                 type: string
 *                 description: New event category
 *               capacity:
 *                 type: integer
 *                 minimum: 1
 *                 description: New maximum number of attendees
 *               is_online:
 *                 type: boolean
 *                 description: Whether the event is online
 *               online_url:
 *                 type: string
 *                 format: uri
 *                 description: New URL for online events
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: New event image (JPEG, PNG, or WebP, max 5MB)
 *     responses:
 *       200:
 *         description: Event updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not the event owner
 *       404:
 *         description: Event not found
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /api/events/{id}:
 *   delete:
 *     summary: Delete an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Event ID to delete
 *     responses:
 *       204:
 *         description: Event deleted successfully
 *       400:
 *         description: Invalid event ID format
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not the event owner
 *       404:
 *         description: Event not found
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /api/events/{id}/publish:
 *   post:
 *     summary: Publish a draft event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Event ID to publish
 *     responses:
 *       200:
 *         description: Event published successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       400:
 *         description: Invalid event ID format or event cannot be published
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not the event owner
 *       404:
 *         description: Event not found
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /api/events/{id}/stats:
 *   get:
 *     summary: Get statistics for an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Event ID to get statistics for
 *     responses:
 *       200:
 *         description: Event statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalAttendees:
 *                   type: integer
 *                   description: Total number of attendees
 *                 attendanceRate:
 *                   type: number
 *                   format: float
 *                   description: Attendance rate (0-1)
 *                 checkInRate:
 *                   type: number
 *                   format: float
 *                   description: Check-in rate (0-1)
 *       400:
 *         description: Invalid event ID format
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not the event owner
 *       404:
 *         description: Event not found
 *       500:
 *         description: Server error
 */
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
