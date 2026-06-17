const Advertisement = require('../models/Advertisement');
const { uploadToGoogleDrive, deleteFromGoogleDrive } = require('../config/googleDrive');
const { validationResult } = require('express-validator');

/**
 * Get all advertisements
 * GET /api/advertisements
 * Admin only
 */
exports.getAllAdvertisements = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    if (status) {
      whereClause.status = status;
    }

    const { count, rows } = await Advertisement.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return res.status(200).json({
      success: true,
      message: 'Advertisements fetched successfully',
      data: {
        advertisements: rows,
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get advertisements error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch advertisements',
      error: error.message
    });
  }
};

/**
 * Get single advertisement by ID
 * GET /api/advertisements/:id
 * Admin only
 */
exports.getAdvertisementById = async (req, res) => {
  try {
    const { id } = req.params;

    const advertisement = await Advertisement.findByPk(id);

    if (!advertisement) {
      return res.status(404).json({
        success: false,
        message: 'Advertisement not found',
        error: 'No advertisement found with this ID'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Advertisement fetched successfully',
      advertisement
    });
  } catch (error) {
    console.error('Get advertisement error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch advertisement',
      error: error.message
    });
  }
};

/**
 * Create new advertisement
 * POST /api/advertisements
 * Admin only
 */
exports.createAdvertisement = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { title, link, status } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Image is required',
        error: 'Please upload an image for the advertisement'
      });
    }

    try {
      // Upload image to Google Drive
      const { imageUrl, fileId } = await uploadToGoogleDrive(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      // Create advertisement
      const advertisement = await Advertisement.create({
        title,
        image: imageUrl,
        link: link || null,
        status: status || 'active',
        fileId: fileId
      });

      return res.status(201).json({
        success: true,
        message: 'Advertisement created successfully',
        advertisement
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
    console.error('Create advertisement error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create advertisement',
      error: error.message
    });
  }
};

/**
 * Update advertisement
 * PUT /api/advertisements/:id
 * Admin only
 */
exports.updateAdvertisement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, link, status } = req.body;

    const advertisement = await Advertisement.findByPk(id);

    if (!advertisement) {
      return res.status(404).json({
        success: false,
        message: 'Advertisement not found',
        error: 'No advertisement found with this ID'
      });
    }

    // If new image is uploaded
    if (req.file) {
      try {
        // Delete old image from Google Drive
        if (advertisement.fileId) {
          await deleteFromGoogleDrive(advertisement.fileId);
        }

        // Upload new image
        const { imageUrl, fileId } = await uploadToGoogleDrive(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype
        );

        advertisement.image = imageUrl;
        advertisement.fileId = fileId;
      } catch (uploadError) {
        console.error('Google Drive upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload image',
          error: uploadError.message
        });
      }
    }

    // Update other fields
    if (title) advertisement.title = title;
    if (link !== undefined) advertisement.link = link || null;
    if (status) advertisement.status = status;

    await advertisement.save();

    return res.status(200).json({
      success: true,
      message: 'Advertisement updated successfully',
      advertisement
    });
  } catch (error) {
    console.error('Update advertisement error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update advertisement',
      error: error.message
    });
  }
};

/**
 * Delete advertisement
 * DELETE /api/advertisements/:id
 * Admin only
 */
exports.deleteAdvertisement = async (req, res) => {
  try {
    const { id } = req.params;

    const advertisement = await Advertisement.findByPk(id);

    if (!advertisement) {
      return res.status(404).json({
        success: false,
        message: 'Advertisement not found',
        error: 'No advertisement found with this ID'
      });
    }

    // Delete image from Google Drive
    if (advertisement.fileId) {
      await deleteFromGoogleDrive(advertisement.fileId);
    }

    // Delete advertisement
    await advertisement.destroy();

    return res.status(200).json({
      success: true,
      message: 'Advertisement deleted successfully'
    });
  } catch (error) {
    console.error('Delete advertisement error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete advertisement',
      error: error.message
    });
  }
};
