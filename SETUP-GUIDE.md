# CMS Admin Panel Backend - Quick Setup Guide

## 🚀 5-Minute Quick Start

### Prerequisites
- Node.js v14+
- MySQL 5.7+
- npm or yarn

### Step 1: Install Dependencies
```bash
cd blog.backend
npm install
```

### Step 2: Create Environment File
```bash
cp .env.example .env
```

### Step 3: Update .env
Edit `.env` with your configuration:
```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=cms_admin_db

# JWT
JWT_SECRET=your-super-secret-key-change-in-production

# Google Drive (Optional - for image uploads)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REFRESH_TOKEN=your-refresh-token
GOOGLE_FOLDER_ID=your-folder-id
```

### Step 4: Create MySQL Database
```bash
# Open MySQL CLI
mysql -u root -p

# Create database
CREATE DATABASE cms_admin_db;
EXIT;
```

### Step 5: Start Server
```bash
npm run dev
```

Server will start on `http://localhost:5000`

---

## 📋 API Quick Reference

### Authentication

**Register**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@example.com",
    "password": "password123",
    "phone": "9876543210",
    "role": "admin"
  }'
```

**Login**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

Response includes JWT token to use for authenticated requests.

### Use Token in Requests
```bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

---

## 👥 Editor Management (Admin Only)

**Create Editor**
```bash
curl -X POST http://localhost:5000/api/editors \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Editor",
    "email": "john@example.com",
    "password": "password123",
    "phone": "9876543211"
  }'
```

**Get All Editors**
```bash
curl -X GET "http://localhost:5000/api/editors?page=1&limit=10" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Update Editor**
```bash
curl -X PUT http://localhost:5000/api/editors/1 \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "isActive": true
  }'
```

**Delete Editor**
```bash
curl -X DELETE http://localhost:5000/api/editors/1 \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## 📝 Post Management

**Create Post**
```bash
curl -X POST http://localhost:5000/api/posts \
  -H "Authorization: Bearer USER_TOKEN" \
  -F "title=My First Post" \
  -F "content=This is the content of my post" \
  -F "image=@/path/to/image.jpg"
```

**Get All Posts**
```bash
curl -X GET "http://localhost:5000/api/posts?page=1&limit=10&status=published" \
  -H "Authorization: Bearer TOKEN"
```

**Update Post**
```bash
curl -X PUT http://localhost:5000/api/posts/1 \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title",
    "content": "Updated content",
    "status": "published"
  }'
```

**Delete Post**
```bash
curl -X DELETE http://localhost:5000/api/posts/1 \
  -H "Authorization: Bearer USER_TOKEN"
```

---

## 📢 Advertisement Management (Admin Only)

**Create Advertisement**
```bash
curl -X POST http://localhost:5000/api/advertisements \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -F "title=Product Ad" \
  -F "link=https://example.com" \
  -F "image=@/path/to/ad-image.jpg" \
  -F "status=active"
```

**Get All Advertisements**
```bash
curl -X GET "http://localhost:5000/api/advertisements?page=1&limit=10" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Update Advertisement**
```bash
curl -X PUT http://localhost:5000/api/advertisements/1 \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -F "title=Updated Ad Title" \
  -F "status=inactive"
```

**Delete Advertisement**
```bash
curl -X DELETE http://localhost:5000/api/advertisements/1 \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## 🖼️ Image Upload

**Upload Image to Google Drive**
```bash
curl -X POST http://localhost:5000/api/upload \
  -H "Authorization: Bearer USER_TOKEN" \
  -F "image=@/path/to/image.jpg"
```

