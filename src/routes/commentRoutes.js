const express = require('express');
const { body, param } = require('express-validator');
const commentController = require('../controllers/commentController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

// Public routes
router.get('/:postId/comments', commentController.getComments);

// Authenticated routes
router.post(
  '/:postId/comments',
  authMiddleware,
  [
    body('comment').trim().notEmpty().withMessage('Comment cannot be empty')
  ],
  commentController.createComment
);

router.delete(
  '/comments/:commentId',
  authMiddleware,
  commentController.deleteComment
);

// Admin routes
router.put(
  '/comments/:commentId/approve',
  authMiddleware,
  roleMiddleware(['admin']),
  commentController.approveComment
);

router.put(
  '/comments/:commentId/reject',
  authMiddleware,
  roleMiddleware(['admin']),
  commentController.rejectComment
);

module.exports = router;
