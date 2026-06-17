const express = require('express');
const uploadController = require('../controllers/uploadController');
const authMiddleware = require('../middleware/authMiddleware');
const { uploadSingle } = require('../middleware/uploadMiddleware');

const router = express.Router();

/**
 * Upload image to Google Drive
 * POST /api/upload
 * Authenticated users
 */
router.post(
  '/',
  authMiddleware,
  uploadSingle,
  uploadController.uploadImage
);

module.exports = router;
