# CMS Admin Panel Backend - Implementation Guide

## Architecture Overview

```
blog.backend/
├── src/
│   ├── config/
│   │   ├── database.js          # Sequelize database connection
│   │   └── googleDrive.js       # Google Drive API integration
│   │
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   ├── userController.js    # Editor management
│   │   ├── postController.js    # Post CRUD operations
│   │   ├── advertisementController.js # Advertisement management
│   │   └── uploadController.js  # File upload handling
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js    # JWT verification
│   │   ├── roleMiddleware.js    # Role-based authorization
│   │   └── uploadMiddleware.js  # Multer configuration
│   │
│   ├── models/
│   │   ├── User.js              # User model with bcrypt hashing
│   │   ├── Post.js              # Post model with author relationship
│   │   ├── Advertisement.js     # Advertisement model
│   │   └── ...other models
│   │
│   ├── routes/
│   │   ├── authRoutes.js        # Auth endpoints
│   │   ├── userRoutes.js        # User/Editor management
│   │   ├── postRoutes.js        # Post management
│   │   ├── advertisementRoutes.js # Advertisement management
│   │   └── uploadRoutes.js      # Upload endpoints
│   │
│   ├── utils/
│   │   ├── password.js          # Password hashing utilities
│   │   └── ...other utilities
│   │
│   └── server.js                # Express app setup
│
└── .env.example                  # Environment template
```

---

## Key Concepts

### 1. Role-Based Access Control (RBAC)

The system implements two roles:

**Admin Role**
- Can create, read, update, delete editors
- Can manage all posts (own or others')
- Can create, read, update, delete advertisements
- Can change post status
- Full system access

**Editor Role**
- Can create and publish posts
- Can only manage their own posts
- Cannot manage other editors
- Cannot manage advertisements
- Limited to content creation

### 2. Authentication Flow

```
User submits credentials
         ↓
Backend validates email & password
         ↓
Compares hashed password with bcrypt
         ↓
Generates JWT token (valid for 7 days)
         ↓
Returns token to frontend
         ↓
Frontend stores token in localStorage/sessionStorage
         ↓
Frontend sends token with Authorization header
         ↓
Backend verifies token on each request
```

### 3. Authorization Flow

```
Request arrives with JWT token
         ↓
authMiddleware verifies token
         ↓
Attaches user data to req.user
         ↓
roleMiddleware checks user's role
         ↓
Allows or denies access
         ↓
Controller handles the request
```

### 4. Password Security

```javascript
// When user registers:
1. Password validation (min 6 chars)
2. Hash with bcrypt (10 rounds salt)
3. Store hashed password in DB
4. Never log or return password

// When user logs in:
1. Get password from request
2. Get hashed password from DB
3. Compare using bcrypt.compare()
4. Return JWT if match
```

---

## Database Schema Relationships

```
Users (1) ──── (Many) Posts
  ├── id (PK)
  ├── name
  ├── email (UNIQUE)
  ├── password (HASHED)
  ├── phone (10 digits)
  ├── role (ENUM: admin, editor)
  └── ...

Posts (Many) ──── (1) Users
  ├── id (PK)
  ├── title
  ├── content
  ├── imageUrl (Google Drive URL)
  ├── authorId (FK → Users.id)
  ├── status (ENUM: draft, published, archived)
  └── viewCount

Advertisements
  ├── id (PK)
  ├── title
  ├── image (Google Drive URL)
  ├── link
  ├── status (ENUM: active, inactive)
  └── ...
```

---

## Google Drive Integration

### Upload Process

```
1. User uploads file via multipart/form-data
2. Multer stores file in memory (buffer)
3. uploadToGoogleDrive() is called with buffer
4. Google Drive API uploads file to specified folder
5. File is made publicly accessible
6. Direct view URL is returned
7. URL stored in database
```

### Configuration

```javascript
// In .env:
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_REFRESH_TOKEN=xxx
GOOGLE_FOLDER_ID=xxx

// In googleDrive.js:
const auth = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URL
);

auth.setCredentials({
  refresh_token: GOOGLE_REFRESH_TOKEN
});

const drive = google.drive({ version: 'v3', auth });
```

### Direct View URL

```javascript
// Instead of webViewLink (requires login):
// ❌ https://drive.google.com/file/d/{fileId}/view

// Use direct view URL (publicly accessible):
// ✅ https://drive.google.com/uc?export=view&id={fileId}
```

---

## Adding New Features

### Example: Add a new role "Moderator"

1. **Update User Model**
   ```javascript
   // models/User.js
   role: {
     type: DataTypes.ENUM('admin', 'editor', 'moderator'),
     defaultValue: 'editor'
   }
   ```

2. **Create Moderator Routes**
   ```javascript
   // routes/moderatorRoutes.js
   router.get(
     '/posts/pending',
     authMiddleware,
     roleMiddleware(['moderator']),
     postController.getPendingPosts
   );
   ```

3. **Add in server.js**
   ```javascript
   const moderatorRoutes = require('./routes/moderatorRoutes');
   app.use('/api/moderator', moderatorRoutes);
   ```

### Example: Add email notifications

1. **Install nodemailer**
   ```bash
   npm install nodemailer
   ```

2. **Create mail config**
   ```javascript
   // config/mail.js
   const transporter = nodemailer.createTransport({...});
   
   exports.sendEmail = async (to, subject, html) => {
     return transporter.sendMail({ from, to, subject, html });
   };
   ```

3. **Use in controller**
   ```javascript
   // After creating editor
   await sendEmail(
     editor.email,
     'Welcome to CMS',
     `Your account has been created with role: ${editor.role}`
   );
   ```

---

## Error Handling Pattern

```javascript
try {
  // Validate input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array()
    });
  }

  // Business logic
  const data = await Model.findByPk(id);
  if (!data) {
    return res.status(404).json({
      success: false,
      message: 'Not found',
      error: 'Resource not found'
    });
  }

  // Success response
  return res.status(200).json({
    success: true,
    message: 'Success',
    data
  });
} catch (error) {
  console.error('Error:', error);
  return res.status(500).json({
    success: false,
    message: 'Operation failed',
    error: error.message
  });
}
```

---

## Validation Pattern

```javascript
// Using express-validator
router.post(
  '/editors',
  authMiddleware,
  roleMiddleware(['admin']),
  [
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required')
      .isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email')
      .isEmail().withMessage('Valid email is required')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phone')
      .optional()
      .matches(/^\d{10}$/).withMessage('Phone must be exactly 10 digits')
  ],
  userController.createEditor
);
```

---

## Authentication Pattern

```javascript
// Frontend: Store JWT
localStorage.setItem('authToken', token);

// Frontend: Send with every request
const headers = {
  'Authorization': `Bearer ${localStorage.getItem('authToken')}`
};

// Backend: Verify middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = decoded; // { id, email, role }
  next();
};

// Backend: Use user info in controllers
const authorId = req.user.id;
const userRole = req.user.role;
```

---

## Testing API Endpoints

### Using cURL

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@test.com","password":"pass123","phone":"9876543210"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@test.com","password":"pass123"}'

