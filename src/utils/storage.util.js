// src/utils/storage.util.js
import { supabase } from '../config/supabase.config.js';
import { createError } from './error.util.js';

/**
 * Upload a file to Supabase Storage
 * @param {string} bucket - Storage bucket name
 * @param {string} path - Path where the file should be stored
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} mimeType - File MIME type
 * @param {Object} metadata - Additional file metadata
 * @returns {Promise<Object>} Upload result with file URL and path
 */
export const uploadFile = async (bucket, path, fileBuffer, mimeType, metadata = {}) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, fileBuffer, {
        contentType: mimeType,
        upsert: true,
        cacheControl: '3600',
        metadata
      });

    if (error) {
      throw createError(500, `Failed to upload file: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      path: data.path,
      url: publicUrl,
      fullPath: `${bucket}/${data.path}`
    };
  } catch (error) {
    throw createError(
      error.status || 500,
      error.message || 'File upload failed'
    );
  }
};

/**
 * Delete a file from Supabase Storage
 * @param {string} bucket - Storage bucket name
 * @param {string} path - Path to the file
 * @returns {Promise<boolean>} True if deletion was successful
 */
export const deleteFile = async (bucket, path) => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      throw createError(500, `Failed to delete file: ${error.message}`);
    }

    return true;
  } catch (error) {
    throw createError(
      error.status || 500,
      error.message || 'File deletion failed'
    );
  }
};

/**
 * Generate a signed URL for a file
 * @param {string} bucket - Storage bucket name
 * @param {string} path - Path to the file
 * @param {number} expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns {Promise<string>} Signed URL
 */
export const getSignedUrl = async (bucket, path, expiresIn = 3600) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      throw createError(500, `Failed to generate signed URL: ${error.message}`);
    }

    return data.signedUrl;
  } catch (error) {
    throw createError(
      error.status || 500,
      error.message || 'Failed to generate signed URL'
    );
  }
};