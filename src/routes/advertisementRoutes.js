const express = require('express');
const { body, param } = require('express-validator');
const advertisementController = require('../controllers/advertisementController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

/**
 * ADVERTISEMENT ROUTES (Admin only)
 */

/**
 * Get all advertisements
 * GET /api/advertisements
 */
router.get(
  '/',
  authMiddleware,
  roleMiddleware(['admin']),
  advertisementController.getAllAdvertisements
);

/**
 * Get single advertisement
 * GET /api/advertisements/:id
 */
router.get(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  [param('id').isNumeric().withMessage('Invalid advertisement ID')],
  advertisementController.getAdvertisementById
);

/**
 * Create new advertisement with image upload
 * POST /api/advertisements
 */
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['admin']),
  upload.single('image'),
  [
    body('title')
      .trim()
      .notEmpty().withMessage('Title is required')
      .isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
    body('link')
      .optional()
      .isURL().withMessage('Link must be a valid URL'),
    body('status')
      .optional()
      .isIn(['active', 'inactive']).withMessage('Status must be either active or inactive')
  ],
  advertisementController.createAdvertisement
);

/**
 * Update advertisement with optional image upload
 * PUT /api/advertisements/:id
 */
router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  upload.single('image'),
  [
    param('id').isNumeric().withMessage('Invalid advertisement ID'),
    body('title')
      .optional()
      .trim()
      .isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
    body('link')
      .optional()
      .isURL().withMessage('Link must be a valid URL'),
    body('status')
      .optional()
      .isIn(['active', 'inactive']).withMessage('Status must be either active or inactive')
  ],
  advertisementController.updateAdvertisement
);

/**
 * Delete advertisement
 * DELETE /api/advertisements/:id
 */
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  [param('id').isNumeric().withMessage('Invalid advertisement ID')],
  advertisementController.deleteAdvertisement
);

module.exports = router;
