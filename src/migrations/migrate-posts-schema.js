/**
 * Migration script to update posts table schema
 * Run this before starting the server: node src/migrations/migrate-posts-schema.js
 */
require('dotenv').config();
const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

async function runMigration() {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connection established');

    const queryInterface = sequelize.getQueryInterface();

    console.log('📝 Starting posts table schema migration...\n');

    // Check if posts table exists
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('posts')) {
      console.log('ℹ️  Posts table does not exist, skipping migration');
      return;
    }

    console.log('🔄 Migrating posts table schema...');

    // Drop old columns if they exist
    const describeTable = await queryInterface.describeTable('posts');
    
    if (describeTable.title) {
      console.log('  - Removing old "title" column');
      await queryInterface.removeColumn('posts', 'title');
    }

    if (describeTable.slug) {
      console.log('  - Removing old "slug" column');
      await queryInterface.removeColumn('posts', 'slug');
    }

    if (describeTable.content) {
      console.log('  - Removing old "content" column');
      await queryInterface.removeColumn('posts', 'content');
    }

    if (describeTable.image) {
      console.log('  - Removing old "image" column');
      await queryInterface.removeColumn('posts', 'image');
    }

    if (describeTable.categoryId) {
      console.log('  - Removing old "categoryId" column');
      await queryInterface.removeColumn('posts', 'categoryId');
    }

    if (describeTable.views) {
      console.log('  - Removing old "views" column');
      await queryInterface.removeColumn('posts', 'views');
    }

    // Add new columns if they don't exist
    const updatedTable = await queryInterface.describeTable('posts');

    if (!updatedTable.heading) {
      console.log('  - Adding new "heading" column');
      await queryInterface.addColumn('posts', 'heading', {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: 'Untitled'
      });
    }

    if (!updatedTable.matter) {
      console.log('  - Adding new "matter" column');
      await queryInterface.addColumn('posts', 'matter', {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: ''
      });
    }

    if (!updatedTable.category) {
      console.log('  - Adding new "category" column');
      await queryInterface.addColumn('posts', 'category', {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: 'general'
      });
    }

    if (!updatedTable.subcategory) {
      console.log('  - Adding new "subcategory" column');
      await queryInterface.addColumn('posts', 'subcategory', {
        type: DataTypes.STRING(100),
        allowNull: true
      });
    }

    if (!updatedTable.images) {
      console.log('  - Adding new "images" column');
      await queryInterface.addColumn('posts', 'images', {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null
      });
    }

    if (!updatedTable.isTrending) {
      console.log('  - Adding new "isTrending" column');
      await queryInterface.addColumn('posts', 'isTrending', {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      });
    }

    // Update status enum if needed
    if (updatedTable.status) {
      console.log('  - Updating "status" enum to (draft, published)');
      // For MySQL, we need to drop and recreate the enum
      try {
        await queryInterface.sequelize.query(
          `ALTER TABLE posts MODIFY COLUMN status ENUM('draft', 'published') DEFAULT 'published'`
        );
      } catch (err) {
        console.log('  ⚠️  Could not update status enum:', err.message);
      }
    }

    console.log('\n✓ Migration completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();
