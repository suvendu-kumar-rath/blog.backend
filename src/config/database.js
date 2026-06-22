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
      max: 3,                    // Minimal for shared hosting
      min: 0,
      acquire: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 20000,
      idle: parseInt(process.env.DB_IDLE_TIMEOUT) || 5000,
      evict: 10000
    },
    dialectOptions: {
      connectTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 20000,
      supportBigNumbers: true,
      bigNumberStrings: true,
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      waitForConnections: true
    },
    define: {
      timestamps: true,
      underscored: false
    },
    maxConcurrentQueries: 2,     // Limit concurrent queries
    timezone: '+00:00'
  }
);

// Store connection status
sequelize.isConnected = false;



module.exports = sequelize;
