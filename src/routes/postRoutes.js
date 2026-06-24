const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// ==================== PUBLIC ROUTES ====================

// Get all posts (with pagination, filtering by category and trending)
router.get('/', postController.getAllPosts);

// Get single post by ID
router.get('/:id', postController.getPostById);

// ==================== AUTHENTICATED ROUTES ====================

// Create post (admin & editor only)
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['admin', 'editor']),
  postController.createPost
);

// Update post (admin & editor only)
router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin', 'editor']),
  postController.updatePost
);

// Mark post as trending (admin only)
router.patch(
  '/:id/trending',
  authMiddleware,
  roleMiddleware(['admin']),
  postController.markAsTrending
);

// Delete post (admin only)
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  postController.deletePost
);

module.exports = router;
