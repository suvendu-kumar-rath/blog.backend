# Quick Reference Guide

A quick reference for developers working with the Blog Backend API.

## Quick Start (5 minutes)

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env with your MySQL credentials

# 3. Create database
mysql -u root -p -e "CREATE DATABASE blog_db;"

# 4. Seed admin user and sync database
npm run seed

# 5. Start development server
npm run dev

# Server running on http://localhost:5000
```

## Commands

```bash
npm install          # Install all dependencies
npm run dev          # Start with hot reload (development)
npm start            # Start production server
npm run seed         # Create database & seed admin user
```

## Admin Login

Default credentials after seeding:
```
Email: admin@example.com
Password: Admin@123
```

Change immediately in production!

## File Structure at a Glance

```
src/
  ├── config/database.js          # MySQL connection
  ├── models/                      # Data models (6 files)
  ├── controllers/                 # Business logic (6 files)
  ├── routes/                      # API endpoints (6 files)
  ├── middleware/                  # Auth, validation, uploads
  ├── utils/                       # JWT, slug helpers
  ├── seeders/adminSeeder.js      # Create admin user
  └── server.js                    # Main app
```

## Key Endpoints

### Authentication
```
POST /api/auth/register              # New user
POST /api/auth/login                 # Get tokens
POST /api/auth/logout                # Logout
```

### Posts (CRUD)
```
GET  /api/posts                      # List all
GET  /api/posts/:slug                # Single post
GET  /api/posts/category/:slug       # By category
GET  /api/posts/search?q=...         # Search
POST /api/posts                      # Create (auth)
PUT  /api/posts/:id                  # Update (auth)
DELETE /api/posts/:id                # Delete (auth)
```

### Comments
```
GET  /api/posts/:postId/comments     # List
POST /api/posts/:postId/comments     # Create (auth)
DELETE /api/posts/comments/:id       # Delete own (auth)
PUT  /api/posts/comments/:id/approve # Approve (admin)
PUT  /api/posts/comments/:id/reject  # Reject (admin)
```

### Likes
```
POST /api/posts/:id/like             # Like (public)
POST /api/posts/:id/unlike           # Unlike (public)
GET  /api/posts/:id/likes-count      # Count (public)
GET  /api/posts/:id/check-like       # Check status (public)
```

### Categories
```
GET  /api/categories                 # List all (public)
POST /api/categories                 # Create (admin)
PUT  /api/categories/:id             # Update (admin)
DELETE /api/categories/:id           # Delete (admin)
```

### Users
```
GET  /api/users/profile              # My profile (auth)
GET  /api/users                      # List all (admin)
POST /api/users/editors              # Create editor (admin)
PUT  /api/users/:id/role             # Update role (admin)
DELETE /api/users/:id                # Delete user (admin)
```

### System
```
GET  /api/health                     # Health check
```

## Standard Response Format

All responses follow this format:

```json
{
  "success": true|false,
  "message": "Human readable message",
  "data": { /* Actual response data */ }
}
```

## Headers (For Authenticated Requests)

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Get token from login response.

## Roles & Permissions

| Action | Admin | Editor | User |
|--------|-------|--------|------|
| Create post | ✓ | ✓ | ✗ |
| Edit any post | ✓ | ✓ (own) | ✗ |
| Delete post | ✓ | ✓ (own) | ✗ |
| Approve posts | ✓ | ✗ | ✗ |
| Moderate comments | ✓ | ✗ | ✗ |
| Manage categories | ✓ | ✗ | ✗ |
| Manage users | ✓ | ✗ | ✗ |
| Create editors | ✓ | ✗ | ✗ |
| Comment | ✓ | ✓ | ✓ |
| Like posts | ✓ | ✓ | ✓ |

## Common Workflows

### Register & Login
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@test.com","password":"pass123"}'

# Login and save token
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@test.com","password":"pass123"}' \
  | jq -r '.data.accessToken')

# Use token in requests
curl http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer $TOKEN"
```

### Create Post with Image
```bash
curl -X POST http://localhost:5000/api/posts \
  -H "Authorization: Bearer $TOKEN" \
  -F "title=My Post" \
  -F "content=Post content..." \
  -F "categoryId=1" \
  -F "image=@/path/to/image.jpg"
```

