const express = require('express');
const { body, param } = require('express-validator');
const postController = require('../controllers/postController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// Public routes
router.get('/', postController.getAllPosts);
router.get('/category/:slug', postController.getPostsByCategory);
router.get('/search', postController.searchPosts);
router.get('/:slug', postController.getPostBySlug);

// Admin only routes (for blog management)
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['admin']),
  upload.single('image'),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('content').notEmpty().withMessage('Content is required'),
    body('categoryId').optional().isInt().withMessage('Category ID must be an integer')
  ],
  postController.createPost
);

router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  upload.single('image'),
  [
    body('title').optional().trim().notEmpty(),
    body('content').optional().notEmpty(),
    body('categoryId').optional().isInt(),
    body('status')
      .optional()
      .isIn(['draft', 'pending', 'published', 'rejected'])
      .withMessage('Invalid status')
  ],
  postController.updatePost
);

router.delete('/:id', authMiddleware, roleMiddleware(['admin']), postController.deletePost);

module.exports = router;
