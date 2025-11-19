import QRCode from 'qrcode';
import { createError } from './error.util.js';

/**
 * Generate a QR code as a data URL
 * @param {string} data - Data to encode in the QR code
 * @param {Object} [options] - QR code options
 * @param {number} [options.width=200] - Width of the QR code in pixels
 * @param {string} [options.colorDark='#000000'] - Dark color (foreground)
 * @param {string} [options.colorLight='#ffffff'] - Light color (background)
 * @returns {Promise<string>} Data URL of the generated QR code
 */
export const generateQRCode = async (data, options = {}) => {
  try {
    const {
      width = 200,
      colorDark = '#000000',
      colorLight = '#ffffff',
    } = options;

    const qrCodeDataUrl = await QRCode.toDataURL(data, {
      width,
      color: {
        dark: colorDark,
        light: colorLight,
      },
      margin: 1,
    });

    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw createError(500, 'Failed to generate QR code', error);
  }
};

/**
 * Generate a QR code for an attendee ticket
 * @param {string} attendeeId - Unique attendee ID
 * @param {string} eventId - Event ID
 * @param {string} [verificationCode] - Optional verification code
 * @returns {Promise<string>} Data URL of the generated QR code
 */
export const generateAttendeeQRCode = async (attendeeId, eventId, verificationCode = '') => {
  try {
    // Create a verification payload
    const payload = {
      type: 'ticket',
      attendeeId,
      eventId,
      timestamp: Date.now(),
      ...(verificationCode && { code: verificationCode })
    };

    // Convert payload to JSON string
    const dataString = JSON.stringify(payload);

    // Generate QR code with the data
    return generateQRCode(dataString, {
      width: 300,
      colorDark: '#1e40af', // Dark blue
      colorLight: '#eff6ff' // Light blue
    });
  } catch (error) {
    console.error('Error generating attendee QR code:', error);
    throw createError(500, 'Failed to generate attendee QR code', error);
  }
};

/**
 * Verify a QR code data string
 * @param {string} qrData - QR code data string
 * @returns {Object} Decoded and verified QR code data
 */
export const verifyQRCode = (qrData) => {
  try {
    // Parse the QR code data
    const data = JSON.parse(qrData);
    
    // Basic validation
    if (!data.attendeeId || !data.eventId || !data.timestamp) {
      throw new Error('Invalid QR code data');
    }
    
    // Check if the QR code is expired (older than 24 hours)
    const qrAge = Date.now() - data.timestamp;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    if (qrAge > maxAge) {
      throw new Error('QR code has expired');
    }
    
    return {
      isValid: true,
      ...data
    };
  } catch (error) {
    console.error('Error verifying QR code:', error);
    return {
      isValid: false,
      error: error.message || 'Invalid QR code'
    };
  }
};

/**
 * Generate a QR code for check-in
 * @param {string} checkInCode - Unique check-in code
 * @param {string} eventId - Event ID
 * @returns {Promise<string>} Data URL of the generated QR code
 */
export const generateCheckInQRCode = async (checkInCode, eventId) => {
  try {
    // Create a check-in payload
    const payload = {
      type: 'checkin',
      code: checkInCode,
      eventId,
      timestamp: Date.now()
    };

    // Convert payload to JSON string
    const dataString = JSON.stringify(payload);

    // Generate QR code with the data
    return generateQRCode(dataString, {
      width: 250,
      colorDark: '#166534', // Dark green
      colorLight: '#f0fdf4' // Light green
    });
  } catch (error) {
    console.error('Error generating check-in QR code:', error);
    throw createError(500, 'Failed to generate check-in QR code', error);
  }
};