# Get profile (with token)
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer <token>"
```

### Using Postman

1. Create collection "CMS Backend"
2. Set base URL: `http://localhost:5000`
3. Create requests for each endpoint
4. Use Variables for token storage
5. Set Authorization header with Bearer token

---

## Performance Optimization

### 1. Database Indexing
```sql
-- Add indexes for common queries
ALTER TABLE users ADD INDEX idx_email (email);
ALTER TABLE users ADD INDEX idx_role (role);
ALTER TABLE posts ADD INDEX idx_authorId (authorId);
ALTER TABLE posts ADD INDEX idx_status (status);
ALTER TABLE advertisements ADD INDEX idx_status (status);
```

### 2. Query Optimization
```javascript
// ❌ Bad: N+1 query problem
const posts = await Post.findAll();
for (let post of posts) {
  post.author = await User.findByPk(post.authorId);
}

// ✅ Good: Use include
const posts = await Post.findAll({
  include: [{ model: User, as: 'author' }]
});
```

### 3. Pagination
```javascript
// Always paginate large result sets
const limit = parseInt(req.query.limit) || 10;
const page = parseInt(req.query.page) || 1;
const offset = (page - 1) * limit;

const { count, rows } = await Model.findAndCountAll({
  limit,
  offset,
  order: [['createdAt', 'DESC']]
});
```

### 4. Caching
```javascript
// For frequently accessed data
const redis = require('redis');
const cache = redis.createClient();

// Get from cache or database
const getCachedData = async (key) => {
  const cached = await cache.get(key);
  if (cached) return JSON.parse(cached);
  
  const data = await fetchFromDb();
  await cache.setex(key, 3600, JSON.stringify(data)); // 1 hour TTL
  return data;
};
```

---

## Security Best Practices

1. **Environment Variables**
   - Never commit `.env` file
   - Use `.env.example` as template
   - Rotate secrets regularly

2. **Password Hashing**
   - Always hash passwords
   - Use bcrypt with salt rounds ≥ 10
   - Never log or return passwords

3. **JWT Tokens**
   - Use strong secret
   - Set expiration time
   - Validate on every request
   - Rotate secret periodically

4. **CORS Configuration**
   - Specify allowed origins
   - Don't use wildcard (*) in production
   - Set credentials: true only when needed

5. **Rate Limiting**
   - Protect auth endpoints more strictly
   - Implement exponential backoff
   - Monitor suspicious activity

6. **Input Validation**
   - Validate all inputs
   - Sanitize for SQL injection
   - Use parameterized queries (Sequelize does this)

---

## Monitoring & Logging

```javascript
// Using Winston or Pino
const logger = require('./config/logger');

app.use((req, res, next) => {
  logger.info({
    method: req.method,
    path: req.path,
    user: req.user?.id,
    timestamp: new Date()
  });
  next();
});

// Log errors
try {
  // operation
} catch (error) {
  logger.error({
    message: error.message,
    stack: error.stack,
    user: req.user?.id,
    path: req.path
  });
}
```

---

## Deployment Considerations

1. **Server Setup**
   - Use production-grade MySQL
   - Enable SSL/HTTPS
   - Configure firewall
   - Set up backup strategy

2. **Environment Configuration**
   - Use environment-specific configs
   - Rotate secrets
   - Monitor error logs
   - Set up alerts

3. **Database**
   - Create indexes on foreign keys
   - Enable query logging
   - Set up automated backups
   - Test recovery procedures

4. **Monitoring**
   - CPU and memory usage
   - Database query performance
   - API response times
   - Error rates and logs

---

## Resources

- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [Sequelize Best Practices](https://sequelize.org/docs/v6/advanced-association-concepts/eager-loading/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Security Guidelines](https://owasp.org/)
- [Node.js Security Checklist](https://nodejs.org/en/docs/guides/security/)

