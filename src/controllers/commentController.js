const Comment = require('../models/Comment');
const Post = require('../models/Post');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// Create comment (authenticated)
exports.createComment = async (req, res) => {
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
    const { comment } = req.body;

    // Check if post exists
    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
        error: 'The requested post does not exist'
      });
    }

    const newComment = await Comment.create({
      postId,
      userId: req.user.id,
      comment,
      status: 'pending'
    });

    return res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      data: newComment
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create comment',
      error: error.message
    });
  }
};

// Get comments for a post (public)
exports.getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Check if post exists
    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
        error: 'The requested post does not exist'
      });
    }

    const { count, rows } = await Comment.findAndCountAll({
      where: { postId, status: 'approved' },
      include: [{ model: User, as: 'author', attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return res.status(200).json({
      success: true,
      message: 'Comments retrieved successfully',
      data: {
        comments: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve comments',
      error: error.message
    });
  }
};

// Delete own comment (authenticated)
exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findByPk(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
        error: 'The requested comment does not exist'
      });
    }

    // Check authorization
    if (comment.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        error: 'You are not authorized to delete this comment'
      });
    }

    await comment.destroy();

    return res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
      data: {}
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete comment',
      error: error.message
    });
  }
};

// Approve comment (admin only)
exports.approveComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findByPk(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
        error: 'The requested comment does not exist'
      });
    }

    comment.status = 'approved';
    await comment.save();

    return res.status(200).json({
      success: true,
      message: 'Comment approved successfully',
      data: comment
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to approve comment',
      error: error.message
    });
  }
};

// Reject comment (admin only)
exports.rejectComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findByPk(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
        error: 'The requested comment does not exist'
      });
    }

    comment.status = 'rejected';
    await comment.save();

    return res.status(200).json({
      success: true,
      message: 'Comment rejected successfully',
      data: comment
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to reject comment',
      error: error.message
    });
  }
};
