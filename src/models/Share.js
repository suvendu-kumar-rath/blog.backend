const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Post = require('./Post');

const Share = sequelize.define('Share', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  postId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Post,
      key: 'id'
    }
  },
  visitorId: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Unique identifier for the visitor (cookie-based or session-based)'
  },
  platform: {
    type: DataTypes.ENUM('facebook', 'twitter', 'linkedin', 'whatsapp', 'email', 'direct'),
    defaultValue: 'direct',
    comment: 'Social platform or method of sharing'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'shares',
  timestamps: false
});

Share.belongsTo(Post, { foreignKey: 'postId' });

module.exports = Share;
