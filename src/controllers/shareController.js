const Share = require('../models/Share');
const Post = require('../models/Post');
const { validationResult } = require('express-validator');

// Share a post (public)
exports.sharePost = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: errors.array()
      });
    }

    const { postId } = req.params;
    const { visitorId, platform = 'direct' } = req.body;

    // Check if post exists
    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
        error: 'The requested post does not exist'
      });
    }

    // Create share record
    const share = await Share.create({
      postId,
      visitorId,
      platform
    });

    // Get current share count
    const shareCount = await Share.count({ where: { postId } });

    return res.status(201).json({
      success: true,
      message: 'Post shared successfully',
      data: {
        share,
        shareCount
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to share post',
      error: error.message
    });
  }
};

// Get shares count (public)
exports.getSharesCount = async (req, res) => {
  try {
    const { postId } = req.params;

    // Check if post exists
    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
        error: 'The requested post does not exist'
      });
    }

    const shareCount = await Share.count({ where: { postId } });

    return res.status(200).json({
      success: true,
      message: 'Share count retrieved successfully',
      data: { postId, shareCount }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve share count',
      error: error.message
    });
  }
};

// Get shares by platform (public)
exports.getSharesByPlatform = async (req, res) => {
  try {
    const { postId } = req.params;

    // Check if post exists
    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
        error: 'The requested post does not exist'
      });
    }

    const shares = await Share.findAll({
      where: { postId },
      attributes: ['platform', [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']],
      group: ['platform'],
      raw: true
    });

    return res.status(200).json({
      success: true,
      message: 'Shares by platform retrieved successfully',
      data: { postId, shares }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve shares',
      error: error.message
    });
  }
};
