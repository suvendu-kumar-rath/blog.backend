const Post = require('../models/Post');
const Category = require('../models/Category');
const User = require('../models/User');
const Like = require('../models/Like');
const { generateSlug, generateUniqueSlug } = require('../utils/slugGenerator');
const { Op } = require('sequelize');
const { validationResult } = require('express-validator');

// Get all posts (public)
exports.getAllPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'published' } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Post.findAndCountAll({
      where: { status },
      include: [
        { model: User, as: 'author', attributes: ['id', 'name', 'email'] },
        { model: Category, attributes: ['id', 'name', 'slug'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return res.status(200).json({
      success: true,
      message: 'Posts retrieved successfully',
      data: {
        posts: rows,
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
      message: 'Failed to retrieve posts',
      error: error.message
    });
  }
};

// Get single post by slug (public)
exports.getPostBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const post = await Post.findOne({
      where: { slug, status: 'published' },
      include: [
        { model: User, as: 'author', attributes: ['id', 'name', 'email'] },
        { model: Category, attributes: ['id', 'name', 'slug'] }
      ]
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
        error: 'The requested post does not exist'
      });
    }

    // Increment views
    post.views += 1;
    await post.save();

    return res.status(200).json({
      success: true,
      message: 'Post retrieved successfully',
      data: post
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve post',
      error: error.message
    });
  }
};

// Get posts by category (public)
exports.getPostsByCategory = async (req, res) => {
  try {
    const { slug } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const category = await Category.findOne({ where: { slug } });
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
        error: 'The requested category does not exist'
      });
    }

    const { count, rows } = await Post.findAndCountAll({
      where: { categoryId: category.id, status: 'published' },
      include: [
        { model: User, as: 'author', attributes: ['id', 'name', 'email'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return res.status(200).json({
      success: true,
      message: 'Posts retrieved successfully',
      data: {
        category,
        posts: rows,
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
      message: 'Failed to retrieve posts',
      error: error.message
    });
  }
};

// Search posts (public)
exports.searchPosts = async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
        error: 'Please provide a search term'
      });
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Post.findAndCountAll({
      where: {
        [Op.or]: [
          { title: { [Op.like]: `%${q}%` } },
          { content: { [Op.like]: `%${q}%` } }
        ],
        status: 'published'
      },
      include: [
        { model: User, as: 'author', attributes: ['id', 'name', 'email'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return res.status(200).json({
      success: true,
      message: 'Search completed successfully',
      data: {
        query: q,
        posts: rows,
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
      message: 'Search failed',
      error: error.message
    });
  }
};

// Create post (authenticated)
exports.createPost = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: errors.array()
      });
    }

    const { title, content, categoryId } = req.body;
    const image = req.file ? `/uploads/images/${req.file.filename}` : null;

    const baseSlug = generateSlug(title);
    const slug = await generateUniqueSlug(Post, baseSlug);

    const post = await Post.create({
      title,
      slug,
      content,
      image,
      authorId: req.user.id,
      categoryId,
      status: req.user.role === 'editor' ? 'pending' : 'draft'
    });

    return res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: post
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create post',
      error: error.message
    });
  }
};

// Update post (authenticated)
exports.updatePost = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: errors.array()
      });
    }

    const { id } = req.params;
    const { title, content, categoryId, status } = req.body;

    const post = await Post.findByPk(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
        error: 'The requested post does not exist'
      });
    }

    // Check authorization
    if (post.authorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        error: 'You are not authorized to update this post'
      });
    }

    if (title) {
      const baseSlug = generateSlug(title);
      const slug = await generateUniqueSlug(Post, baseSlug);
      post.title = title;
      post.slug = slug;
    }

    if (content) post.content = content;
    if (categoryId) post.categoryId = categoryId;
    if (status && req.user.role === 'admin') post.status = status;
    if (req.file) post.image = `/uploads/images/${req.file.filename}`;

    await post.save();

    return res.status(200).json({
      success: true,
      message: 'Post updated successfully',
      data: post
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update post',
      error: error.message
    });
  }
};

// Delete post (authenticated)
exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findByPk(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
        error: 'The requested post does not exist'
      });
    }

    // Check authorization
    if (post.authorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        error: 'You are not authorized to delete this post'
      });
    }

    await post.destroy();

    return res.status(200).json({
      success: true,
      message: 'Post deleted successfully',
      data: {}
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete post',
      error: error.message
    });
  }
};
