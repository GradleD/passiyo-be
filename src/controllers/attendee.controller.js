import { StatusCodes } from 'http-status-codes';
import { createError } from '../utils/error.util.js';
import { 
  findEventById 
} from '../models/event.model.js';
import { 
  registerAttendee, 
  findAttendeeById, 
  findAttendeesByEvent, 
  updateAttendee, 
  checkInAttendee,
  getAttendeeStats,
  searchAttendees
} from '../models/attendee.model.js';

/**
 * Register a new attendee for an event
 */
export const registerAttendeeController = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    
    // Verify the event exists and belongs to the organizer
    const event = await findEventById(eventId);
    if (event.organizer_id !== req.user.id) {
      return next(createError(StatusCodes.FORBIDDEN, 'Not authorized to add attendees to this event'));
    }

    const attendee = await registerAttendee({
      ...req.body,
      event_id: eventId,
      registered_by: req.user.id
    });
    
    res.status(StatusCodes.CREATED).json({
      status: 'success',
      data: { attendee }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all attendees for an event
 */
export const getAttendeesController = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { status, page = 1, limit = 20 } = req.query;
    
    // Verify the event exists and belongs to the organizer
    const event = await findEventById(eventId);
    if (event.organizer_id !== req.user.id) {
      return next(createError(StatusCodes.FORBIDDEN, 'Not authorized to view attendees for this event'));
    }

    const offset = (page - 1) * limit;
    const { data: attendees, count } = await findAttendeesByEvent(
      eventId, 
      { status, limit: parseInt(limit), offset }
    );
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit)
      },
      data: { attendees }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single attendee
 */
export const getAttendeeController = async (req, res, next) => {
  try {
    const { attendeeId } = req.params;
    
    const attendee = await findAttendeeById(attendeeId);
    
    // Verify the event exists and belongs to the organizer
    const event = await findEventById(attendee.event_id);
    if (event.organizer_id !== req.user.id) {
      return next(createError(StatusCodes.FORBIDDEN, 'Not authorized to view this attendee'));
    }
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      data: { attendee }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update attendee information
 */
export const updateAttendeeController = async (req, res, next) => {
  try {
    const { attendeeId } = req.params;
    
    // Get the attendee to find the event ID
    const attendee = await findAttendeeById(attendeeId);
    
    // Verify the event exists and belongs to the organizer
    const event = await findEventById(attendee.event_id);
    if (event.organizer_id !== req.user.id) {
      return next(createError(StatusCodes.FORBIDDEN, 'Not authorized to update this attendee'));
    }

    const updatedAttendee = await updateAttendee(attendeeId, req.body);
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      data: { attendee: updatedAttendee }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check in an attendee
 */
export const checkInAttendeeController = async (req, res, next) => {
  try {
    const { attendeeId } = req.params;
    
    // Get the attendee to find the event ID
    const attendee = await findAttendeeById(attendeeId);
    
    // Verify the event exists and belongs to the organizer
    const event = await findEventById(attendee.event_id);
    if (event.organizer_id !== req.user.id) {
      return next(createError(StatusCodes.FORBIDDEN, 'Not authorized to check in this attendee'));
    }

    // Check if already checked in
    if (attendee.status === 'checked_in') {
      return next(createError(StatusCodes.BAD_REQUEST, 'Attendee already checked in'));
    }

    const updatedAttendee = await checkInAttendee(attendeeId);
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      data: { 
        attendee: updatedAttendee,
        message: 'Attendee checked in successfully' 
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get attendee statistics for an event
 */
export const getAttendeeStatsController = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    
    // Verify the event exists and belongs to the organizer
    const event = await findEventById(eventId);
    if (event.organizer_id !== req.user.id) {
      return next(createError(StatusCodes.FORBIDDEN, 'Not authorized to view stats for this event'));
    }

    const stats = await getAttendeeStats(eventId);
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      data: { stats }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search attendees by name or email
 */
export const searchAttendeesController = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { q: query } = req.query;
    
    if (!query || query.length < 2) {
      return next(createError(StatusCodes.BAD_REQUEST, 'Search query must be at least 2 characters'));
    }
    
    // Verify the event exists and belongs to the organizer
    const event = await findEventById(eventId);
    if (event.organizer_id !== req.user.id) {
      return next(createError(StatusCodes.FORBIDDEN, 'Not authorized to search attendees for this event'));
    }

    const attendees = await searchAttendees(eventId, query);
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      results: attendees.length,
      data: { attendees }
    });
  } catch (error) {
    next(error);
  }
};
