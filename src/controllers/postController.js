const Post = require('../models/Post');
const User = require('../models/User');
const { Op } = require('sequelize');

// ==================== PUBLIC ENDPOINTS ====================

// Get all posts with pagination, filtering by category and trending
exports.getAllPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, isTrending, status = 'published' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (pageNum < 1 || limitNum < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pagination parameters',
        error: 'Page and limit must be positive integers'
      });
    }

    const offset = (pageNum - 1) * limitNum;

    // Build where clause dynamically
    const whereClause = { status };
    
    if (category) {
      whereClause.category = category;
    }
    
    if (isTrending !== undefined) {
      whereClause.isTrending = isTrending === 'true' || isTrending === true;
    }

    const { count, rows } = await Post.findAndCountAll({
      where: whereClause,
      include: [
        { 
          model: User, 
          as: 'author', 
          attributes: ['id', 'name', 'email', 'phone']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: limitNum,
      offset: offset
    });

    return res.status(200).json({
      success: true,
      message: 'Posts retrieved successfully',
      data: {
        posts: rows,
        pagination: {
          total: count,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(count / limitNum)
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

// Get single post by ID
exports.getPostById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID',
        error: 'Post ID must be a valid integer'
      });
    }

    const post = await Post.findByPk(id, {
      include: [
        { 
          model: User, 
          as: 'author', 
          attributes: ['id', 'name', 'email', 'phone']
        }
      ]
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
        error: `No post found with ID: ${id}`
      });
    }

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

// ==================== AUTHENTICATED ENDPOINTS ====================

// Create post (authenticated, admin & editor)
exports.createPost = async (req, res) => {
  try {
    const { heading, matter, category, subcategory, images, status } = req.body;
    const authorId = req.user.id;

    // Validation
    if (!heading || !heading.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: 'Heading is required'
      });
    }

    if (!matter || !matter.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: 'Content (matter) is required'
      });
    }

    if (!category || !category.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: 'Category is required'
      });
    }

    // Validate images if provided
    if (images) {
      let parsedImages = images;
      if (typeof images === 'string') {
        try {
          parsedImages = JSON.parse(images);
        } catch (e) {
          return res.status(400).json({
            success: false,
            message: 'Validation error',
            error: 'Images must be a valid JSON array'
          });
        }
      }

      if (!Array.isArray(parsedImages)) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          error: 'Images must be an array'
        });
      }

      if (parsedImages.length > 5) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          error: 'Maximum 5 images allowed'
        });
      }

      if (!parsedImages.every(img => typeof img === 'string')) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          error: 'All images must be strings (URLs or file paths)'
        });
      }
    }

    // Validate status if provided
    if (status && !['draft', 'published'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: 'Status must be either "draft" or "published"'
      });
    }

    const newPost = await Post.create({
      heading: heading.trim(),
      matter: matter.trim(),
      category: category.trim(),
      subcategory: subcategory ? subcategory.trim() : null,
      images: images ? (typeof images === 'string' ? JSON.parse(images) : images) : [],
      status: status || 'published',
      authorId
    });

    // Fetch the created post with author details
    const createdPost = await Post.findByPk(newPost.id, {
      include: [
        { 
          model: User, 
          as: 'author', 
          attributes: ['id', 'name', 'email', 'phone']
        }
      ]
    });

    return res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: createdPost
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create post',
      error: error.message
    });
  }
};

