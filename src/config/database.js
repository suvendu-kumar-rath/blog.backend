const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,                    // Reduced for shared hosting
      min: 1,                    // Always maintain minimum connections
      acquire: 20000,            // Reduced timeout (20s)
      idle: 5000,                // Shorter idle time (5s)
      evict: 10000               // Evict idle connections every 10s
    },
    dialectOptions: {
      connectTimeout: 10000,     // Connection timeout (10s)
      supportBigNumbers: true,
      bigNumberStrings: true,
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    },
    define: {
      timestamps: true,
      underscored: false
    },
    retry: {
      max: 3,                    // Retry failed connections 3 times
      timeout: 5000              // Wait 5s between retries
    }
  }
);

// Store connection status
sequelize.isConnected = false;

module.exports = sequelize;
