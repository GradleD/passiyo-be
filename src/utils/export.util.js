import { writeFile, unlink, mkdir, stat } from 'fs/promises';
import { createObjectCsvWriter } from 'csv-writer';
import ExcelJS from 'exceljs';
import { v4 as uuidv4 } from 'uuid';
import { createError } from './error.util.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Create a reference to the fs.promises API
const fs = { promises: { writeFile, unlink, mkdir, stat } };

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Temporary directory for file exports
const TEMP_DIR = path.join(__dirname, '../../temp');

/**
 * Generate a CSV file from data
 * @param {Array} data - Array of objects to export
 * @param {Array} headers - Array of header objects with id and title
 * @param {string} [filename] - Output filename (without extension)
 * @returns {Promise<Object>} File information
 */
export const exportToCSV = async (data, headers, filename = 'export') => {
  try {
    // Ensure temp directory exists
    await ensureTempDirExists();
    
    const fileId = uuidv4();
    const outputPath = path.join(TEMP_DIR, `${filename}-${fileId}.csv`);
    
    const csvWriter = createObjectCsvWriter({
      path: outputPath,
      header: headers.map(header => ({
        id: header.id,
        title: header.title || header.id.replace(/_/g, ' ').replace(/\w\S*/g, txt => 
          txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        ),
      })),
    });
    
    await csvWriter.writeRecords(data);
    
    return {
      success: true,
      filePath: outputPath,
      fileName: `${filename}-${fileId}.csv`,
      mimeType: 'text/csv',
      size: (await getFileSize(outputPath)),
      expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
    };
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    throw createError(500, 'Failed to export data to CSV', error);
  }
};

/**
 * Generate an Excel file from data
 * @param {Array} data - Array of objects to export
 * @param {Array} headers - Array of header objects with id and title
 * @param {string} [filename] - Output filename (without extension)
 * @param {string} [sheetName] - Worksheet name
 * @returns {Promise<Object>} File information
 */
export const exportToExcel = async (data, headers, filename = 'export', sheetName = 'Data') => {
  try {
    // Ensure temp directory exists
    await ensureTempDirExists();
    
    const fileId = uuidv4();
    const outputPath = path.join(TEMP_DIR, `${filename}-${fileId}.xlsx`);
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);
    
    // Add headers
    const headerRow = worksheet.addRow(headers.map(header => header.title || header.id));
    headerRow.font = { bold: true };
    
    // Add data rows
    data.forEach(item => {
      const row = headers.map(header => {
        // Handle nested properties (e.g., 'user.name')
        return header.id.split('.').reduce((obj, key) => obj?.[key], item);
      });
      worksheet.addRow(row);
    });
    
    // Auto-fit columns
    worksheet.columns.forEach(column => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, cell => {
        const columnLength = cell.value ? cell.value.toString().length : 0;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = Math.min(Math.max(maxLength + 2, 10), 50); // Min width 10, max 50
    });
    
    await workbook.xlsx.writeFile(outputPath);
    
    return {
      success: true,
      filePath: outputPath,
      fileName: `${filename}-${fileId}.xlsx`,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size: (await getFileSize(outputPath)),
      expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
    };
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw createError(500, 'Failed to export data to Excel', error);
  }
};

/**
 * Clean up temporary export files
 * @param {string} filePath - Path to the file to delete
 */
export const cleanupExportFile = async (filePath) => {
  try {
    if (filePath && filePath.startsWith(TEMP_DIR)) {
      await unlink(filePath);
    }
  } catch (error) {
    console.error('Error cleaning up export file:', error);
    // Don't throw error for cleanup failures
  }
};

/**
 * Ensure the temporary directory exists
 */
const ensureTempDirExists = async () => {
  try {
    await fs.mkdir(TEMP_DIR, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
};

/**
 * Get file size in bytes
 * @param {string} filePath - Path to the file
 * @returns {Promise<number>} File size in bytes
 */
const getFileSize = async (filePath) => {
  try {
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch (error) {
    console.error('Error getting file size:', error);
    return 0;
  }
};

/**
 * Format file size to human-readable string
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Export attendees data to the specified format
 * @param {Array} attendees - Array of attendee objects
 * @param {string} format - Export format ('csv' or 'excel')
 * @param {string} [filename] - Output filename (without extension)
 * @returns {Promise<Object>} File information
 */
export const exportAttendees = async (attendees, format = 'csv', filename = 'attendees') => {
  const headers = [
    { id: 'id', title: 'ID' },
    { id: 'name', title: 'Name' },
    { id: 'email', title: 'Email' },
    { id: 'phone', title: 'Phone' },
    { id: 'ticket_type', title: 'Ticket Type' },
    { id: 'registration_date', title: 'Registration Date' },
    { id: 'check_in_time', title: 'Check-in Time' },
    { id: 'status', title: 'Status' },
  ];
  
  // Format data for export
  const data = attendees.map(attendee => ({
    ...attendee,
    registration_date: formatDate(attendee.registration_date),
    check_in_time: attendee.check_in_time ? formatDate(attendee.check_in_time) : 'N/A',
  }));
  
  if (format.toLowerCase() === 'excel') {
    return exportToExcel(data, headers, filename, 'Attendees');
  }
  
  // Default to CSV
  return exportToCSV(data, headers, filename);
};

/**
 * Format date to a readable string
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
const formatDate = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};
