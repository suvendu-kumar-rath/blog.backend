# API Testing Guide - Public Blog (No Login Required)

This guide helps you test all API endpoints. The blog is now **public** - no login required to view, like, or share posts.

## Base URL
```
http://localhost:5000/api
```

## Prerequisites

1. Server running: `npm run dev`
2. Database synced with seeder: `npm run seed`

## Key Features

✅ **Public Blog Viewing** - No login required  
✅ **Likes** - Track likes with visitor ID (cookie-based)  
✅ **Shares** - Track shares across social platforms  
❌ **Comments** - Removed  
❌ **User Registration/Login** - For admin management only  

---

## Public Endpoints (No Authentication Required)

### 1. Posts - View All
```bash
curl -X GET http://localhost:5000/api/posts \
  -H "Content-Type: application/json"
```

Query Parameters:
- `page` (default: 1) - Page number
- `limit` (default: 10) - Posts per page
- `status` (default: 'published') - Filter by status

### 2. Posts - Get by Slug
```bash
curl -X GET http://localhost:5000/api/posts/:slug \
  -H "Content-Type: application/json"
```

Example:
```bash
curl -X GET http://localhost:5000/api/posts/my-first-blog-post \
  -H "Content-Type: application/json"
```

Response includes post details with view count incremented.

### 3. Posts - Get by Category
```bash
curl -X GET http://localhost:5000/api/posts/category/:slug \
  -H "Content-Type: application/json"
```

Example:
```bash
curl -X GET http://localhost:5000/api/posts/category/technology \
  -H "Content-Type: application/json"
```

### 4. Posts - Search
```bash
curl -X GET "http://localhost:5000/api/posts/search?q=keyword" \
  -H "Content-Type: application/json"
```

Query Parameters:
- `q` - Search query (required)
- `page` (default: 1) - Page number
- `limit` (default: 10) - Posts per page

### 5. Categories - Get All
```bash
curl -X GET http://localhost:5000/api/categories \
  -H "Content-Type: application/json"
```

---

## Likes - Public Endpoints (Visitor-Based)

### Like a Post
```bash
curl -X POST http://localhost:5000/api/posts/:postId/like \
  -H "Content-Type: application/json" \
  -d '{
    "visitorId": "visitor-uuid-or-cookie-id"
  }'
```

Example:
```bash
curl -X POST http://localhost:5000/api/posts/1/like \
  -H "Content-Type: application/json" \
  -d '{
    "visitorId": "user-session-123"
  }'
```

### Unlike a Post
```bash
curl -X POST http://localhost:5000/api/posts/:postId/unlike \
  -H "Content-Type: application/json" \
  -d '{
    "visitorId": "visitor-uuid-or-cookie-id"
  }'
```

### Get Likes Count
```bash
curl -X GET http://localhost:5000/api/posts/:postId/likes-count \
  -H "Content-Type: application/json"
```

Example:
```bash
curl -X GET http://localhost:5000/api/posts/1/likes-count
```

### Check if Visitor Liked a Post
```bash
curl -X GET "http://localhost:5000/api/posts/:postId/check-like?visitorId=USER_ID" \
  -H "Content-Type: application/json"
```

Example:
```bash
curl -X GET "http://localhost:5000/api/posts/1/check-like?visitorId=user-session-123"
```

---

## Shares - Public Endpoints (NEW)

### Share a Post
```bash
curl -X POST http://localhost:5000/api/posts/:postId/share \
  -H "Content-Type: application/json" \
  -d '{
    "visitorId": "visitor-uuid-or-cookie-id",
    "platform": "facebook"
  }'
```

Supported platforms:
- `facebook`
- `twitter`
- `linkedin`
- `whatsapp`
- `email`
- `direct` (default)

Example:
```bash
curl -X POST http://localhost:5000/api/posts/1/share \
  -H "Content-Type: application/json" \
  -d '{
    "visitorId": "user-session-123",
    "platform": "facebook"
  }'
```

### Get Share Count
```bash
curl -X GET http://localhost:5000/api/posts/:postId/shares-count
```

Example:
```bash
curl -X GET http://localhost:5000/api/posts/1/shares-count
```

