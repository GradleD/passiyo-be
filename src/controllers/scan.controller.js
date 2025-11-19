import { StatusCodes } from 'http-status-codes';
import { verifyQRCode } from '../utils/qr.util.js';
import { findAttendeeById, updateAttendee } from '../models/attendee.model.js';
import { findEventById } from '../models/event.model.js';
import { createError } from '../utils/error.util.js';
import { sendCheckInConfirmation } from '../utils/email.util.js';

/**
 * Scan and verify a QR code for attendee check-in
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const scanQRCode = async (req, res, next) => {
  try {
    const { qrData } = req.body;
    
    if (!qrData) {
      return next(createError(StatusCodes.BAD_REQUEST, 'QR code data is required'));
    }
    
    // Verify the QR code data
    const qrInfo = verifyQRCode(qrData);
    
    if (!qrInfo.isValid) {
      return next(createError(StatusCodes.BAD_REQUEST, qrInfo.error || 'Invalid QR code'));
    }
    
    // Get attendee and event details
    const [attendee, event] = await Promise.all([
      findAttendeeById(qrInfo.attendeeId),
      findEventById(qrInfo.eventId)
    ]);
    
    if (!attendee) {
      return next(createError(StatusCodes.NOT_FOUND, 'Attendee not found'));
    }
    
    if (!event) {
      return next(createError(StatusCodes.NOT_FOUND, 'Event not found'));
    }
    
    // Check if attendee is already checked in
    if (attendee.status === 'checked_in') {
      return res.status(StatusCodes.OK).json({
        status: 'success',
        data: {
          attendee,
          event,
          message: 'Attendee already checked in',
          checkInTime: attendee.check_in_time,
          isDuplicate: true
        }
      });
    }
    
    // Update attendee status to checked in
    const updatedAttendee = await updateAttendee(attendee.id, {
      status: 'checked_in',
      check_in_time: new Date().toISOString(),
      checked_in_by: req.user?.id || 'system'
    });
    
    // Send check-in confirmation email (async, don't wait for it)
    if (attendee.email) {
      try {
        await sendCheckInConfirmation({
          to: attendee.email,
          attendeeName: attendee.name,
          eventName: event.title,
          checkInTime: new Date().toLocaleString(),
        });
      } catch (emailError) {
        console.error('Error sending check-in confirmation email:', emailError);
        // Don't fail the request if email fails
      }
    }
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      data: {
        attendee: updatedAttendee,
        event: {
          id: event.id,
          title: event.title,
          start_date: event.start_date,
          location: event.location
        },
        message: 'Check-in successful',
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    next(error);
  }
};

/**
 * Get attendee details by ID (for manual check-in)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const getAttendeeForCheckIn = async (req, res, next) => {
  try {
    const { attendeeId } = req.params;
    
    // Get attendee details with event information
    const { data: attendee, error } = await supabase
      .from('attendees')
      .select(`
        *,
        event:event_id (id, title, start_date, location, image_url)
      `)
      .eq('id', attendeeId)
      .single();
    
    if (error || !attendee) {
      return next(createError(StatusCodes.NOT_FOUND, 'Attendee not found'));
    }
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      data: {
        attendee: {
          id: attendee.id,
          name: attendee.name,
          email: attendee.email,
          phone: attendee.phone,
          ticket_type: attendee.ticket_type,
          status: attendee.status,
          check_in_time: attendee.check_in_time,
          registration_date: attendee.registration_date,
        },
        event: attendee.event,
        isCheckedIn: attendee.status === 'checked_in',
        canCheckIn: attendee.status !== 'cancelled'
      }
    });
    
  } catch (error) {
    next(error);
  }
};

/**
 * Manually check in an attendee
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const manualCheckIn = async (req, res, next) => {
  try {
    const { attendeeId } = req.params;
    
    // Get attendee details
    const attendee = await findAttendeeById(attendeeId);
    
    if (!attendee) {
      return next(createError(StatusCodes.NOT_FOUND, 'Attendee not found'));
    }
    
    // Check if already checked in
    if (attendee.status === 'checked_in') {
      return res.status(StatusCodes.OK).json({
        status: 'success',
        data: {
          attendee,
          message: 'Attendee already checked in',
          isDuplicate: true
        }
      });
    }
    
    // Check if attendee is cancelled
    if (attendee.status === 'cancelled') {
      return next(createError(StatusCodes.BAD_REQUEST, 'Cannot check in a cancelled attendee'));
    }
    
    // Get event details for email
    const event = await findEventById(attendee.event_id);
    
    // Update attendee status to checked in
    const updatedAttendee = await updateAttendee(attendeeId, {
      status: 'checked_in',
      check_in_time: new Date().toISOString(),
      checked_in_by: req.user?.id || 'manual'
    });
    
    // Send check-in confirmation email (async, don't wait for it)
    if (attendee.email && event) {
      try {
        await sendCheckInConfirmation({
          to: attendee.email,
          attendeeName: attendee.name,
          eventName: event.title,
          checkInTime: new Date().toLocaleString(),
        });
      } catch (emailError) {
        console.error('Error sending check-in confirmation email:', emailError);
        // Don't fail the request if email fails
      }
    }
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      data: {
        attendee: updatedAttendee,
        event: event ? {
          id: event.id,
          title: event.title,
          start_date: event.start_date,
          location: event.location
        } : null,
        message: 'Manual check-in successful',
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    next(error);
  }
};
