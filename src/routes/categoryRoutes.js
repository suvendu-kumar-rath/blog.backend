const express = require('express');
const { body, param } = require('express-validator');
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

// Public routes
router.get('/', categoryController.getAllCategories);

// Admin routes
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['admin']),
  [
    body('name').trim().notEmpty().withMessage('Category name is required')
  ],
  categoryController.createCategory
);

router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  [
    body('name').optional().trim().notEmpty()
  ],
  categoryController.updateCategory
);

router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  categoryController.deleteCategory
);

module.exports = router;