### Get Shares by Platform
```bash
curl -X GET http://localhost:5000/api/posts/:postId/shares-by-platform
```

Example:
```bash
curl -X GET http://localhost:5000/api/posts/1/shares-by-platform
```

Response:
```json
{
  "success": true,
  "message": "Shares by platform retrieved successfully",
  "data": {
    "postId": 1,
    "shares": [
      { "platform": "facebook", "count": "5" },
      { "platform": "twitter", "count": "3" },
      { "platform": "direct", "count": "2" }
    ]
  }
}
```

---

## Admin Endpoints (Authentication Required)

### Authentication

Get an access token by logging in:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin@123"
  }'
```

Use the token in Authorization header for admin endpoints:
```
Authorization: Bearer <accessToken>
```

### Create Post (Admin Only)
```bash
curl -X POST http://localhost:5000/api/posts \
  -H "Authorization: Bearer <accessToken>" \
  -F "title=My First Blog Post" \
  -F "content=This is the content of my blog post" \
  -F "categoryId=1" \
  -F "image=@/path/to/image.jpg"
```

### Update Post (Admin Only)
```bash
curl -X PUT http://localhost:5000/api/posts/:id \
  -H "Authorization: Bearer <accessToken>" \
  -F "title=Updated Title" \
  -F "content=Updated content" \
  -F "status=published"
```

### Delete Post (Admin Only)
```bash
curl -X DELETE http://localhost:5000/api/posts/:id \
  -H "Authorization: Bearer <accessToken>"
```

---

## Public User Test Flow

1. **View all published posts**
   ```bash
   curl -X GET http://localhost:5000/api/posts
   ```

2. **View a specific post (increments view count)**
   ```bash
   curl -X GET http://localhost:5000/api/posts/my-first-blog-post
   ```

3. **Like a post**
   ```bash
   curl -X POST http://localhost:5000/api/posts/1/like \
     -H "Content-Type: application/json" \
     -d '{"visitorId": "session-id-123"}'
   ```

4. **Share a post**
   ```bash
   curl -X POST http://localhost:5000/api/posts/1/share \
     -H "Content-Type: application/json" \
     -d '{
       "visitorId": "session-id-123",
       "platform": "facebook"
     }'
   ```

5. **Check like count**
   ```bash
   curl -X GET http://localhost:5000/api/posts/1/likes-count
   ```

6. **Check share count**
   ```bash
   curl -X GET http://localhost:5000/api/posts/1/shares-count
   ```

---

## Response Format

All responses follow this format:

**Success:**
```json
{
  "success": true,
  "message": "Operation description",
  "data": { /* response data */ }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error description",
  "error": "Error details"
}
```

---

## Notes

- **Visitor ID**: Use a consistent identifier per visitor (e.g., browser cookie, session ID, or UUID)
- **Public Posts**: Only posts with `status: 'published'` are visible to public users
- **No Comments**: Comment functionality has been completely removed
- **Admin Only**: Authentication
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

Save the `accessToken` from response for authenticated requests.

#### Logout
```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer <accessToken>"
```

### 2. Category Tests

#### Create a category (Admin)
```bash
curl -X POST http://localhost:5000/api/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <adminToken>" \
  -d '{
    "name": "Technology"
  }'
```

#### Get all categories
```bash
curl http://localhost:5000/api/categories
```

#### Update category (Admin)
```bash
curl -X PUT http://localhost:5000/api/categories/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <adminToken>" \
  -d '{
    "name": "Tech & Science"
  }'
```

#### Delete category (Admin)
```bash
curl -X DELETE http://localhost:5000/api/categories/1 \
  -H "Authorization: Bearer <adminToken>"
```

### 3. Post Tests

#### Create a post (Authenticated)
```bash
curl -X POST http://localhost:5000/api/posts \
  -H "Authorization: Bearer <editorToken>" \
  -F "title=My First Post" \
  -F "content=This is the content of my first post" \
  -F "categoryId=1" \
  -F "image=@/path/to/image.jpg"
