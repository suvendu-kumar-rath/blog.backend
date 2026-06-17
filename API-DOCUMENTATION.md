# CMS Admin Panel Backend - API Documentation

## Overview
Production-ready backend API for a CMS Admin Panel with role-based authentication, post management, and advertisement management. Built with Node.js, Express.js, MySQL, Sequelize ORM, JWT authentication, and Google Drive integration.

## Features

✅ **Authentication & Authorization**
- Role-based access control (Admin/Editor)
- JWT token-based authentication
- bcrypt password hashing
- User profile management

✅ **User Management**
- Admin can create, read, update, and delete editors
- Phone number validation (10 digits)
- User activity tracking (last login)

✅ **Post Management**
- Admin and Editor can create posts
- Admin can manage all posts
- Editors can only manage their own posts
- Multiple post statuses (draft, published, archived)
- View count tracking

✅ **Advertisement Management**
- Admin only can manage advertisements
- Google Drive image upload integration
- Direct image URLs for fast loading
- Status management (active/inactive)

✅ **Security Features**
- Helmet.js for security headers
- CORS configuration
- Rate limiting
- Input validation and sanitization
- Error handling middleware
- Secure password hashing

---

## Installation & Setup

### Prerequisites
- Node.js v14+
- MySQL 5.7+
- npm or yarn

### Steps

1. **Clone and Install**
   ```bash
   cd blog.backend
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Database Setup**
   ```bash
   # Create database in MySQL
   CREATE DATABASE cms_admin_db;
   
   # Tables will be created automatically on first run
   ```

4. **Google Drive Setup** (Optional, for image uploads)
   ```
   1. Go to https://console.cloud.google.com
   2. Create a new project
   3. Enable Google Drive API
   4. Create OAuth 2.0 credentials
   5. Add credentials to .env file
   ```

5. **Start Server**
   ```bash
   npm run dev          # Development with nodemon
   npm start            # Production
   ```

---

## API Endpoints

### Authentication (`/api/auth`)

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "9876543210",
  "role": "editor"  # "admin" or "editor"
}

Response (201):
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "role": "editor"
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

Response (200):
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "role": "editor"
  }
}
```

#### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "message": "User profile fetched successfully",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "role": "editor",
    "isActive": true,
    "lastLogin": "2024-01-15T10:30:00Z",
    "createdAt": "2024-01-10T15:20:00Z"
  }
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### User/Editor Management (`/api/users`)

#### Get All Users (Admin only)
```http
GET /api/users?page=1&limit=10&role=editor
Authorization: Bearer <admin-token>

Response (200):
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": {
    "users": [...],
    "pagination": {
      "total": 50,
      "page": 1,
      "pages": 5
    }
  }
}
```

#### Get All Editors (Admin only)
```http
GET /api/editors?page=1&limit=10&search=john
Authorization: Bearer <admin-token>

Response (200):
{
  "success": true,
  "message": "Editors fetched successfully",
  "data": {
    "editors": [...],
    "total": 10,
    "page": 1,
    "pages": 1
  }
}
```

#### Get Single Editor (Admin only)
```http
GET /api/editors/:id
Authorization: Bearer <admin-token>

Response (200):
{
  "success": true,
  "message": "Editor fetched successfully",
  "editor": {
    "id": 2,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "9876543211",
    "role": "editor",
    "isActive": true
  }
}
```

#### Create Editor (Admin only)
```http
POST /api/editors
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123",
  "phone": "9876543211"
}

Response (201):
{
  "success": true,
  "message": "Editor created successfully",
  "editor": {
    "id": 2,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "9876543211",
    "role": "editor",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

#### Update Editor (Admin only)
```http
PUT /api/editors/:id
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Jane Smith",
  "phone": "9876543212",
  "isActive": true
}

Response (200):
{
  "success": true,
  "message": "Editor updated successfully",
  "editor": {...}
}
```

#### Delete Editor (Admin only)
```http
DELETE /api/editors/:id
Authorization: Bearer <admin-token>

Response (200):
{
  "success": true,
  "message": "Editor deleted successfully"
}
```

---

### Post Management (`/api/posts`)

#### Get All Posts
```http
GET /api/posts?page=1&limit=10&status=published

Response (200):
{
  "success": true,
  "message": "Posts retrieved successfully",
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

#### Create Post (Authenticated users)
```http
POST /api/posts
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "title": "My First Post",
  "content": "This is the content of my post...",
  "image": <file>,
  "status": "draft"
}

Response (201):
{
  "success": true,
  "message": "Post created successfully",
  "data": {
    "id": 1,
    "title": "My First Post",
    "content": "This is the content of my post...",
    "imageUrl": "https://drive.google.com/uc?export=view&id=xxx",
    "authorId": 1,
    "status": "draft",
    "viewCount": 0,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

#### Get Single Post
```http
GET /api/posts/:id
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": {...}
}
```

#### Update Post
```http
PUT /api/posts/:id
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "title": "Updated Title",
  "content": "Updated content...",
  "image": <file>,
  "status": "published"
}

