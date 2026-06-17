# Blog Backend API

A production-ready backend for a blogging website built with Node.js, Express.js, MySQL, and Sequelize ORM.

## Features

- **User Authentication**: JWT-based authentication with access and refresh tokens
- **Role-Based Access Control**: Admin, Editor, and User roles with specific permissions
- **Post Management**: Create, update, delete, and publish posts with status workflow
- **Comments System**: Users can comment on posts with admin moderation
- **Like System**: Anonymous likes without registration (visitor-based)
- **Categories**: Organize posts into categories
- **Image Upload**: Upload images using multer
- **View Counter**: Track post views
- **Security**: Helmet, CORS, rate limiting, password hashing with bcrypt
- **Validation**: Input validation using express-validator
- **Logging**: Morgan logging for HTTP requests
- **Database**: MySQL with Sequelize ORM

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL
- **ORM**: Sequelize
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **File Upload**: multer
- **Security**: helmet, cors, express-rate-limit
- **Validation**: express-validator
- **Logging**: morgan
- **Environment**: dotenv

## Project Structure

```
blog.backend/
├── src/
│   ├── config/
│   │   └── database.js          # Database configuration
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   ├── postController.js    # Post management logic
│   │   ├── commentController.js # Comment management logic
│   │   ├── likeController.js    # Like management logic
│   │   ├── categoryController.js# Category management logic
│   │   └── userController.js    # User management logic
│   ├── models/
│   │   ├── User.js              # User model
│   │   ├── Post.js              # Post model
│   │   ├── Comment.js           # Comment model
│   │   ├── Like.js              # Like model
│   │   ├── Category.js          # Category model
│   │   └── Advertisement.js     # Advertisement model
│   ├── routes/
│   │   ├── authRoutes.js        # Auth endpoints
│   │   ├── postRoutes.js        # Post endpoints
│   │   ├── commentRoutes.js     # Comment endpoints
│   │   ├── likeRoutes.js        # Like endpoints
│   │   ├── categoryRoutes.js    # Category endpoints
│   │   └── userRoutes.js        # User endpoints
│   ├── middleware/
│   │   ├── authMiddleware.js    # JWT verification
│   │   ├── roleMiddleware.js    # Role-based access control
│   │   └── uploadMiddleware.js  # File upload configuration
│   ├── utils/
│   │   ├── jwt.js               # JWT utilities
│   │   └── slugGenerator.js     # Slug generation utilities
│   ├── seeders/
│   │   └── adminSeeder.js       # Admin user seeder script
│   └── server.js                # Main server file
├── uploads/                     # Image uploads directory
├── .env                         # Environment variables
├── .env.example                 # Example environment variables
├── package.json                 # Dependencies and scripts
└── README.md                    # This file
```

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd blog.backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   # Copy example file
   cp .env.example .env
   
   # Edit .env with your configuration
   # Database credentials, JWT secrets, etc.
   ```

4. **Create MySQL Database**
   ```sql
   CREATE DATABASE blog_db;
   ```

5. **Seed admin user**
   ```bash
   npm run seed
   ```
   
   Default admin credentials:
   - Email: `admin@example.com`
   - Password: `Admin@123`
   
   ⚠️ **Important**: Change the admin password after first login

## Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:5000` by default.

## API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "Admin@123"
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <accessToken>
```

### Post Endpoints

#### Get All Posts (Public)
```http
GET /api/posts?page=1&limit=10&status=published
```

#### Get Single Post (Public)
```http
GET /api/posts/:slug
```

#### Search Posts (Public)
```http
GET /api/posts/search?q=keyword&page=1&limit=10
```

#### Get Posts by Category (Public)
```http
GET /api/posts/category/:slug
```

#### Create Post (Authenticated)
```http
POST /api/posts
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data

{
  "title": "Post Title",
  "content": "Post content here...",
  "categoryId": 1,
  "image": <file>
}
```

#### Update Post (Authenticated)
```http
PUT /api/posts/:id
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data

{
  "title": "Updated Title",
  "content": "Updated content...",
  "categoryId": 1,
  "image": <file>,
  "status": "published"
}
```

#### Delete Post (Authenticated)
```http
DELETE /api/posts/:id
Authorization: Bearer <accessToken>
```

### Comment Endpoints

#### Get Comments on Post (Public)
```http
GET /api/posts/:postId/comments?page=1&limit=10
```

#### Create Comment (Authenticated)
```http
POST /api/posts/:postId/comments
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "comment": "Great post!"
}
```

#### Delete Own Comment (Authenticated)
```http
DELETE /api/posts/comments/:commentId
Authorization: Bearer <accessToken>
```

#### Approve Comment (Admin Only)
```http
PUT /api/posts/comments/:commentId/approve
Authorization: Bearer <adminToken>
```

#### Reject Comment (Admin Only)
```http
PUT /api/posts/comments/:commentId/reject
Authorization: Bearer <adminToken>
```

### Like Endpoints

#### Like a Post (Public)
```http
POST /api/posts/:postId/like
Content-Type: application/json