```

#### Get all posts
```bash
curl "http://localhost:5000/api/posts?page=1&limit=10&status=published"
```

#### Get posts by category
```bash
curl http://localhost:5000/api/posts/category/technology
```

#### Get single post
```bash
curl http://localhost:5000/api/posts/my-first-post
```

#### Search posts
```bash
curl "http://localhost:5000/api/posts/search?q=technology&page=1&limit=10"
```

#### Update post (Author or Admin)
```bash
curl -X PUT http://localhost:5000/api/posts/1 \
  -H "Authorization: Bearer <userToken>" \
  -F "title=Updated Title" \
  -F "content=Updated content" \
  -F "status=published"
```

#### Delete post (Author or Admin)
```bash
curl -X DELETE http://localhost:5000/api/posts/1 \
  -H "Authorization: Bearer <userToken>"
```

### 4. Comment Tests

#### Create a comment (Authenticated)
```bash
curl -X POST http://localhost:5000/api/posts/1/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <userToken>" \
  -d '{
    "comment": "Great post! I learned a lot."
  }'
```

#### Get comments on a post
```bash
curl "http://localhost:5000/api/posts/1/comments?page=1&limit=10"
```

#### Approve comment (Admin)
```bash
curl -X PUT http://localhost:5000/api/posts/comments/1/approve \
  -H "Authorization: Bearer <adminToken>"
```

#### Reject comment (Admin)
```bash
curl -X PUT http://localhost:5000/api/posts/comments/1/reject \
  -H "Authorization: Bearer <adminToken>"
```

#### Delete own comment
```bash
curl -X DELETE http://localhost:5000/api/posts/comments/1 \
  -H "Authorization: Bearer <userToken>"
```

### 5. Like Tests

#### Like a post (Public)
```bash
curl -X POST http://localhost:5000/api/posts/1/like \
  -H "Content-Type: application/json" \
  -d '{
    "visitorId": "unique-visitor-id-123"
  }'
```

#### Unlike a post
```bash
curl -X POST http://localhost:5000/api/posts/1/unlike \
  -H "Content-Type: application/json" \
  -d '{
    "visitorId": "unique-visitor-id-123"
  }'
```

#### Get likes count
```bash
curl http://localhost:5000/api/posts/1/likes-count
```

#### Check if already liked
```bash
curl "http://localhost:5000/api/posts/1/check-like?visitorId=unique-visitor-id-123"
```

### 6. User Management Tests (Admin)

#### Get all users
```bash
curl http://localhost:5000/api/users \
  -H "Authorization: Bearer <adminToken>"
```

#### Get user profile (Authenticated)
```bash
curl http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer <userToken>"
```

#### Create an editor (Admin)
```bash
curl -X POST http://localhost:5000/api/users/editors \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <adminToken>" \
  -d '{
    "name": "Editor Name",
    "email": "editor@example.com",
    "password": "editorpass123"
  }'
```

#### Update user role (Admin)
```bash
curl -X PUT http://localhost:5000/api/users/1/role \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <adminToken>" \
  -d '{
    "role": "editor"
  }'
```

#### Delete user (Admin)
```bash
curl -X DELETE http://localhost:5000/api/users/1 \
  -H "Authorization: Bearer <adminToken>"
```

### 7. Health Check

#### Server health
```bash
curl http://localhost:5000/api/health
```

## Postman Collection

For easier testing, import this Postman collection:

1. Open Postman
2. Click "Import"
3. Paste the following and create requests for each endpoint
4. Set variables:
   - `baseUrl`: http://localhost:5000/api
   - `adminToken`: Your admin access token
   - `editorToken`: Your editor access token
   - `userToken`: Your user access token

## Common Response Codes

- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `400 Bad Request`: Validation error or invalid input
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## Testing Workflow

1. **Register & Login**: Get tokens for different roles
2. **Create Categories**: Add categories for posts
3. **Create Posts**: Test post creation with different statuses
4. **Publish Posts**: Admin approves editor posts
5. **Test Comments**: Create and moderate comments
6. **Test Likes**: Like posts with visitor IDs
7. **User Management**: Create and manage editors/users

## Debugging Tips

1. Check server logs for detailed error messages
2. Verify token expiration (15 minutes default)
3. Ensure role-based access is correct
4. Check database state using MySQL client
5. Use browser DevTools Network tab for frontend integration
6. Enable morgan logging to see HTTP requests