Response:
```json
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

## 🔒 Authentication & Authorization

### Role-Based Access

**Admin Permissions:**
- ✅ Create/Edit/Delete editors
- ✅ Manage all posts
- ✅ Create/Edit/Delete advertisements
- ✅ Change post status
- ✅ View all users

**Editor Permissions:**
- ✅ Create/Edit own posts
- ❌ Cannot manage other editors
- ❌ Cannot manage advertisements
- ❌ Cannot change post status (draft only)

### JWT Token
- Valid for 7 days
- Include in Authorization header: `Authorization: Bearer <token>`
- Contains user id, email, and role

---

## 🗄️ Database Tables

### Users
```sql
- id (PK)
- name
- email (UNIQUE)
- password (HASHED)
- phone (10 digits)
- role (admin/editor)
- isActive
- lastLogin
- createdAt, updatedAt
```

### Posts
```sql
- id (PK)
- title
- content
- imageUrl
- authorId (FK)
- status (draft/published/archived)
- viewCount
- createdAt, updatedAt
```

### Advertisements
```sql
- id (PK)
- title
- image
- link
- status (active/inactive)
- createdAt, updatedAt
```

---

## 📦 Project Structure

```
src/
├── config/              # Configuration files
│   ├── database.js      # Sequelize setup
│   └── googleDrive.js   # Google Drive API
├── controllers/         # Business logic
│   ├── authController.js
│   ├── userController.js
│   ├── postController.js
│   └── advertisementController.js
├── middleware/          # Custom middleware
│   ├── authMiddleware.js
│   ├── roleMiddleware.js
│   └── uploadMiddleware.js
├── models/              # Database models
│   ├── User.js
│   ├── Post.js
│   └── Advertisement.js
├── routes/              # API routes
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── postRoutes.js
│   └── advertisementRoutes.js
├── utils/               # Utility functions
│   └── password.js      # Password hashing
└── server.js            # Express app
```

---

## 🐛 Troubleshooting

### Connection Error
```
Error: connect ECONNREFUSED
```
**Solution:** Make sure MySQL is running
```bash
# On Windows
net start MySQL80

# On Linux
sudo systemctl start mysql

# On Mac
brew services start mysql
```

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution:** Change PORT in .env or stop the process using port 5000

### Database Not Found
```
Error: Unknown database 'cms_admin_db'
```
**Solution:** Create the database
```bash
mysql -u root -p -e "CREATE DATABASE cms_admin_db;"
```

### JWT Token Expired
```
{"success": false, "message": "Invalid token"}
```
**Solution:** Get a new token by logging in again

---

## 📚 Full Documentation

- **API Documentation**: See `API-DOCUMENTATION.md`
- **Implementation Guide**: See `IMPLEMENTATION-GUIDE.md`
- **Architecture Details**: See `ARCHITECTURE.md`

---

## 🚀 Deployment

### Production Checklist
- [ ] Update all `.env` variables for production
- [ ] Set `NODE_ENV=production`
- [ ] Change `JWT_SECRET` to strong random value
- [ ] Configure `CORS_ORIGIN` with production domains
- [ ] Enable SSL/HTTPS
- [ ] Set up MySQL backups
- [ ] Configure Google Drive API for production
- [ ] Test all endpoints
- [ ] Set up monitoring and logging
- [ ] Enable security headers

### Deploy to Heroku
```bash
# 1. Login to Heroku
heroku login

# 2. Create app
heroku create your-app-name

# 3. Set environment variables
heroku config:set JWT_SECRET=your-secret-key

# 4. Deploy
git push heroku main
```

---

## 🔐 Security Notes

1. **Never commit `.env`** file with real credentials
2. **Change JWT_SECRET** to a strong random string
3. **Use HTTPS** in production
4. **Enable rate limiting** for auth endpoints
5. **Validate all inputs** before processing
6. **Hash all passwords** with bcrypt
7. **Keep dependencies updated**: `npm audit fix`

---

## 📞 Support

For issues or questions:
1. Check `API-DOCUMENTATION.md` for endpoint details
2. Review `IMPLEMENTATION-GUIDE.md` for architecture
3. Check error logs for debugging
4. Verify `.env` configuration

---

## 📝 License

ISC

---

## 🎯 Next Steps

1. ✅ Install dependencies
2. ✅ Configure `.env`
3. ✅ Create database
4. ✅ Start server
5. ✅ Register admin user
6. ✅ Create editors
7. ✅ Create posts/advertisements
8. ✅ Deploy to production

Happy coding! 🚀
