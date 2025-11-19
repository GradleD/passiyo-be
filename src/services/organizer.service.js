// src/services/organizer.service.js
import { supabase } from '../config/supabase.config.js';
import { createError } from '../utils/error.util.js';

/**
 * Create a new organizer
 * @param {Object} organizerData - Organizer data
 * @returns {Promise<Object>} Created organizer
 */
export const createOrganizer = async (organizerData) => {
  const { data, error } = await supabase
    .from('organizers')
    .insert([organizerData])
    .select()
    .single();

  if (error) {
    throw createError(400, `Failed to create organizer: ${error.message}`);
  }

  return data;
};

/**
 * Find organizer by email
 * @param {string} email - Organizer's email
 * @returns {Promise<Object|null>} Found organizer or null
 */
export const findOrganizerByEmail = async (email) => {
  const { data, error } = await supabase
    .from('organizers')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    throw createError(500, `Database error: ${error.message}`);
  }

  return data;
};

/**
 * Service for organizer-related operations
 */
class OrganizerService {
  /**
   * Get organizer profile by ID
   * @param {string} organizerId - The ID of the organizer
   * @returns {Promise<Object>} Organizer profile
   */
  static async getOrganizerById(organizerId) {
    const { data, error } = await supabase
      .from('organizers')
      .select('*')
      .eq('id', organizerId)
      .single();

    if (error) {
      throw createError(404, 'Organizer not found');
    }

    return data;
  }

  /**
   * Update organizer profile
   * @param {string} organizerId - The ID of the organizer
   * @param {Object} updates - The updates to apply
   * @returns {Promise<Object>} Updated organizer profile
   */
  static async updateOrganizer(organizerId, updates) {
    const { data, error } = await supabase
      .from('organizers')
      .update(updates)
      .eq('id', organizerId)
      .select()
      .single();

    if (error) {
      throw createError(400, 'Failed to update organizer');
    }

    return data;
  }
}

export default OrganizerService;