### Like a Post (No Login Required)
```bash
# Use any unique visitor ID
VISITOR_ID="user-device-123"

curl -X POST http://localhost:5000/api/posts/1/like \
  -H "Content-Type: application/json" \
  -d "{\"visitorId\":\"$VISITOR_ID\"}"
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 5000 | Server port |
| DB_HOST | localhost | Database host |
| DB_USER | root | Database user |
| DB_PASSWORD | | Database password |
| DB_NAME | blog_db | Database name |
| JWT_ACCESS_SECRET | (none) | Access token secret |
| JWT_REFRESH_SECRET | (none) | Refresh token secret |
| CORS_ORIGIN | localhost:3000 | Frontend URL |

## Database

### Tables Created

- **users**: User accounts
- **posts**: Blog posts
- **comments**: Post comments
- **likes**: Post likes
- **categories**: Post categories
- **advertisements**: Ads

### Query Examples

```sql
-- Active posts
SELECT * FROM posts WHERE status = 'published' ORDER BY createdAt DESC;

-- User's posts
SELECT * FROM posts WHERE authorId = 1;

-- Comments needing approval
SELECT * FROM comments WHERE status = 'pending';

-- Most liked posts
SELECT postId, COUNT(*) as likes FROM likes GROUP BY postId ORDER BY likes DESC;
```

## Error Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad request (validation) |
| 401 | Unauthorized (no token) |
| 403 | Forbidden (wrong role) |
| 404 | Not found |
| 500 | Server error |

## Debugging

### Enable Detailed Logging
```bash
NODE_ENV=development npm run dev
```

### Check Database
```bash
mysql -u root -p blog_db
SHOW TABLES;
SELECT * FROM users;
```

### View Server Logs
```bash
# Development: console output
npm run dev

# Production: check logs
pm2 logs blog-api
```

## Common Issues & Fixes

### Connection Refused
```bash
# Check MySQL is running
mysql --version
sudo service mysql start
```

### Port 5000 in Use
```bash
# Change port in .env
# Or kill the process
kill -9 $(lsof -t -i:5000)
```

### Database Doesn't Exist
```bash
mysql -u root -p -e "CREATE DATABASE blog_db;"
npm run seed
```

### JWT Token Expired
```bash
# Get new token by logging in again
```

### Image Upload Fails
```bash
# Create uploads directory
mkdir -p uploads/images
chmod 755 uploads/images
```

## Performance Tips

1. **Add Database Indexes**
   ```sql
   CREATE INDEX idx_post_slug ON posts(slug);
   CREATE INDEX idx_post_status ON posts(status);
   ```

2. **Use Pagination**
   ```
   GET /api/posts?page=1&limit=10
   ```

3. **Enable Compression**
   - Already enabled with helmet & compression

4. **Monitor Performance**
   ```bash
   # Check response times
   npm install -g artillery
   artillery load test-api.yml
   ```

## Testing Endpoints

Use Postman or VS Code REST Client (`file.http`):

```http
### Get all posts
GET http://localhost:5000/api/posts

### Create post
POST http://localhost:5000/api/posts
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "title": "Test Post",
  "content": "Test content",
  "categoryId": 1
}

### Check health
GET http://localhost:5000/api/health
```

## Adding New Features

1. **Create Model** in `src/models/`
2. **Create Controller** in `src/controllers/`
3. **Create Routes** in `src/routes/`
4. **Add to server.js** routes
5. **Test endpoints** with curl/Postman

## Documentation Files

- **README.md** - Full API documentation
- **SETUP-DEPLOYMENT.md** - Installation & deployment guide
- **ARCHITECTURE.md** - Technical design details
- **API-TESTING.md** - Comprehensive testing guide
- **This file** - Quick reference

## Resources

- [Express.js Docs](https://expressjs.com/)
- [Sequelize Docs](https://sequelize.org/)
- [JWT Info](https://jwt.io/)
- [REST API Best Practices](https://restfulapi.net/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

## Support

Check these in order:
1. This quick reference
2. README.md for API details
3. ARCHITECTURE.md for design explanations
4. SETUP-DEPLOYMENT.md for setup issues
5. Check console logs for error details
6. Review database state in MySQL

## Tips

- Always validate input
- Check role permissions
- Use pagination for large lists
- Cache frequently accessed data
- Monitor database performance
- Keep secrets in .env, never in code
- Test endpoints before deploying
- Review error logs regularly
