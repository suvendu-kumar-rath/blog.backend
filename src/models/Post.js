const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Post = sequelize.define('Post', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  heading: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Heading is required' },
      len: [3, 255]
    }
  },
  matter: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Content (matter) is required' }
    }
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Category is required' }
    }
  },
  subcategory: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  images: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null
  },
  isTrending: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  status: {
    type: DataTypes.ENUM('draft', 'published'),
    defaultValue: 'published',
    validate: {
      isIn: [['draft', 'published']]
    }
  },
  authorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    },
    validate: {
      notEmpty: { msg: 'Author ID is required' }
    }
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'posts',
  timestamps: true,
  indexes: [
    { fields: ['category'] },
    { fields: ['isTrending'] },
    { fields: ['status'] },
    { fields: ['authorId'] }
  ]
});

// Association with User
Post.belongsTo(User, { 
  foreignKey: 'authorId', 
  as: 'author'
});

module.exports = Post;
