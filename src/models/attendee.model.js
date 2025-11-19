import { supabase } from '../app.js';

const TABLE_NAME = 'attendees';

/**
 * Register an attendee for an event
 * @param {Object} attendeeData - Attendee data
 * @returns {Promise<Object>} Created attendee
 */
export const registerAttendee = async (attendeeData) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert([{
      ...attendeeData,
      registration_date: new Date().toISOString(),
      status: 'registered'
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Get attendee by ID
 * @param {string} attendeeId - Attendee ID
 * @returns {Promise<Object>} Attendee data
 */
export const findAttendeeById = async (attendeeId) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('id', attendeeId)
    .single();

  if (error) throw error;
  return data;
};

/**
 * Get attendees for an event
 * @param {string} eventId - Event ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} List of attendees
 */
export const findAttendeesByEvent = async (eventId, options = {}) => {
  const { status, limit = 50, offset = 0 } = options;
  
  let query = supabase
    .from(TABLE_NAME)
    .select('*', { count: 'exact' })
    .eq('event_id', eventId)
    .order('registration_date', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error, count } = await query;
  
  if (error) throw error;
  return { data, count };
};

/**
 * Update attendee status
 * @param {string} attendeeId - Attendee ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated attendee
 */
export const updateAttendee = async (attendeeId, updates) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update(updates)
    .eq('id', attendeeId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Check in an attendee
 * @param {string} attendeeId - Attendee ID
 * @returns {Promise<Object>} Updated attendee
 */
export const checkInAttendee = async (attendeeId) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update({ 
      status: 'checked_in',
      check_in_time: new Date().toISOString()
    })
    .eq('id', attendeeId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Get attendee statistics for an event
 * @param {string} eventId - Event ID
 * @returns {Promise<Object>} Statistics
 */
export const getAttendeeStats = async (eventId) => {
  const { data, error } = await supabase.rpc('get_attendee_stats', {
    event_id: eventId
  });

  if (error) throw error;
  return data;
};

/**
 * Search attendees by name or email
 * @param {string} eventId - Event ID
 * @param {string} query - Search query
 * @returns {Promise<Array>} Matching attendees
 */
export const searchAttendees = async (eventId, query) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('event_id', eventId)
    .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
    .limit(50);

  if (error) throw error;
  return data;
};
