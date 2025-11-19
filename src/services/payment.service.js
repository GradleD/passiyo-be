import Razorpay from 'razorpay';
import crypto from 'crypto';
import { createError } from '../utils/error.util.js';
import { supabase } from '../app.js';

// Initialize Razorpay client
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Create a new Razorpay order
 * @param {Object} options - Order options
 * @param {number} options.amount - Amount in smallest currency unit (e.g., paise for INR)
 * @param {string} options.currency - Currency code (default: 'INR')
 * @param {string} options.receipt - Receipt ID
 * @param {Object} options.notes - Additional notes
 * @returns {Promise<Object>} Razorpay order
 */
export const createOrder = async ({
  amount,
  currency = 'INR',
  receipt,
  notes = {},
}) => {
  try {
    if (!amount || amount <= 0) {
      throw createError(400, 'Amount must be greater than 0');
    }

    // Convert amount to paise (Razorpay expects amount in the smallest currency unit)
    const amountInPaise = Math.round(amount * 100);

    const options = {
      amount: amountInPaise,
      currency,
      receipt,
      notes,
      payment_capture: 1, // Auto-capture payment
    };

    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw createError(500, 'Failed to create payment order', error);
  }
};

/**
 * Verify Razorpay payment signature
 * @param {string} orderId - Razorpay order ID
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} signature - Razorpay signature
 * @returns {boolean} True if signature is valid, false otherwise
 */
export const verifyPayment = (orderId, paymentId, signature) => {
  try {
    const data = `${orderId}|${paymentId}`;
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(data)
      .digest('hex');

    return generatedSignature === signature;
  } catch (error) {
    console.error('Error verifying payment signature:', error);
    return false;
  }
};

/**
 * Process successful payment
 * @param {Object} paymentData - Payment data from Razorpay
 * @returns {Promise<Object>} Processed payment data
 */
export const processSuccessfulPayment = async (paymentData) => {
  const { order_id, payment_id, signature } = paymentData;
  
  try {
    // Verify the payment signature
    const isValid = verifyPayment(order_id, payment_id, signature);
    
    if (!isValid) {
      throw createError(400, 'Invalid payment signature');
    }
    
    // Fetch the payment details from Razorpay
    const payment = await razorpay.payments.fetch(payment_id);
    
    // Update the payment status in your database
    const { data: updatedPayment, error } = await supabase
      .from('payments')
      .update({
        status: 'captured',
        payment_id: payment.id,
        payment_method: payment.method,
        payment_details: payment,
        updated_at: new Date().toISOString(),
      })
      .eq('order_id', order_id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Here you can trigger additional actions like sending confirmation emails, etc.
    // For example: sendPaymentConfirmationEmail(updatedPayment);
    
    return {
      success: true,
      payment: updatedPayment,
      message: 'Payment processed successfully',
    };
  } catch (error) {
    console.error('Error processing payment:', error);
    
    // Update payment status to failed in case of errors
    await supabase
      .from('payments')
      .update({
        status: 'failed',
        error_message: error.message,
        updated_at: new Date().toISOString(),
      })
      .eq('order_id', order_id);
    
    throw createError(500, 'Failed to process payment', error);
  }
};

/**
 * Refund a payment
 * @param {string} paymentId - Razorpay payment ID
 * @param {number} amount - Amount to refund (in smallest currency unit)
 * @param {string} [reason] - Reason for refund
 * @returns {Promise<Object>} Refund details
 */
export const refundPayment = async (paymentId, amount, reason = 'Refund') => {
  try {
    const refund = await razorpay.payments.refund(paymentId, {
      amount: Math.round(amount * 100), // Convert to paise
      speed: 'normal', // or 'optimum'
      notes: {
        reason,
        refund_initiated_by: 'system',
      },
    });
    
    // Update the payment status in your database
    await supabase
      .from('payments')
      .update({
        status: 'refunded',
        refund_id: refund.id,
        refund_details: refund,
        updated_at: new Date().toISOString(),
      })
      .eq('payment_id', paymentId);
    
    return {
      success: true,
      refund,
      message: 'Refund processed successfully',
    };
  } catch (error) {
    console.error('Error processing refund:', error);
    throw createError(500, 'Failed to process refund', error);
  }
};

/**
 * Get payment details
 * @param {string} paymentId - Razorpay payment ID
 * @returns {Promise<Object>} Payment details
 */
export const getPaymentDetails = async (paymentId) => {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    console.error('Error fetching payment details:', error);
    throw createError(500, 'Failed to fetch payment details', error);
  }
};

/**
 * Create a payment link for an event ticket
 * @param {Object} options - Payment link options
 * @param {string} options.eventId - Event ID
 * @param {string} options.attendeeId - Attendee ID
 * @param {number} options.amount - Amount in currency units (e.g., INR)
 * @param {string} options.currency - Currency code (default: 'INR')
 * @param {string} options.description - Payment description
 * @param {Object} options.customer - Customer details
 * @param {Object} options.notify - Notification settings
 * @returns {Promise<Object>} Payment link details
 */
export const createPaymentLink = async ({
  eventId,
  attendeeId,
  amount,
  currency = 'INR',
  description = 'Event Ticket Payment',
  customer = {},
  notify = { email: true, sms: false },
}) => {
  try {
    const amountInPaise = Math.round(amount * 100);
    
    const paymentLink = await razorpay.paymentLink.create({
      amount: amountInPaise,
      currency,
      description,
      customer: {
        name: customer.name,
        email: customer.email,
        contact: customer.phone,
        ...customer,
      },
      notify,
      reminder_enable: true,
      callback_url: `${process.env.FRONTEND_URL}/payment/callback`,
      callback_method: 'get',
      notes: {
        event_id: eventId,
        attendee_id: attendeeId,
        type: 'event_ticket',
      },
    });
    
    return {
      success: true,
      payment_link_id: paymentLink.id,
      short_url: paymentLink.short_url,
      payment_link: paymentLink,
    };
  } catch (error) {
    console.error('Error creating payment link:', error);
    throw createError(500, 'Failed to create payment link', error);
  }
};
