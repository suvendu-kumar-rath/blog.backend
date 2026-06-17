const express = require('express');
const { body, query } = require('express-validator');
const likeController = require('../controllers/likeController');

const router = express.Router();

// Public routes
router.post(
  '/:postId/like',
  [
    body('visitorId').trim().notEmpty().withMessage('Visitor ID is required')
  ],
  likeController.likePost
);

router.post(
  '/:postId/unlike',
  [
    body('visitorId').trim().notEmpty().withMessage('Visitor ID is required')
  ],
  likeController.unlikePost
);

router.get('/:postId/likes-count', likeController.getLikesCount);

router.get('/:postId/check-like', likeController.checkLike);

module.exports = router;
