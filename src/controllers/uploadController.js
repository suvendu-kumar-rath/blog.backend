const { uploadToGoogleDrive } = require('../config/googleDrive');

/**
 * Upload image to Google Drive
 * POST /api/upload
 * Authenticated users
 */
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided',
        error: 'Please upload an image file'
      });
    }

    try {
      // Upload image to Google Drive
      const { imageUrl, fileId, webViewLink } = await uploadToGoogleDrive(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      return res.status(200).json({
        success: true,
        message: 'Image uploaded successfully',
        data: {
          imageUrl,
          fileId,
          webViewLink
        }
      });
    } catch (uploadError) {
      console.error('Google Drive upload error:', uploadError);
      return res.status(500).json({
        success: false,
        message: 'Failed to upload image',
        error: uploadError.message
      });
    }
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'Upload failed',
      error: error.message
    });
  }
};
