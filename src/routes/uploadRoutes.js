const express = require('express');
const uploadController = require('../controllers/uploadController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

/**
 * Upload image to Google Drive
 * POST /api/upload
 * Authenticated users
 */
router.post(
  '/',
  authMiddleware,
  upload.single('image'),
  uploadController.uploadImage
);

module.exports = router;
