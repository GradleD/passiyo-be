import { StatusCodes } from 'http-status-codes';
import { v4 as uuidv4 } from 'uuid';
import { authenticate } from '../middleware/auth.middleware.js';
import { createError } from '../utils/error.util.js';
import { 
  createOrder, 
  verifyPayment, 
  processSuccessfulPayment,
  createPaymentLink,
  refundPayment,
  getPaymentDetails
} from '../services/payment.service.js';
import { findEventById } from '../models/event.model.js';
import { findAttendeeById } from '../models/attendee.model.js';
import { supabase } from '../app.js';

/**
 * Create a new payment order
 */
export const createPaymentOrder = async (req, res, next) => {
  try {
    const { eventId, ticketTypeId, attendeeId } = req.body;
    
    // Verify the event exists and get ticket price
    const event = await findEventById(eventId);
    if (!event) {
      return next(createError(StatusCodes.NOT_FOUND, 'Event not found'));
    }
    
    // Get ticket type details (assuming ticket_types table exists)
    const { data: ticketType, error: ticketError } = await supabase
      .from('ticket_types')
      .select('*')
      .eq('id', ticketTypeId)
      .eq('event_id', eventId)
      .single();
    
    if (ticketError || !ticketType) {
      return next(createError(StatusCodes.NOT_FOUND, 'Ticket type not found'));
    }
    
    // Generate a unique receipt ID
    const receipt = `order_${uuidv4().replace(/-/g, '')}`;
    
    // Create a payment record in the database
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert([{
        order_id: receipt,
        event_id: eventId,
        attendee_id: attendeeId,
        ticket_type_id: ticketTypeId,
        amount: ticketType.price,
        currency: ticketType.currency || 'INR',
        status: 'created',
        created_by: req.user.id,
      }])
      .select()
      .single();
    
    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      return next(createError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to create payment record'));
    }
    
    // Create Razorpay order
    const order = await createOrder({
      amount: ticketType.price,
      currency: ticketType.currency || 'INR',
      receipt,
      notes: {
        event_id: eventId,
        ticket_type_id: ticketTypeId,
        attendee_id: attendeeId,
      },
    });
    
    res.status(StatusCodes.CREATED).json({
      status: 'success',
      data: {
        order,
        payment_id: payment.id,
        key: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify payment and update status
 */
export const verifyPaymentController = async (req, res, next) => {
  try {
    const { order_id, payment_id, signature } = req.body;
    
    if (!order_id || !payment_id || !signature) {
      return next(createError(StatusCodes.BAD_REQUEST, 'Missing required parameters'));
    }
    
    // Process the payment
    const result = await processSuccessfulPayment({
      order_id,
      payment_id,
      signature,
    });
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a payment link for an event ticket
 */
export const createTicketPaymentLink = async (req, res, next) => {
  try {
    const { eventId, attendeeId } = req.params;
    const { ticketTypeId } = req.body;
    
    // Verify the event exists
    const event = await findEventById(eventId);
    if (!event) {
      return next(createError(StatusCodes.NOT_FOUND, 'Event not found'));
    }
    
    // Verify the attendee exists
    const attendee = await findAttendeeById(attendeeId);
    if (!attendee) {
      return next(createError(StatusCodes.NOT_FOUND, 'Attendee not found'));
    }
    
    // Get ticket type details
    const { data: ticketType, error: ticketError } = await supabase
      .from('ticket_types')
      .select('*')
      .eq('id', ticketTypeId)
      .eq('event_id', eventId)
      .single();
    
    if (ticketError || !ticketType) {
      return next(createError(StatusCodes.NOT_FOUND, 'Ticket type not found'));
    }
    
    // Create a payment record in the database
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert([{
        event_id: eventId,
        attendee_id: attendeeId,
        ticket_type_id: ticketTypeId,
        amount: ticketType.price,
        currency: ticketType.currency || 'INR',
        status: 'payment_link_created',
        created_by: req.user.id,
      }])
      .select()
      .single();
    
    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      return next(createError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to create payment record'));
    }
    
    // Create payment link
    const paymentLink = await createPaymentLink({
      eventId,
      attendeeId,
      amount: ticketType.price,
      currency: ticketType.currency || 'INR',
      description: `Payment for ${event.title} - ${ticketType.name}`,
      customer: {
        name: attendee.name,
        email: attendee.email,
        phone: attendee.phone,
      },
      notify: {
        email: true,
        sms: !!attendee.phone,
      },
    });
    
    // Update payment record with payment link details
    await supabase
      .from('payments')
      .update({
        payment_link_id: paymentLink.payment_link_id,
        payment_link: paymentLink.payment_link,
        status: 'payment_link_sent',
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.id);
    
    res.status(StatusCodes.CREATED).json({
      status: 'success',
      data: {
        payment_link: paymentLink.short_url,
        payment_id: payment.id,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Process Razorpay webhook
 */
export const handleWebhook = async (req, res, next) => {
  try {
    const { event, payload } = req.body;
    
    // Verify the webhook signature
    const signature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    const generatedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');
    
    if (generatedSignature !== signature) {
      return next(createError(StatusCodes.UNAUTHORIZED, 'Invalid webhook signature'));
    }
    
    // Handle different webhook events
    switch (event) {
      case 'payment.captured':
        // Handle successful payment
        await processSuccessfulPayment({
          order_id: payload.payment.entity.order_id,
          payment_id: payload.payment.entity.id,
          signature: payload.payment.entity.signature,
        });
        break;
        
      case 'payment.failed':
        // Handle failed payment
        await supabase
          .from('payments')
          .update({
            status: 'failed',
            error_message: payload.payment.entity.error_description,
            updated_at: new Date().toISOString(),
          })
          .eq('payment_id', payload.payment.entity.id);
        break;
        
      // Add more event handlers as needed
    }
    
    res.status(StatusCodes.OK).json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    next(error);
  }
};

/**
 * Get payment details
 */
export const getPaymentDetailsController = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    
    // Get payment details from database
    const { data: payment, error } = await supabase
      .from('payments')
      .select(`
        *,
        event:event_id (*),
        ticket_type:ticket_type_id (*),
        attendee:attendee_id (*)
      `)
      .eq('id', paymentId)
      .single();
    
    if (error || !payment) {
      return next(createError(StatusCodes.NOT_FOUND, 'Payment not found'));
    }
    
    // If the payment is successful, get details from Razorpay
    let razorpayDetails = null;
    if (payment.payment_id) {
      try {
        razorpayDetails = await getPaymentDetails(payment.payment_id);
      } catch (error) {
        console.error('Error fetching Razorpay details:', error);
        // Continue without Razorpay details if there's an error
      }
    }
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      data: {
        ...payment,
        razorpay_details: razorpayDetails,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refund a payment
 */
export const refundPaymentController = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const { amount, reason } = req.body;
    
    // Get payment details from database
    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();
    
    if (error || !payment) {
      return next(createError(StatusCodes.NOT_FOUND, 'Payment not found'));
    }
    
    // Check if payment is eligible for refund
    if (payment.status !== 'captured') {
      return next(createError(
        StatusCodes.BAD_REQUEST, 
        `Payment cannot be refunded. Current status: ${payment.status}`
      ));
    }
    
    // Process refund
    const refundAmount = amount || payment.amount;
    const result = await refundPayment(payment.payment_id, refundAmount, reason || 'Refund');
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
