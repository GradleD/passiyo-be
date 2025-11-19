import { Router } from 'express';
import { body, param } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  scanQRCode,
  getAttendeeForCheckIn,
  manualCheckIn,
} from '../controllers/scan.controller.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Check-in
 *   description: QR code scanning and attendee check-in
 */

/**
 * @swagger
 * /api/scan:
 *   post:
 *     summary: Scan a QR code for attendee check-in
 *     tags: [Check-in]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - qrData
 *             properties:
 *               qrData:
 *                 type: string
 *                 description: The QR code data to be verified
 *     responses:
 *       200:
 *         description: QR code scanned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     attendee:
 *                       $ref: '#/components/schemas/Attendee'
 *                     event:
 *                       $ref: '#/components/schemas/Event'
 *                     message:
 *                       type: string
 *                       example: Check-in successful
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid QR code data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Attendee or event not found
 *       500:
 *         description: Server error
 */
router.post(
  '/',
  authenticate,
  [
    body('qrData')
      .isString()
      .withMessage('QR code data must be a string')
      .notEmpty()
      .withMessage('QR code data is required'),
    validateRequest,
  ],
  scanQRCode
);

/**
 * @swagger
 * /api/scan/attendees/{attendeeId}:
 *   get:
 *     summary: Get attendee details for manual check-in
 *     tags: [Check-in]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attendeeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the attendee to check in
 *     responses:
 *       200:
 *         description: Attendee details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     attendee:
 *                       $ref: '#/components/schemas/Attendee'
 *                     event:
 *                       $ref: '#/components/schemas/Event'
 *                     isCheckedIn:
 *                       type: boolean
 *                       example: false
 *                     canCheckIn:
 *                       type: boolean
 *                       example: true
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Attendee not found
 *       500:
 *         description: Server error
 */
router.get(
  '/attendees/:attendeeId',
  authenticate,
  [
    param('attendeeId')
      .isUUID()
      .withMessage('Invalid attendee ID format'),
    validateRequest,
  ],
  getAttendeeForCheckIn
);

/**
 * @swagger
 * /api/scan/attendees/{attendeeId}/check-in:
 *   post:
 *     summary: Manually check in an attendee
 *     tags: [Check-in]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attendeeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the attendee to check in
 *     responses:
 *       200:
 *         description: Attendee checked in successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     attendee:
 *                       $ref: '#/components/schemas/Attendee'
 *                     event:
 *                       $ref: '#/components/schemas/Event'
 *                     message:
 *                       type: string
 *                       example: Manual check-in successful
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Cannot check in a cancelled attendee
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Attendee not found
 *       500:
 *         description: Server error
 */
router.post(
  '/attendees/:attendeeId/check-in',
  authenticate,
  [
    param('attendeeId')
      .isUUID()
      .withMessage('Invalid attendee ID format'),
    validateRequest,
  ],
  manualCheckIn
);

export default router;
