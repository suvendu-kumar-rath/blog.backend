const Like = require('../models/Like');
const Post = require('../models/Post');
const { validationResult } = require('express-validator');

// Like a post (public)
exports.likePost = async (req, res) => {
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
    const { visitorId } = req.body;

    // Check if post exists
    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
        error: 'The requested post does not exist'
      });
    }

    // Check if already liked
    const existingLike = await Like.findOne({
      where: { postId, visitorId }
    });

    if (existingLike) {
      return res.status(400).json({
        success: false,
        message: 'Already liked',
        error: 'You have already liked this post'
      });
    }

    // Create like
    const like = await Like.create({
      postId,
      visitorId
    });

    // Get current like count
    const likeCount = await Like.count({ where: { postId } });

    return res.status(201).json({
      success: true,
      message: 'Post liked successfully',
      data: {
        like,
        likeCount
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to like post',
      error: error.message
    });
  }
};

// Unlike a post (public)
exports.unlikePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { visitorId } = req.body;

    // Check if post exists
    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
        error: 'The requested post does not exist'
      });
    }

    // Find and delete like
    const like = await Like.findOne({
      where: { postId, visitorId }
    });

    if (!like) {
      return res.status(404).json({
        success: false,
        message: 'Like not found',
        error: 'You have not liked this post'
      });
    }

    await like.destroy();

    // Get current like count
    const likeCount = await Like.count({ where: { postId } });

    return res.status(200).json({
      success: true,
      message: 'Post unliked successfully',
      data: {
        likeCount
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to unlike post',
      error: error.message
    });
  }
};

// Get likes count for a post (public)
exports.getLikesCount = async (req, res) => {
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

    const likeCount = await Like.count({ where: { postId } });

    return res.status(200).json({
      success: true,
      message: 'Like count retrieved successfully',
      data: {
        postId,
        likeCount
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve like count',
      error: error.message
    });
  }
};

// Check if user has liked (public)
exports.checkLike = async (req, res) => {
  try {
    const { postId } = req.params;
    const { visitorId } = req.query;

    if (!visitorId) {
      return res.status(400).json({
        success: false,
        message: 'Visitor ID is required',
        error: 'Please provide a visitor ID'
      });
    }

    // Check if post exists
    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
        error: 'The requested post does not exist'
      });
    }

    const like = await Like.findOne({
      where: { postId, visitorId }
    });

    return res.status(200).json({
      success: true,
      message: 'Like status retrieved successfully',
      data: {
        postId,
        visitorId,
        isLiked: !!like
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to check like status',
      error: error.message
    });
  }
};