// Update post (authenticated, admin & editor)
exports.updatePost = async (req, res) => {
  try {
    console.log('[DEBUG updatePost] Request body:', JSON.stringify(req.body));
    
    const { id } = req.params;
    const { heading, matter, category, subcategory, images, status, isTrending } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    console.log('[DEBUG updatePost] Extracted fields:', { heading, matter, category, subcategory, status, isTrending });

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID',
        error: 'Post ID must be a valid integer'
      });
    }

    const post = await Post.findByPk(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
        error: `No post found with ID: ${id}`
      });
    }

    // Authorization check: only admin or the author can update
    if (userRole !== 'admin' && post.authorId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
        error: 'You can only update your own posts'
      });
    }

    // Build update object only with provided fields
    const updateData = {};

    // Validate and add to update object
    if (heading !== undefined) {
      if (!heading || !heading.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          error: 'Heading cannot be empty'
        });
      }
      updateData.heading = heading.trim();
    }

    if (matter !== undefined) {
      if (!matter || !matter.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          error: 'Content (matter) cannot be empty'
        });
      }
      updateData.matter = matter.trim();
    }

    if (category !== undefined) {
      if (!category || !category.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          error: 'Category cannot be empty'
        });
      }
      updateData.category = category.trim();
    }

    if (subcategory !== undefined) {
      updateData.subcategory = subcategory ? subcategory.trim() : null;
    }

    if (images !== undefined) {
      let parsedImages = images;
      if (typeof images === 'string') {
        try {
          parsedImages = JSON.parse(images);
        } catch (e) {
          return res.status(400).json({
            success: false,
            message: 'Validation error',
            error: 'Images must be a valid JSON array'
          });
        }
      }

      if (!Array.isArray(parsedImages)) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          error: 'Images must be an array'
        });
      }

      if (parsedImages.length > 5) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          error: 'Maximum 5 images allowed'
        });
      }

      if (!parsedImages.every(img => typeof img === 'string')) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          error: 'All images must be strings (URLs or file paths)'
        });
      }

      updateData.images = parsedImages;
    }

    if (status !== undefined) {
      if (!['draft', 'published'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          error: 'Status must be either "draft" or "published"'
        });
      }
      updateData.status = status;
    }

    if (isTrending !== undefined) {
      updateData.isTrending = Boolean(isTrending);
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: 'No fields provided to update'
      });
    }

    console.log(`[DEBUG updatePost] Update data:`, JSON.stringify(updateData));

    // Force updatedAt to current time
    updateData.updatedAt = new Date();

    // Use static update method 
    const [updatedCount] = await Post.update(updateData, {
      where: { id: parseInt(id) }
    });

    console.log(`[DEBUG] Update result for post ${id}:`, updatedCount, 'rows affected');

    if (updatedCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'Update failed',
        error: 'No rows were updated'
      });
    }

    // Fetch updated post with author details - fresh from DB
    const updatedPost = await Post.findByPk(parseInt(id), {
      include: [
        { 
          model: User, 
          as: 'author', 
          attributes: ['id', 'name', 'email', 'phone']
        }
      ],
      raw: false
    });

    console.log(`[DEBUG updatePost] Fetched post:`, JSON.stringify({
      id: updatedPost?.id,
      heading: updatedPost?.heading,
      matter: updatedPost?.matter,
      updatedAt: updatedPost?.updatedAt,
      requestedHeading: heading
    }));

    return res.status(200).json({
      success: true,
      message: 'Post updated successfully',
      data: updatedPost
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update post',
      error: error.message
    });
  }
};

// Mark post as trending (authenticated, admin only)
exports.markAsTrending = async (req, res) => {
  try {
    const { id } = req.params;
    const { isTrending } = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID',
        error: 'Post ID must be a valid integer'
      });
    }

    if (isTrending === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: 'isTrending field is required and must be a boolean'
      });
    }

    const post = await Post.findByPk(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
        error: `No post found with ID: ${id}`
      });
    }

    post.isTrending = Boolean(isTrending);
    await post.save();

    // Fetch updated post with author details
    const updatedPost = await Post.findByPk(id, {
      include: [
        { 
          model: User, 
          as: 'author', 
          attributes: ['id', 'name', 'email', 'phone']
        }
      ]
    });

    return res.status(200).json({
      success: true,
      message: `Post marked as ${isTrending ? 'trending' : 'not trending'} successfully`,
      data: updatedPost
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update trending status',
      error: error.message
    });
  }
};

// Delete post (authenticated, admin only)
exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID',
        error: 'Post ID must be a valid integer'
      });
    }

    const post = await Post.findByPk(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
        error: `No post found with ID: ${id}`
      });
    }

    const deletedPost = await post.destroy();

    return res.status(200).json({
      success: true,
      message: 'Post deleted successfully',
      data: {
        id: id,
        heading: post.heading
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete post',
      error: error.message
    });
  }
};
