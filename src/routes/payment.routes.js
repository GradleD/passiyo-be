import { Router } from 'express';
import { body, param } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  createPaymentOrder,
  verifyPaymentController,
  createTicketPaymentLink,
  handleWebhook,
  getPaymentDetailsController,
  refundPaymentController,
} from '../controllers/payment.controller.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment processing and management
 */

/**
 * @swagger
 * /api/payments/create-order:
 *   post:
 *     summary: Create a new payment order
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventId
 *               - ticketTypeId
 *               - attendeeId
 *             properties:
 *               eventId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the event
 *               ticketTypeId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the ticket type
 *               attendeeId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the attendee
 *     responses:
 *       201:
 *         description: Payment order created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post(
  '/create-order',
  authenticate,
  [
    body('eventId')
      .isUUID()
      .withMessage('Invalid event ID format'),
    body('ticketTypeId')
      .isUUID()
      .withMessage('Invalid ticket type ID format'),
    body('attendeeId')
      .isUUID()
      .withMessage('Invalid attendee ID format'),
    validateRequest,
  ],
  createPaymentOrder
);

/**
 * @swagger
 * /api/payments/verify:
 *   post:
 *     summary: Verify a payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - order_id
 *               - payment_id
 *               - signature
 *             properties:
 *               order_id:
 *                 type: string
 *                 description: Razorpay order ID
 *               payment_id:
 *                 type: string
 *                 description: Razorpay payment ID
 *               signature:
 *                 type: string
 *                 description: Payment signature for verification
 *     responses:
 *       200:
 *         description: Payment verified successfully
 *       400:
 *         description: Invalid input or payment verification failed
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post(
  '/verify',
  authenticate,
  [
    body('order_id')
      .notEmpty()
      .withMessage('Order ID is required'),
    body('payment_id')
      .notEmpty()
      .withMessage('Payment ID is required'),
    body('signature')
      .notEmpty()
      .withMessage('Signature is required'),
    validateRequest,
  ],
  verifyPaymentController
);

/**
 * @swagger
 * /api/payments/events/{eventId}/attendees/{attendeeId}/payment-link:
 *   post:
 *     summary: Create a payment link for an event ticket
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the event
 *       - in: path
 *         name: attendeeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the attendee
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ticketTypeId
 *             properties:
 *               ticketTypeId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the ticket type
 *     responses:
 *       201:
 *         description: Payment link created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Event, attendee, or ticket type not found
 *       500:
 *         description: Server error
 */
router.post(
  '/events/:eventId/attendees/:attendeeId/payment-link',
  authenticate,
  [
    param('eventId')
      .isUUID()
      .withMessage('Invalid event ID format'),
    param('attendeeId')
      .isUUID()
      .withMessage('Invalid attendee ID format'),
    body('ticketTypeId')
      .isUUID()
      .withMessage('Invalid ticket type ID format'),
    validateRequest,
  ],
  createTicketPaymentLink
);

/**
 * @swagger
 * /api/payments/webhook:
 *   post:
 *     summary: Handle Razorpay webhook events
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event:
 *                 type: string
 *                 description: Webhook event type
 *               payload:
 *                 type: object
 *                 description: Webhook payload
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       401:
 *         description: Invalid webhook signature
 *       500:
 *         description: Server error
 */
router.post('/webhook', handleWebhook);

/**
 * @swagger
 * /api/payments/{paymentId}:
 *   get:
 *     summary: Get payment details
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the payment
 *     responses:
 *       200:
 *         description: Payment details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Server error
 */
router.get(
  '/:paymentId',
  authenticate,
  [
    param('paymentId')
      .isUUID()
      .withMessage('Invalid payment ID format'),
    validateRequest,
  ],
  getPaymentDetailsController
);

/**
 * @swagger
 * /api/payments/{paymentId}/refund:
 *   post:
 *     summary: Refund a payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the payment to refund
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Amount to refund (defaults to full amount if not specified)
 *               reason:
 *                 type: string
 *                 description: Reason for the refund
 *     responses:
 *       200:
 *         description: Refund processed successfully
 *       400:
 *         description: Invalid input or payment cannot be refunded
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Server error
 */
router.post(
  '/:paymentId/refund',
  authenticate,
  [
    param('paymentId')
      .isUUID()
      .withMessage('Invalid payment ID format'),
    body('amount')
      .optional()
      .isFloat({ gt: 0 })
      .withMessage('Amount must be a positive number'),
    validateRequest,
  ],
  refundPaymentController
);

export default router;
