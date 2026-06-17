const express = require('express');
const { body, param } = require('express-validator');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

/**
 * Get current user profile
 * GET /api/users/profile/me
 */
router.get(
  '/profile/me',
  authMiddleware,
  userController.getUserProfile
);

/**
 * EDITOR MANAGEMENT ROUTES (Admin only)
 */

/**
 * Get all editors
 * GET /api/editors
 */
router.get(
  '/editors',
  authMiddleware,
  roleMiddleware(['admin']),
  userController.getAllEditors
);

/**
 * Get single editor
 * GET /api/editors/:id
 */
router.get(
  '/editors/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  [param('id').isNumeric().withMessage('Invalid editor ID')],
  userController.getEditorById
);

/**
 * Create new editor
 * POST /api/editors
 */
router.post(
  '/editors',
  authMiddleware,
  roleMiddleware(['admin']),
  [
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required')
      .isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email')
      .isEmail().withMessage('Valid email is required')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phone')
      .optional()
      .matches(/^\d{10}$/).withMessage('Phone number must be exactly 10 digits')
  ],
  userController.createEditor
);

/**
 * Update editor
 * PUT /api/editors/:id
 */
router.put(
  '/editors/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  [
    param('id').isNumeric().withMessage('Invalid editor ID'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email')
      .optional()
      .isEmail().withMessage('Valid email is required'),
    body('phone')
      .optional()
      .matches(/^\d{10}$/).withMessage('Phone number must be exactly 10 digits'),
    body('isActive')
      .optional()
      .isBoolean().withMessage('isActive must be a boolean')
  ],
  userController.updateEditor
);

/**
 * Delete editor
 * DELETE /api/editors/:id
 */
router.delete(
  '/editors/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  [param('id').isNumeric().withMessage('Invalid editor ID')],
  userController.deleteEditor
);

/**
 * Get all users (Admin only)
 * GET /api/users
 */
router.get(
  '/',
  authMiddleware,
  roleMiddleware(['admin']),
  userController.getAllUsers
);

module.exports = router;

);

module.exports = router;
