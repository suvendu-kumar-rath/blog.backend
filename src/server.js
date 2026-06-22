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

// ==================== DATABASE AVAILABILITY MIDDLEWARE ====================
// Middleware to check if database operations are allowed
const dbReadyMiddleware = (req, res, next) => {
  // Skip for health check endpoints
  if (req.path === '/api/health' || req.path === '/api/db-status' || req.path === '/' || req.path === '/api/startup') {
    return next();
  }

  // If database is not connected, return 503 Service Unavailable
  if (!sequelize.isConnected) {
    return res.status(503).json({
      success: false,
      message: 'Service temporarily unavailable',
      error: 'Database connection is being established. Please try again in a few moments.',
      data: {
        status: 'initializing',
        timestamp: new Date().toISOString()
      }
    });
  }

  next();
};

// ==================== ROUTES ====================
// Root health check — always responds 200
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API server is running',
    db: sequelize.isConnected ? 'connected' : 'connecting'
  });
});

// Apply database ready middleware to all API routes
app.use('/api/', dbReadyMiddleware);

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
      database: sequelize.isConnected ? 'connected' : 'connecting'
    }
  });
});

// ==================== STARTUP CHECK ENDPOINT ====================
app.get('/api/startup', (req, res) => {
  if (sequelize.isConnected) {
    return res.status(200).json({
      success: true,
      message: 'Application is ready',
      data: {
        status: 'ready',
        timestamp: new Date().toISOString()
      }
    });
  } else {
    return res.status(503).json({
      success: false,
      message: 'Application is initializing',
      data: {
        status: 'initializing',
        timestamp: new Date().toISOString()
      }
    });
  }
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
  const maxRetries = 10;
  const retryDelay = 3000; // 3 seconds

  const attemptConnection = async () => {
    try {
      console.log(`📡 Database connection attempt ${retries + 1}/${maxRetries}...`);
      
      // Test database connection
      await sequelize.authenticate();
      console.log('✓ Database connection established');

      // Sync models with database (non-blocking for production)
      if (process.env.NODE_ENV === 'development') {
        await sequelize.sync({ alter: true });
        console.log('✓ Database models synchronized (development mode)');
      } else {
        // In production, don't use alter mode to avoid accidental changes
        sequelize.sync({ alter: false }).catch(err => {
          console.warn('⚠️  Database sync warning:', err.message);
        });
        console.log('✓ Database models check started (production mode)');
      }

      // Mark database as connected
      sequelize.isConnected = true;
      console.log('✓ Database is ready for operations\n');

      return true;
    } catch (error) {
      retries++;
      console.error(`✗ Connection failed: ${error.message}`);

      if (retries < maxRetries) {
        console.log(`⏳ Retry in ${retryDelay / 1000}s... (${retries}/${maxRetries})\n`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return attemptConnection();
      } else {
        console.error('✗ Max retries reached. Database connection failed.');
        console.error('⚠️  Server is running but database operations will fail.\n');
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
  console.log('📚 Available Endpoints:');
  console.log('  ✓ /api/health - Server health check');
  console.log('  ✓ /api/startup - App readiness check');
  console.log('  ✓ /api/db-status - Database status');
  console.log('\n✓ Server listening on http://localhost:' + PORT);
  console.log('⏳ Initializing database connection...\n');
});

// Initialize database asynchronously (non-blocking)
console.log('⏳ Starting database initialization...\n');
initializeDatabase().catch(error => {
  console.error('Database initialization error:', error.message);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n⏹  Shutting down gracefully...');
  
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
  console.error('❌ Uncaught Exception:', error.message);
  console.error(error.stack);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
});

module.exports = app;
