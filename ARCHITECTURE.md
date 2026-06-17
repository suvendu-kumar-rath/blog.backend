# Architecture & Design Documentation

This document describes the technical architecture, design patterns, and implementation decisions of the Blog Backend API.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Design Patterns](#design-patterns)
4. [Database Design](#database-design)
5. [API Design](#api-design)
6. [Security Architecture](#security-architecture)
7. [Error Handling](#error-handling)
8. [Scalability Considerations](#scalability-considerations)
9. [Code Organization](#code-organization)

## Architecture Overview

The Blog Backend API follows a **Layered Architecture** pattern with clear separation of concerns:

```
┌─────────────────────────────────────────┐
│         Express.js Server               │
│  (Routing, Middleware, Error Handling)  │
└─────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
┌──────────────────┐  ┌──────────────────┐
│   Controllers    │  │    Middleware    │
│  (Business Logic)│  │ (Auth, Validation)
└────────┬─────────┘  └────────┬─────────┘
         │                    │
┌────────┴────────────────────┴─────────┐
│         Sequelize ORM                 │
│     (Data Models & Queries)           │
└────────┬────────────────────────────┬─┘
         │                            │
┌────────────────┐        ┌──────────────────┐
│    MySQL       │        │   Utilities      │
│   Database     │        │  (JWT, Slugs)    │
└────────────────┘        └──────────────────┘
```

## Technology Stack

### Backend Framework
- **Express.js** - Lightweight, flexible web framework
- **Node.js** - JavaScript runtime environment

### Database
- **MySQL** - Relational database
- **Sequelize ORM** - Object-relational mapping for database operations

### Authentication & Security
- **JWT (jsonwebtoken)** - Token-based authentication
- **bcryptjs** - Password hashing and verification
- **helmet** - Security headers middleware
- **cors** - Cross-origin resource sharing
- **express-rate-limit** - Rate limiting to prevent abuse
- **express-validator** - Input validation

### File Handling
- **multer** - Multipart form data handling for file uploads

### Utilities
- **dotenv** - Environment variable management
- **morgan** - HTTP request logging
- **sequelize-cli** - Database migration tools

## Design Patterns

### 1. MVC (Model-View-Controller) Pattern

While this is an API (no views), we follow the MVC principles:

```
Models (Database Layer)
    ↓
Controllers (Business Logic)
    ↓
Routes (API Endpoints)
    ↓
Client (API Consumer)
```

**Benefits:**
- Clear separation of concerns
- Easy to test and maintain
- Scalable structure

### 2. Middleware Pattern

```javascript
// Middleware chain for protected routes
authMiddleware → roleMiddleware → controllerAction
```

Each middleware adds functionality:
- **authMiddleware**: Verifies JWT token
- **roleMiddleware**: Checks user permissions
- **uploadMiddleware**: Handles file validation and storage

### 3. Repository Pattern (Implicit)

Sequelize models act as repositories:

```javascript
// Model operations encapsulate database access
const user = await User.findByPk(id);
const posts = await Post.findAll({ where: { ... } });
```

### 4. Service Layer (Controllers as Services)

Controllers contain business logic:

```javascript
// authController.js - Handles authentication logic
exports.register = async (req, res) => {
  // Validation
  // Check existing user
  // Hash password
  // Create user
  // Generate tokens
  // Return response
}
```

### 5. Decorator Pattern (Middleware)

Decorators add functionality to routes:

```javascript
router.post(
  '/posts',
  authMiddleware,           // Authentication
  upload.single('image'),   // File handling
  [validationRules],        // Validation
  postController.createPost // Handler
);
```

## Database Design

### Entity Relationship Diagram

```
┌─────────────┐           ┌─────────────┐
│   Users     │──────────▶│   Posts     │
├─────────────┤           ├─────────────┤
│ id (PK)     │           │ id (PK)     │
│ name        │           │ title       │
│ email       │           │ slug        │
│ password    │           │ content     │
│ role        │           │ image       │
└─────────────┘           │ authorId(FK)│
      ▲                    │ categoryId(FK)
      │                    │ status      │
      │                    │ views       │
      │                    └─────┬───────┘
      │                          │
      │                    ┌─────▼────────┐
      │                    │  Categories  │
      │                    ├──────────────┤
      │                    │ id (PK)      │
      │                    │ name         │
      │                    │ slug         │
      │                    └──────────────┘
      │
      │                    ┌──────────────┐
      └──────────────────▶│  Comments    │
                          ├──────────────┤
                          │ id (PK)      │
                          │ postId (FK)  │
                          │ userId (FK)  │
                          │ comment      │
                          │ status       │
                          └──────────────┘

┌──────────────┐           ┌──────────────────┐
│    Likes     │───────────▶│  Advertisements  │
├──────────────┤           ├──────────────────┤
│ id (PK)      │           │ id (PK)          │
│ postId (FK)  │           │ title            │
│ visitorId    │           │ image            │
│ unique index │           │ link             │
└──────────────┘           │ status           │
                           └──────────────────┘
```

### Key Design Decisions

#### 1. Visitor ID for Likes
- **Why**: Allow anonymous users to like posts
- **How**: Generate UUID on client side, store in localStorage
- **Unique Constraint**: (postId, visitorId) pair prevents duplicate likes

#### 2. Post Status Workflow
```
draft → pending (if editor) → published (by admin) ✓
          ↓
        rejected (by admin)
```

- **draft**: Initial state for all posts
- **pending**: Editor posts awaiting approval
- **published**: Approved, visible to public
- **rejected**: Admin rejected, not shown

#### 3. Comment Moderation
- **pending**: Default state for new comments
- **approved**: Visible to public
- **rejected**: Hidden, not shown to users

#### 4. Role-Based Permissions

```
Admin:
  • View all data
  • Create/edit/delete posts
  • Approve/reject content
  • Manage users and editors
  • Moderate comments

Editor:
  • Create posts (pending status)
  • Edit own posts
  • Upload images
  • Cannot approve own posts

User:
  • View public posts
  • Comment (pending approval)
  • Like posts
  • View own profile
  • Delete own comments
```

## API Design

### RESTful Conventions

```
GET    /api/posts              → List all posts
GET    /api/posts/:id          → Get single post
POST   /api/posts              → Create post
PUT    /api/posts/:id          → Update post
DELETE /api/posts/:id          → Delete post
```

### Response Format (Standardized)

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* Response data */ }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error message",
  "error": "Error details"
}
```

**Benefits:**
- Consistent across all endpoints
- Easy for client to parse
- Consistent error handling
- Predictable structure

### Pagination

```javascript
GET /api/posts?page=1&limit=10

Response:
{
  "data": {
    "posts": [...],
    "pagination": {
      "total": 100,
      "page": 1,
      "pages": 10
    }
  }
}
```

### Query Parameters

```javascript
// Filtering
GET /api/posts?status=published

// Searching
GET /api/posts/search?q=keyword

// Sorting (implicit - newest first)
GET /api/posts?page=1&limit=10
```

## Security Architecture

### 1. Authentication Flow

```
User Input
    ↓
Validation (express-validator)
    ↓
Password Hashing (bcryptjs)
    ↓
JWT Token Generation
    ↓
Token in Response
    ↓
Client Stores Token (localStorage)
    ↓
Client Sends Token in Authorization Header
    ↓
authMiddleware Verifies Token
    ↓
Request Processed
```

### 2. Token Management

```javascript
// Access Token (Short-lived: 15 minutes)
{
  id, email, role
  expiresIn: '15m'
}

// Refresh Token (Long-lived: 7 days)
{
  id
  expiresIn: '7d'
}
```

### 3. Password Security

```
User Password
    ↓
bcryptjs.genSalt(10) → Random salt
    ↓
bcryptjs.hash(password, salt) → Hashed password
    ↓
Store in database (never plain text)
    ↓
On login: bcryptjs.compare(inputPassword, hashedPassword)
    ↓
Match? → Generate tokens
```

### 4. Authorization Flow

```
Request with Token
    ↓
authMiddleware verifies token
    ↓
req.user populated
    ↓
roleMiddleware checks req.user.role
    ↓
Role matches? → Proceed
Role doesn't match? → 403 Forbidden
```

### 5. Input Validation

Using **express-validator**:

```javascript
router.post('/posts', [
  body('title').trim().notEmpty(),
  body('content').notEmpty(),
  body('categoryId').optional().isInt()
], controller.createPost);
```

**Benefits:**
- Prevents injection attacks
- Type checking
- Sanitization
- Custom validation rules

### 6. Security Headers (Helmet)

```javascript
app.use(helmet()); // Sets security headers:
// - X-Content-Type-Options: nosniff
// - X-Frame-Options: DENY
// - X-XSS-Protection: 1; mode=block
// - Strict-Transport-Security
```

### 7. CORS Configuration

```javascript
const corsOptions = {
  origin: ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}
app.use(cors(corsOptions));
```

### 8. Rate Limiting

```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // 100 requests
  message: 'Too many requests'
});
app.use('/api/', limiter);
```

## Error Handling

### Error Handling Strategy

```
Error Occurs
    ↓
Try-Catch Block Catches Error
    ↓
Log Error (console.error)
    ↓
Format Error Response
    ↓
Return HTTP Status Code + Error JSON
    ↓
Global Error Handler (if uncaught)
```

### HTTP Status Codes

```
200 OK              → Request successful
201 Created         → Resource created
400 Bad Request     → Validation error
401 Unauthorized    → Missing/invalid token
403 Forbidden       → Insufficient permissions
404 Not Found       → Resource doesn't exist
500 Server Error    → Unexpected error
```

### Error Types

```javascript
// Validation Error
{
  "success": false,
  "message": "Validation error",
  "error": [
    { "field": "email", "message": "Invalid email" }
  ]
}

// Authentication Error
{
  "success": false,
  "message": "Invalid credentials",
  "error": "Email or password is incorrect"
}

// Authorization Error
{
  "success": false,
  "message": "Access denied",
  "error": "This action requires admin role"
}

// Database Error
{
  "success": false,
  "message": "Database error",
  "error": "Error details (development only)"
}
```

## Scalability Considerations

### 1. Database Optimization

```javascript
// Connection pooling
pool: {
  max: 10,
  min: 0,
  acquire: 30000,
  idle: 10000
}

// Indexes for frequent queries
CREATE INDEX idx_post_slug ON posts(slug);
CREATE INDEX idx_post_status ON posts(status);
CREATE INDEX idx_like_composite ON likes(postId, visitorId);
```

### 2. Caching Strategy

Future enhancements:
- **Query Result Caching**: Cache frequently accessed posts
- **Session Caching**: Redis for token blacklisting
- **HTTP Caching**: ETag and conditional requests

```javascript
// Example: Cache posts
const redis = require('redis');
const client = redis.createClient();

// Get from cache first
const cached = await client.get('posts:1');
if (cached) return JSON.parse(cached);

// If not cached, query database and cache
const post = await Post.findByPk(1);
await client.setex('posts:1', 3600, JSON.stringify(post));
```

### 3. Load Balancing

```bash
# Using PM2 cluster mode
pm2 start server.js -i max

# Using Nginx upstream
upstream node_app {
  server localhost:5001;
  server localhost:5002;
  server localhost:5003;
}
```

### 4. Database Replication

For production:
- Master-Slave replication for read scaling
- Connection pooling across replicas
- Automatic failover

### 5. Content Delivery

```javascript
// Compress responses
const compression = require('compression');
app.use(compression());

// Serve static images from CDN
// Example: uploads → AWS S3 → CloudFront
```

### 6. Monitoring & Logging

```javascript
// Request logging
app.use(morgan('combined'));

// Error tracking
// Example: Sentry, New Relic, DataDog
```

## Code Organization

### Folder Structure Rationale

```
src/
├── config/           # Configuration files (database)
├── controllers/      # Business logic (one per entity)
├── models/          # Data models (Sequelize)
├── routes/          # API endpoints (one per entity)
├── middleware/      # Custom middleware
├── utils/           # Utility functions (jwt, slugs)
├── seeders/         # Database seed scripts
└── server.js        # Application entry point
```

### Module Responsibilities

| Module | Responsibility |
|--------|-----------------|
| Controller | Business logic, validation coordination |
| Model | Data structure, database operations |
| Route | Endpoint definition, middleware ordering |
| Middleware | Cross-cutting concerns (auth, validation) |
| Utils | Reusable functions (JWT, slugs) |

### Naming Conventions

```javascript
// Controllers: entityController.js
postController.js
categoryController.js

// Models: Entity.js
Post.js
User.js

// Routes: entityRoutes.js
postRoutes.js
userRoutes.js

// Functions: camelCase
generateSlug()
verifyAccessToken()

// Variables: camelCase
userId, postTitle

// Constants: UPPER_SNAKE_CASE
MAX_FILE_SIZE, JWT_ACCESS_EXPIRY
```

## Testing Strategy

### Manual Testing
- Use Postman or REST Client for API testing
- Test all endpoints with different roles
- Verify error responses
- Load testing with artillery or k6

### Future Enhancements
```bash
# Unit Testing
npm install --save-dev jest
npm test

# Integration Testing
npm install --save-dev supertest

# End-to-End Testing
npm install --save-dev cypress
```

## Performance Metrics

### Key Metrics to Monitor

```
Response Time: < 200ms for 95th percentile
Throughput: > 1000 requests/second
Database Queries: < 50ms per query
Error Rate: < 0.1%
Uptime: > 99.9%
```

## Future Improvements

1. **Caching Layer**: Redis for frequently accessed data
2. **Full-Text Search**: Elasticsearch for better search
3. **Real-time Notifications**: WebSocket for live updates
4. **Versioning**: API versioning (v1, v2, etc.)
5. **GraphQL**: Add GraphQL endpoint alongside REST
6. **Async Jobs**: Message queue for heavy operations
7. **Microservices**: Extract services as they grow
8. **Testing**: Comprehensive unit and integration tests
