import { supabase } from '../app.js';

const TABLE_NAME = 'events';

/**
 * Create a new event
 * @param {Object} eventData - Event data
 * @returns {Promise<Object>} Created event
 */
export const createEvent = async (eventData) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert([eventData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Get event by ID
 * @param {string} eventId - Event ID
 * @returns {Promise<Object>} Event data
 */
export const findEventById = async (eventId) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('id', eventId)
    .single();

  if (error) throw error;
  return data;
};

/**
 * Get all events for an organizer
 * @param {string} organizerId - Organizer ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} List of events
 */
export const findEventsByOrganizer = async (organizerId, options = {}) => {
  const { status, limit = 10, offset = 0 } = options;
  
  let query = supabase
    .from(TABLE_NAME)
    .select('*', { count: 'exact' })
    .eq('organizer_id', organizerId)
    .order('start_date', { ascending: true })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error, count } = await query;
  
  if (error) throw error;
  return { data, count };
};

/**
 * Update an event
 * @param {string} eventId - Event ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated event
 */
export const updateEvent = async (eventId, updates) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update(updates)
    .eq('id', eventId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Delete an event
 * @param {string} eventId - Event ID
 * @returns {Promise<boolean>} Success status
 */
export const deleteEvent = async (eventId) => {
  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('id', eventId);

  if (error) throw error;
  return true;
};

/**
 * Get event statistics
 * @param {string} eventId - Event ID
 * @returns {Promise<Object>} Event statistics
 */
export const getEventStats = async (eventId) => {
  const { data, error } = await supabase.rpc('get_event_stats', {
    event_id: eventId
  });

  if (error) throw error;
  return data;
};
