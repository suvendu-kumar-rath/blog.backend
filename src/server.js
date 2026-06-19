require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const sequelize = require('./config/database');
const path = require('path');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const advertisementRoutes = require('./routes/advertisementRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const likeRoutes = require('./routes/likeRoutes');
const shareRoutes = require('./routes/shareRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

const app = express();

// ==================== SECURITY MIDDLEWARE ====================
// Helmet for security headers
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/api/health' || req.path === '/api/db-status';
  }
});
app.use('/api/', limiter);

// ==================== BODY PARSER MIDDLEWARE ====================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ==================== LOGGING MIDDLEWARE ====================
app.use(morgan('combined'));

// ==================== STATIC FILES ====================
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ==================== ROUTES ====================
// Authentication routes
app.use('/api/auth', authRoutes);

// User and editor management routes
app.use('/api/users', userRoutes);

// Post management routes
app.use('/api/posts', postRoutes);
app.use('/api/posts', likeRoutes);
app.use('/api/posts', shareRoutes);

// Advertisement management routes
app.use('/api/advertisements', advertisementRoutes);

// Image upload routes
app.use('/api/upload', uploadRoutes);

// Category routes
app.use('/api/categories', categoryRoutes);

// ==================== HEALTH CHECK ====================
app.get('/api/health', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Server is running',
    data: {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: sequelize.isConnected ? 'connected' : 'disconnected'
    }
  });
});

// ==================== DATABASE STATUS ENDPOINT ====================
app.get('/api/db-status', async (req, res) => {
  try {
    const isConnected = await sequelize.authenticate();
    return res.status(200).json({
      success: true,
      message: 'Database is connected',
      data: {
        status: 'connected',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return res.status(503).json({
      success: false,
      message: 'Database connection failed',
      data: {
        status: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// ==================== 404 HANDLER ====================
app.use('*', (req, res) => {
  return res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    error: `The requested endpoint ${req.originalUrl} does not exist`,
    availableEndpoints: {
      auth: [
        'POST /api/auth/register',
        'POST /api/auth/login',
        'GET /api/auth/profile',
        'POST /api/auth/logout'
      ],
      users: [
        'GET /api/users (admin only)',
        'GET /api/users/profile/me',
        'GET /api/editors (admin only)',
        'POST /api/editors (admin only)',
        'GET /api/editors/:id (admin only)',
        'PUT /api/editors/:id (admin only)',
        'DELETE /api/editors/:id (admin only)'
      ],
      posts: [
        'GET /api/posts',
        'POST /api/posts (admin & editor)',
        'GET /api/posts/:id',
        'PUT /api/posts/:id (admin & editor)',
        'DELETE /api/posts/:id (admin & editor)'
      ],
      advertisements: [
        'GET /api/advertisements (admin only)',
        'POST /api/advertisements (admin only)',
        'GET /api/advertisements/:id (admin only)',
        'PUT /api/advertisements/:id (admin only)',
        'DELETE /api/advertisements/:id (admin only)'
      ],
      upload: [
        'POST /api/upload (authenticated users)'
      ],
      health: [
        'GET /api/health',
        'GET /api/db-status'
      ]
    }
  });
});

// ==================== ERROR HANDLING MIDDLEWARE ====================
app.use((error, req, res, next) => {
  console.error('Error:', {
    message: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    path: req.path,
    method: req.method
  });

  // Handle Multer errors
  if (error.name === 'MulterError') {
    if (error.code === 'FILE_TOO_LARGE') {
      return res.status(413).json({
        success: false,
        message: 'File too large',
        error: 'File size exceeds maximum limit of 5MB'
      });
    }
    return res.status(400).json({
      success: false,
      message: 'File upload error',
      error: error.message
    });
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      error: error.message
    });
  }

  // Handle Sequelize validation errors
  if (error.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  // Handle Sequelize unique constraint errors
  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'Duplicate entry',
      error: `${error.errors[0].path} already exists`
    });
  }

  // Default error
  return res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
});

// ==================== DATABASE CONNECTION (ASYNC) ====================
const initializeDatabase = async () => {
  let retries = 0;
  const maxRetries = 5;
  const retryDelay = 5000; // 5 seconds

  const attemptConnection = async () => {
    try {
      console.log(`\n📡 Attempting database connection (attempt ${retries + 1}/${maxRetries})...`);
      
      // Test database connection
      await sequelize.authenticate();
      console.log('✓ Database connection established');

      // Sync models with database
      await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
      console.log('✓ Database models synchronized');

      // Mark database as connected
      sequelize.isConnected = true;
      console.log('✓ Database is ready for operations\n');

      return true;
    } catch (error) {
      retries++;
      console.error(`✗ Database connection failed: ${error.message}`);

      if (retries < maxRetries) {
        console.log(`⏳ Retrying in ${retryDelay / 1000} seconds...\n`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return attemptConnection();
      } else {
        console.warn('⚠️  Max database connection retries reached. Server running without database.');
        console.warn('⚠️  Database-dependent operations will fail until connection is restored.\n');
        return false;
      }
    }
  };

  return attemptConnection();
};

// ==================== SERVER START ====================
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║           CMS Admin Panel Backend - API Server            ║
║                                                           ║
║  Port:        ${PORT}                                          ║
║  Environment: ${(process.env.NODE_ENV || 'development').padEnd(15)}             ║
║  Status:      ✓ Running                                  ║
╚═══════════════════════════════════════════════════════════╝
  `);
  console.log('📚 Available Features:');
  console.log('  ✓ Role-based Authentication (Admin/Editor)');
  console.log('  ✓ JWT Token-based Authorization');
  console.log('  ✓ Editor Management (Admin only)');
  console.log('  ✓ Post Management (Admin & Editor)');
  console.log('  ✓ Advertisement Management (Admin only)');
  console.log('  ✓ Google Drive Image Upload');
  console.log('  ✓ Rate Limiting & Security Headers');
  console.log('  ✓ Error Handling & Validation');
  console.log('\n📡 Health Checks: /api/health (server) | /api/db-status (database)\n');
});

// Initialize database asynchronously (non-blocking)
initializeDatabase().catch(error => {
  console.error('Database initialization error:', error.message);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏹  Shutting down gracefully...');
  
  try {
    if (sequelize.isConnected) {
      await sequelize.close();
      console.log('✓ Database connection closed');
    }
  } catch (error) {
    console.error('Error closing database:', error.message);
  }

  server.close(() => {
    console.log('✓ Server closed');
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    console.error('✗ Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = app;
