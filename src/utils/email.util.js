import nodemailer from 'nodemailer';
import { createError } from './error.util.js';

// Create a transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text email body
 * @param {string} [options.html] - HTML email body
 * @returns {Promise<Object>} Email send result
 */
export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    if (!to || !subject || (!text && !html)) {
      throw createError(400, 'Missing required email fields');
    }

    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Event Organizer'}" <${process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html: html || text, // Use HTML if provided, otherwise fallback to text
    });

    console.log('Message sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw createError(500, 'Failed to send email', error);
  }
};

/**
 * Send event registration confirmation email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.attendeeName - Attendee name
 * @param {string} options.eventName - Event name
 * @param {string} options.eventDate - Formatted event date
 * @param {string} options.eventLocation - Event location
 * @param {string} options.ticketType - Ticket type name
 * @param {string} options.ticketNumber - Ticket number/reference
 * @returns {Promise<Object>} Email send result
 */
export const sendRegistrationConfirmation = async ({
  to,
  attendeeName,
  eventName,
  eventDate,
  eventLocation,
  ticketType,
  ticketNumber,
}) => {
  const subject = `Your Ticket for ${eventName}`;
  const text = `
    Hi ${attendeeName},

    Thank you for registering for ${eventName}!

    Event Details:
    - Date: ${eventDate}
    - Location: ${eventLocation}
    - Ticket Type: ${ticketType}
    - Ticket #: ${ticketNumber}

    Please bring this email and a valid ID to the event for check-in.

    We look forward to seeing you there!

    Best regards,
    The Event Organizer Team
  `;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Your Ticket for ${eventName}</h2>
      
      <p>Hi ${attendeeName},</p>
      
      <p>Thank you for registering for <strong>${eventName}</strong>!</p>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #1f2937;">Event Details</h3>
        <p><strong>Date:</strong> ${eventDate}</p>
        <p><strong>Location:</strong> ${eventLocation}</p>
        <p><strong>Ticket Type:</strong> ${ticketType}</p>
        <p><strong>Ticket #:</strong> ${ticketNumber}</p>
      </div>
      
      <p>Please bring this email and a valid ID to the event for check-in.</p>
      
      <p>We look forward to seeing you there!</p>
      
      <p>Best regards,<br>
      <strong>The Event Organizer Team</strong></p>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    text: text.trim(),
    html: html.trim(),
  });
};

/**
 * Send check-in confirmation email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.attendeeName - Attendee name
 * @param {string} options.eventName - Event name
 * @param {string} options.checkInTime - Formatted check-in time
 * @returns {Promise<Object>} Email send result
 */
export const sendCheckInConfirmation = async ({
  to,
  attendeeName,
  eventName,
  checkInTime,
}) => {
  const subject = `Check-in Confirmation for ${eventName}`;
  const text = `
    Hi ${attendeeName},

    You have been successfully checked in to ${eventName} at ${checkInTime}.

    Thank you for attending!

    Best regards,
    The Event Organizer Team
  `;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Check-in Confirmation</h2>
      
      <p>Hi ${attendeeName},</p>
      
      <p>You have been successfully checked in to <strong>${eventName}</strong> at ${checkInTime}.</p>
      
      <p>Thank you for attending!</p>
      
      <p>Best regards,<br>
      <strong>The Event Organizer Team</strong></p>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    text: text.trim(),
    html: html.trim(),
  });
};
