const express = require('express');
const { body, param } = require('express-validator');
const shareController = require('../controllers/shareController');

const router = express.Router();

// Public routes
router.post(
  '/:postId/share',
  [
    param('postId').isInt().withMessage('Post ID must be an integer'),
    body('visitorId').trim().notEmpty().withMessage('Visitor ID is required'),
    body('platform')
      .optional()
      .isIn(['facebook', 'twitter', 'linkedin', 'whatsapp', 'email', 'direct'])
      .withMessage('Invalid platform')
  ],
  shareController.sharePost
);

router.get('/:postId/shares-count', shareController.getSharesCount);

router.get('/:postId/shares-by-platform', shareController.getSharesByPlatform);

module.exports = router;