{
  "visitorId": "unique-visitor-id"
}
```

#### Unlike a Post (Public)
```http
POST /api/posts/:postId/unlike
Content-Type: application/json

{
  "visitorId": "unique-visitor-id"
}
```

#### Get Likes Count (Public)
```http
GET /api/posts/:postId/likes-count
```

#### Check Like Status (Public)
```http
GET /api/posts/:postId/check-like?visitorId=unique-visitor-id
```

### Category Endpoints

#### Get All Categories (Public)
```http
GET /api/categories
```

#### Create Category (Admin Only)
```http
POST /api/categories
Authorization: Bearer <adminToken>
Content-Type: application/json

{
  "name": "Technology"
}
```

#### Update Category (Admin Only)
```http
PUT /api/categories/:id
Authorization: Bearer <adminToken>
Content-Type: application/json

{
  "name": "Tech & Science"
}
```

#### Delete Category (Admin Only)
```http
DELETE /api/categories/:id
Authorization: Bearer <adminToken>
```

### User Endpoints

#### Get User Profile (Authenticated)
```http
GET /api/users/profile
Authorization: Bearer <accessToken>
```

#### Get All Users (Admin Only)
```http
GET /api/users?page=1&limit=10&role=user
Authorization: Bearer <adminToken>
```

#### Create Editor (Admin Only)
```http
POST /api/users/editors
Authorization: Bearer <adminToken>
Content-Type: application/json

{
  "name": "Editor Name",
  "email": "editor@example.com",
  "password": "password123"
}
```

#### Update User Role (Admin Only)
```http
PUT /api/users/:userId/role
Authorization: Bearer <adminToken>
Content-Type: application/json

{
  "role": "editor"
}
```

#### Delete User (Admin Only)
```http
DELETE /api/users/:userId
Authorization: Bearer <adminToken>
```

### Health Check
```http
GET /api/health
```

## User Roles & Permissions

### Admin
- Login
- Create, update, delete any post
- Approve/reject editor posts
- Create and manage editors
- Manage users
- Delete/moderate comments
- Manage categories
- Manage advertisements

### Editor
- Login
- Create posts (status: pending)
- Edit own posts
- Upload images
- Cannot manage users/editors

### User
- Register/login
- View profile
- Comment on posts
- Delete own comments
- Like posts (via visitor ID)

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data here
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": "Error details"
}
```

## Environment Variables

See `.env.example` for all available variables:

```
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=blog_db
DB_PORT=3306

# JWT
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Upload
UPLOAD_DIR=uploads/images
MAX_FILE_SIZE=5242880

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Tokens**: Secure token-based authentication
- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing configuration
- **Rate Limiting**: Prevent brute force attacks
- **Input Validation**: express-validator for all inputs
- **SQL Injection Prevention**: Sequelize parameterized queries

## Error Handling

The API includes comprehensive error handling for:
- Validation errors
- Authentication errors
- Authorization errors
- Not found errors
- File upload errors
- Database errors
- Server errors

## Database Models

### User
- id (PK)
- name
- email (unique)
- password (hashed)
- role (admin, editor, user)
- createdAt, updatedAt

### Post
- id (PK)
- title
- slug (unique)
- content
- image
- authorId (FK to User)
- categoryId (FK to Category)
- status (draft, pending, published, rejected)
- views
- createdAt, updatedAt

### Comment
- id (PK)
- postId (FK to Post)
- userId (FK to User)
- comment
- status (pending, approved, rejected)
- createdAt, updatedAt

### Like
- id (PK)
- postId (FK to Post)
- visitorId (unique constraint with postId)
- createdAt

### Category
- id (PK)
- name (unique)
- slug (unique)
- createdAt, updatedAt

### Advertisement
- id (PK)
- title
- image
- link
- status (active, inactive)
- createdAt, updatedAt

## Development Tips

1. **Testing API**: Use Postman or REST Client extension
2. **Database Inspection**: Use MySQL Workbench or similar tools
3. **Logging**: Check console logs for detailed information
4. **Debugging**: Use `NODE_ENV=development` for detailed error messages

## Troubleshooting

### Database Connection Error
- Check database credentials in `.env`
- Ensure MySQL server is running
- Verify database exists

### Port Already in Use
- Change `PORT` in `.env`
- Or kill process using the port

### CORS Errors
- Update `CORS_ORIGIN` in `.env` with correct frontend URL
- Include credentials if needed

### JWT Errors
- Ensure token is included in Authorization header as `Bearer <token>`
- Check token expiration time
- Verify JWT secrets are set correctly

## Production Deployment

Before deploying to production:

1. **Update Environment Variables**
   - Change JWT secrets
   - Set `NODE_ENV=production`
   - Configure correct database
   - Update CORS origin

2. **Security**
   - Use HTTPS only
   - Enable database encryption
   - Use strong passwords
   - Enable rate limiting

3. **Performance**
   - Use a process manager (PM2)
   - Enable caching
   - Optimize database queries
   - Use a reverse proxy (Nginx)

## License

ISC

## Support

For issues, questions, or suggestions, please create an issue in the repository.
