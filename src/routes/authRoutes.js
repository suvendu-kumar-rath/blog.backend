const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * Register - Create a new user (admin or editor)
 * POST /api/auth/register
 */
router.post(
  '/register',
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
      .matches(/^\d{10}$/).withMessage('Phone number must be exactly 10 digits'),
    body('role')
      .optional()
      .isIn(['admin', 'editor']).withMessage('Role must be either admin or editor')
  ],
  authController.register
);

/**
 * Login
 * POST /api/auth/login
 */
router.post(
  '/login',
  [
    body('email')
      .isEmail().withMessage('Valid email is required')
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('Password is required')
  ],
  authController.login
);

/**
 * Get current user profile
 * GET /api/auth/profile
 */
router.get('/profile', authMiddleware, authController.profile);

/**
 * Logout
 * POST /api/auth/logout
 */
router.post('/logout', authMiddleware, authController.logout);

module.exports = router;

