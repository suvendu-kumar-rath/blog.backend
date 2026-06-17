const User = require('../models/User');
const bcryptjs = require('bcryptjs');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

/**
 * Get all editors
 * GET /api/editors
 * Admin only
 */
exports.getAllEditors = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = { role: 'editor' };
    
    if (search) {
      whereClause = {
        ...whereClause,
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } }
        ]
      };
    }

    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      offset,
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      message: 'Editors fetched successfully',
      data: {
        editors: rows,
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get editors error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch editors',
      error: error.message
    });
  }
};

/**
 * Get single editor by ID
 * GET /api/editors/:id
 * Admin only
 */
exports.getEditorById = async (req, res) => {
  try {
    const { id } = req.params;

    const editor = await User.findOne({
      where: { id, role: 'editor' },
      attributes: { exclude: ['password'] }
    });

    if (!editor) {
      return res.status(404).json({
        success: false,
        message: 'Editor not found',
        error: 'No editor found with this ID'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Editor fetched successfully',
      editor
    });
  } catch (error) {
    console.error('Get editor error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch editor',
      error: error.message
    });
  }
};

/**
 * Create new editor
 * POST /api/editors
 * Admin only
 */
exports.createEditor = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { name, email, password, phone } = req.body;

    // Validate phone if provided
    if (phone && !/^\d{10}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number',
        error: 'Phone number must be exactly 10 digits'
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists',
        error: 'An editor with this email already exists'
      });
    }

    // Create editor
    const editor = await User.create({
      name,
      email,
      password,
      phone: phone || null,
      role: 'editor',
      isActive: true
    });

    return res.status(201).json({
      success: true,
      message: 'Editor created successfully',
      editor: {
        id: editor.id,
        name: editor.name,
        email: editor.email,
        phone: editor.phone,
        role: editor.role,
        isActive: editor.isActive,
        createdAt: editor.createdAt
      }
    });
  } catch (error) {
    console.error('Create editor error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create editor',
      error: error.message
    });
  }
};

/**
 * Update editor
 * PUT /api/editors/:id
 * Admin only
 */
exports.updateEditor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, isActive } = req.body;

    const editor = await User.findOne({
      where: { id, role: 'editor' }
    });

    if (!editor) {
      return res.status(404).json({
        success: false,
        message: 'Editor not found',
        error: 'No editor found with this ID'
      });
    }

    // Check if email is already taken by another user
    if (email && email !== editor.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists',
          error: 'Another user already has this email'
        });
      }
    }

    // Validate phone if provided
    if (phone && !/^\d{10}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number',
        error: 'Phone number must be exactly 10 digits'
      });
    }

    // Update editor
    await editor.update({
      name: name || editor.name,
      email: email || editor.email,
      phone: phone !== undefined ? phone : editor.phone,
      isActive: isActive !== undefined ? isActive : editor.isActive
    });

    return res.status(200).json({
      success: true,
      message: 'Editor updated successfully',
      editor: {
        id: editor.id,
        name: editor.name,
        email: editor.email,
        phone: editor.phone,
        role: editor.role,
        isActive: editor.isActive
      }
    });
  } catch (error) {
    console.error('Update editor error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update editor',
      error: error.message
    });
  }
};

/**
 * Delete editor
 * DELETE /api/editors/:id
 * Admin only
 */
exports.deleteEditor = async (req, res) => {
  try {
    const { id } = req.params;

    const editor = await User.findOne({
      where: { id, role: 'editor' }
    });

    if (!editor) {
      return res.status(404).json({
        success: false,
        message: 'Editor not found',
        error: 'No editor found with this ID'
      });
    }

    // Delete editor
    await editor.destroy();

    return res.status(200).json({
      success: true,
      message: 'Editor deleted successfully'
    });
  } catch (error) {
    console.error('Delete editor error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete editor',
      error: error.message
    });
  }
};

/**
 * Get all users (admin only)
 * GET /api/users
 */
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (role && ['admin', 'editor'].includes(role)) {
      where.role = role;
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: {
        users: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve users',
      error: error.message
    });
  }
};

/**
 * Get user profile (authenticated)
 * GET /api/users/profile/me
 */
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'User profile not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'User profile fetched successfully',
      user
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile',
      error: error.message
    });
  }
};


    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'The requested user does not exist'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      data: user
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve user profile',
      error: error.message
    });
  }
};

// Create editor (admin only)
exports.createEditor = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: errors.array()
      });
    }

    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use',
        error: 'User with this email already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const editor = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'editor'
    });

    return res.status(201).json({
      success: true,
      message: 'Editor created successfully',
      data: {
        id: editor.id,
        name: editor.name,
        email: editor.email,
        role: editor.role
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create editor',
      error: error.message
    });
  }
};

// Update user role (admin only)
exports.updateUserRole = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: errors.array()
      });
    }

    const { userId } = req.params;
    const { role } = req.body;

    if (!['admin', 'editor', 'user'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role',
        error: 'Role must be admin, editor, or user'
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'The requested user does not exist'
      });
    }

    user.role = role;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update user role',
      error: error.message
    });
  }
};

// Delete user (admin only)
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'The requested user does not exist'
      });
    }

    // Prevent deleting the only admin
    if (user.role === 'admin') {
      const adminCount = await User.count({ where: { role: 'admin' } });
      if (adminCount === 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the only admin',
          error: 'At least one admin must exist in the system'
        });
      }
    }

    await user.destroy();

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: {}
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};
