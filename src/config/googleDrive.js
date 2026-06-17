const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const stream = require('stream');

require('dotenv').config();

/**
 * Initialize Google Drive API
 */
const initializeDrive = () => {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URL || 'http://localhost:3000/auth/google/callback'
  );

  auth.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
  });

  return google.drive({ version: 'v3', auth });
};

/**
 * Upload file to Google Drive
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {string} fileName - File name
 * @param {string} mimeType - MIME type
 * @returns {Promise<string>} Google Drive file ID
 */
const uploadToGoogleDrive = async (fileBuffer, fileName, mimeType) => {
  try {
    const drive = initializeDrive();
    const folderId = process.env.GOOGLE_FOLDER_ID;

    const fileMetadata = {
      name: `${Date.now()}_${fileName}`,
      parents: folderId ? [folderId] : []
    };

    const media = {
      mimeType: mimeType,
      body: stream.Readable.from(fileBuffer)
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, name, mimeType, webViewLink'
    });

    const fileId = response.data.id;

    // Make file publicly accessible
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    });

    // Get direct view URL
    const imageUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;

    return {
      fileId: fileId,
      imageUrl: imageUrl,
      webViewLink: response.data.webViewLink
    };
  } catch (error) {
    throw new Error(`Google Drive upload failed: ${error.message}`);
  }
};

/**
 * Delete file from Google Drive
 * @param {string} fileId - Google Drive file ID
 * @returns {Promise<void>}
 */
const deleteFromGoogleDrive = async (fileId) => {
  try {
    const drive = initializeDrive();
    await drive.files.delete({
      fileId: fileId
    });
  } catch (error) {
    console.error(`Failed to delete file from Google Drive: ${error.message}`);
    // Don't throw error - file might already be deleted
  }
};

module.exports = {
  initializeDrive,
  uploadToGoogleDrive,
  deleteFromGoogleDrive
};
