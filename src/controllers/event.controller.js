import { StatusCodes } from 'http-status-codes';
import { createError } from '../utils/error.util.js';
import { 
  createEvent, 
  findEventById, 
  findEventsByOrganizer, 
  updateEvent, 
  deleteEvent,
  getEventStats
} from '../models/event.model.js';
import { uploadFile, deleteFile } from '../utils/storage.util.js';

/**
 * Create a new event
 */
export const createEventController = async (req, res, next) => {
  try {
    const eventData = {
      ...req.body,
      organizer_id: req.user.id,
      status: 'draft'
    };

    // Handle image upload if exists
    if (req.file) {
      const imageUrl = await uploadFile(req.file, 'events');
      eventData.image_url = imageUrl;
    }

    const event = await createEvent(eventData);
    
    res.status(StatusCodes.CREATED).json({
      status: 'success',
      data: { event }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all events for the current organizer
 */
export const getEventsController = async (req, res, next) => {
  try {
    const { status } = req.query;
    const { data: events, count } = await findEventsByOrganizer(
      req.user.id, 
      { status }
    );
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      results: events.length,
      total: count,
      data: { events }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single event by ID
 */
export const getEventController = async (req, res, next) => {
  try {
    const event = await findEventById(req.params.id);
    
    // Check if the event belongs to the organizer
    if (event.organizer_id !== req.user.id) {
      return next(createError(StatusCodes.FORBIDDEN, 'Not authorized to access this event'));
    }
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      data: { event }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an event
 */
export const updateEventController = async (req, res, next) => {
  try {
    const event = await findEventById(req.params.id);
    
    // Check if the event belongs to the organizer
    if (event.organizer_id !== req.user.id) {
      return next(createError(StatusCodes.FORBIDDEN, 'Not authorized to update this event'));
    }

    const updates = { ...req.body };
    
    // Handle image upload if exists
    if (req.file) {
      // Delete old image if exists
      if (event.image_url) {
        await deleteFile(event.image_url);
      }
      
      const imageUrl = await uploadFile(req.file, 'events');
      updates.image_url = imageUrl;
    }

    const updatedEvent = await updateEvent(req.params.id, updates);
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      data: { event: updatedEvent }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete an event
 */
export const deleteEventController = async (req, res, next) => {
  try {
    const event = await findEventById(req.params.id);
    
    // Check if the event belongs to the organizer
    if (event.organizer_id !== req.user.id) {
      return next(createError(StatusCodes.FORBIDDEN, 'Not authorized to delete this event'));
    }

    // Delete event image if exists
    if (event.image_url) {
      await deleteFile(event.image_url);
    }

    await deleteEvent(req.params.id);
    
    res.status(StatusCodes.NO_CONTENT).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get event statistics
 */
export const getEventStatsController = async (req, res, next) => {
  try {
    const event = await findEventById(req.params.id);
    
    // Check if the event belongs to the organizer
    if (event.organizer_id !== req.user.id) {
      return next(createError(StatusCodes.FORBIDDEN, 'Not authorized to view this event'));
    }

    const stats = await getEventStats(req.params.id);
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      data: { stats }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Publish an event
 */
export const publishEventController = async (req, res, next) => {
  try {
    const event = await findEventById(req.params.id);
    
    // Check if the event belongs to the organizer
    if (event.organizer_id !== req.user.id) {
      return next(createError(StatusCodes.FORBIDDEN, 'Not authorized to publish this event'));
    }

    // Validate that required fields are present
    const requiredFields = ['title', 'description', 'start_date', 'end_date', 'location'];
    const missingFields = requiredFields.filter(field => !event[field]);
    
    if (missingFields.length > 0) {
      return next(createError(
        StatusCodes.BAD_REQUEST,
        `Missing required fields: ${missingFields.join(', ')}`
      ));
    }

    const updatedEvent = await updateEvent(req.params.id, { 
      status: 'published',
      published_at: new Date().toISOString()
    });
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      data: { event: updatedEvent }
    });
  } catch (error) {
    next(error);
  }
};