Response (200):
{
  "success": true,
  "message": "Post updated successfully",
  "data": {...}
}
```

#### Delete Post
```http
DELETE /api/posts/:id
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "message": "Post deleted successfully"
}
```

---

### Advertisement Management (`/api/advertisements`) - Admin only

#### Get All Advertisements
```http
GET /api/advertisements?page=1&limit=10&status=active
Authorization: Bearer <admin-token>

Response (200):
{
  "success": true,
  "message": "Advertisements fetched successfully",
  "data": {
    "advertisements": [...],
    "total": 20,
    "page": 1,
    "pages": 2
  }
}
```

#### Create Advertisement
```http
POST /api/advertisements
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data

{
  "title": "Product Ad",
  "image": <file>,
  "link": "https://example.com/product",
  "status": "active"
}

Response (201):
{
  "success": true,
  "message": "Advertisement created successfully",
  "advertisement": {
    "id": 1,
    "title": "Product Ad",
    "image": "https://drive.google.com/uc?export=view&id=xxx",
    "link": "https://example.com/product",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

#### Get Single Advertisement
```http
GET /api/advertisements/:id
Authorization: Bearer <admin-token>

Response (200):
{
  "success": true,
  "message": "Advertisement fetched successfully",
  "advertisement": {...}
}
```

#### Update Advertisement
```http
PUT /api/advertisements/:id
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data

{
  "title": "Updated Ad",
  "image": <file>,
  "status": "inactive"
}

Response (200):
{
  "success": true,
  "message": "Advertisement updated successfully",
  "advertisement": {...}
}
```

#### Delete Advertisement
```http
DELETE /api/advertisements/:id
Authorization: Bearer <admin-token>

Response (200):
{
  "success": true,
  "message": "Advertisement deleted successfully"
}
```

---

### Image Upload (`/api/upload`)

#### Upload Image
```http
POST /api/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "image": <file>
}

Response (200):
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "imageUrl": "https://drive.google.com/uc?export=view&id=xxx",
    "fileId": "xxx",
    "webViewLink": "https://drive.google.com/file/d/xxx/view"
  }
}
```

---

### Health Check

```http
GET /api/health

Response (200):
{
  "success": true,
  "message": "Server is running",
  "data": {
    "timestamp": "2024-01-15T10:30:00Z",
    "uptime": 3600,
    "environment": "development"
  }
}
```

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role ENUM('admin', 'editor') DEFAULT 'editor',
  isActive BOOLEAN DEFAULT true,
  lastLogin DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Posts Table
```sql
CREATE TABLE posts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  content LONGTEXT NOT NULL,
  imageUrl VARCHAR(500),
  authorId INT NOT NULL,
  status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
  viewCount INT DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (authorId) REFERENCES users(id) ON DELETE CASCADE
);
```

### Advertisements Table
```sql
CREATE TABLE advertisements (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  image VARCHAR(500) NOT NULL,
  link VARCHAR(500),
  status ENUM('active', 'inactive') DEFAULT 'active',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information"
}
```

### Common HTTP Status Codes
- `200` - OK
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `413` - Payload Too Large (file size exceeded)
- `500` - Internal Server Error

---

## Security Considerations

1. **JWT Secret**: Change `JWT_SECRET` in production
2. **Password**: Passwords are hashed using bcrypt (10 rounds)
3. **CORS**: Configure `CORS_ORIGIN` for your frontend domains
4. **Rate Limiting**: Enabled by default (100 requests per 15 minutes)
5. **File Uploads**: Limited to 5MB, only images allowed
6. **Phone Validation**: Must be exactly 10 digits

---

## Environment Variables

See `.env.example` for complete list. Key variables:

- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` - MySQL connection
- `JWT_SECRET` - JWT signing secret
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` - Google Drive API credentials

---

## Development

```bash
# Install dependencies
npm install

# Run development server with nodemon
npm run dev

# Run production server
npm start

# Run database seeders
npm run seed
```

---

## Deployment Checklist

- [ ] Update `.env` with production values
- [ ] Change `JWT_SECRET` to a strong random string
- [ ] Set `NODE_ENV=production`
- [ ] Configure `CORS_ORIGIN` with production domains
- [ ] Set up MySQL on production server
- [ ] Configure Google Drive API credentials
- [ ] Enable SSL/HTTPS
- [ ] Set up proper logging and monitoring
- [ ] Run database migrations
- [ ] Test all API endpoints

---

## Support & Documentation

For more information, check:
- [Express.js Documentation](https://expressjs.com/)
- [Sequelize ORM](https://sequelize.org/)
- [JWT Authentication](https://jwt.io/)
- [Google Drive API](https://developers.google.com/drive/api/)

---

## License

ISC
