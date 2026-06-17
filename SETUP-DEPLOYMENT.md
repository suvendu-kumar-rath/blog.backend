# Setup & Deployment Guide

This guide provides step-by-step instructions to set up and deploy the Blog Backend API.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Database Setup](#database-setup)
4. [Running the Application](#running-the-application)
5. [First Steps After Setup](#first-steps-after-setup)
6. [Production Deployment](#production-deployment)
7. [Troubleshooting](#troubleshooting)
8. [Performance Optimization](#performance-optimization)

## Prerequisites

Before starting, ensure you have installed:

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **npm** (v6 or higher) - Usually comes with Node.js
- **MySQL** (v5.7 or higher) - [Download](https://www.mysql.com/downloads/)
- **Git** (optional) - [Download](https://git-scm.com/)

### Verify Installation

```bash
node --version
npm --version
mysql --version
```

## Local Development Setup

### 1. Clone or Download the Project

```bash
# If using git
git clone <repository-url>
cd blog.backend

# Or simply navigate to the project directory
cd blog.backend
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages listed in `package.json`.

### 3. Configure Environment Variables

Copy the example environment file and update it:

```bash
cp .env.example .env
```

Open `.env` and update the following variables:

```env
# Server
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=blog_db
DB_PORT=3306

# JWT Configuration
JWT_ACCESS_SECRET=your_very_secret_access_key_change_in_production
JWT_REFRESH_SECRET=your_very_secret_refresh_key_change_in_production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Upload Configuration
UPLOAD_DIR=uploads/images
MAX_FILE_SIZE=5242880

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Database Setup

### 1. Create Database

Open MySQL command line or MySQL Workbench:

```sql
CREATE DATABASE blog_db;
```

Or if you prefer to use a MySQL client:

```bash
mysql -u root -p -e "CREATE DATABASE blog_db;"
```

### 2. Create Database User (Optional but Recommended)

```sql
CREATE USER 'blog_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON blog_db.* TO 'blog_user'@'localhost';
FLUSH PRIVILEGES;
```

Then update your `.env`:
```env
DB_USER=blog_user
DB_PASSWORD=secure_password
```

### 3. Seed Admin User

The application uses Sequelize to manage database tables. Run the seeder to create default admin user:

```bash
npm run seed
```

This will:
- Sync all models with the database (create tables)
- Create a default admin user
- Display admin credentials

**Default Admin:**
- Email: `admin@example.com`
- Password: `Admin@123`

⚠️ **IMPORTANT**: Change this password immediately after first login in production!

## Running the Application

### Development Mode

For development with auto-reload on file changes:

```bash
npm run dev
```

This uses `nodemon` to automatically restart the server when files change.

The server will start on `http://localhost:5000`

### Production Mode

For production deployment:

```bash
npm start
```

The application will start without auto-reload.

### Verify Server is Running

Open your browser and visit:
```
http://localhost:5000/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is running",
  "data": {
    "timestamp": "2024-01-15T10:30:45.123Z",
    "uptime": 45.678
  }
}
```

## First Steps After Setup

### 1. Test Authentication

```bash
# Login with default admin
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin@123"
  }'
```

Save the returned `accessToken` for testing protected endpoints.

### 2. Create Categories

```bash
curl -X POST http://localhost:5000/api/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{
    "name": "Technology"
  }'
```

### 3. Create a Test Post

```bash
curl -X POST http://localhost:5000/api/posts \
  -H "Authorization: Bearer <accessToken>" \
  -F "title=Welcome to the Blog" \
  -F "content=This is the first post" \
  -F "categoryId=1"
```

### 4. Retrieve Posts

```bash
curl http://localhost:5000/api/posts
```

### 5. Change Admin Password

1. Register a new admin account
2. Update the user role to admin via database or use existing admin to change password
3. Delete the default admin account for security

## Production Deployment

### Pre-Deployment Checklist

- [ ] Update all JWT secrets in `.env`
- [ ] Set `NODE_ENV=production`
- [ ] Use strong database password
- [ ] Configure correct database (backup existing data)
- [ ] Update `CORS_ORIGIN` with production frontend URL
- [ ] Update `PORT` if needed
- [ ] Enable HTTPS
- [ ] Set up SSL certificates
- [ ] Configure backup strategy
- [ ] Set up monitoring and logging

### Deployment to Linux/Ubuntu Server

#### 1. Install Node.js and MySQL

```bash
# Update system
sudo apt update
sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MySQL
sudo apt-get install -y mysql-server
```

#### 2. Clone Project

```bash
cd /var/www
git clone <repository-url> blog-backend
cd blog-backend
npm install
```

#### 3. Configure Environment

```bash
nano .env
# Update database and server settings
```

#### 4. Setup Database

```bash
mysql -u root -p < database_setup.sql
npm run seed
```

#### 5. Install PM2 (Process Manager)

```bash
sudo npm install -g pm2

# Start application with PM2
pm2 start src/server.js --name "blog-api"

# Save PM2 configuration
pm2 save

# Setup startup on boot
pm2 startup
```

#### 6. Setup Nginx as Reverse Proxy

```bash
sudo apt-get install -y nginx

# Create Nginx config
sudo nano /etc/nginx/sites-available/blog-api
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the configuration:

```bash
sudo ln -s /etc/nginx/sites-available/blog-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 7. Setup SSL with Let's Encrypt (Recommended)

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

#### 8. Setup Database Backups

```bash
# Create backup script
nano backup.sh
```

Add:

```bash
#!/bin/bash
BACKUP_DIR="/backups/blog"
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u blog_user -p blog_db > $BACKUP_DIR/blog_$DATE.sql
# Compress
gzip $BACKUP_DIR/blog_$DATE.sql
# Keep only last 30 days
find $BACKUP_DIR -mtime +30 -delete
```

Schedule with cron:

```bash
crontab -e
# Add: 0 2 * * * /path/to/backup.sh
```

### Deployment to AWS

#### 1. Create EC2 Instance

- Choose Ubuntu 20.04 LTS AMI
- Instance type: t2.micro (or higher for production)
- Configure security groups:
  - Port 80 (HTTP)
  - Port 443 (HTTPS)
  - Port 3306 (MySQL, internal only)
  - Port 22 (SSH, restricted to your IP)

#### 2. Connect and Setup

```bash
ssh -i your-key.pem ubuntu@your-ec2-ip

# Follow Linux/Ubuntu setup steps above
```

#### 3. RDS for Database (Recommended)

- Create RDS MySQL instance
- Update `.env` with RDS endpoint
- Restore database dump if migrating

#### 4. Upload Files to S3

For production uploads, consider AWS S3:

```bash
npm install aws-sdk
```

Update upload middleware to use S3 instead of local storage.

### Deployment to Heroku

#### 1. Install Heroku CLI

```bash
brew tap heroku/brew && brew install heroku
heroku login
```

#### 2. Create Heroku App

```bash
heroku create blog-api
```

#### 3. Configure Environment Variables

```bash
heroku config:set JWT_ACCESS_SECRET=your_secret
heroku config:set DB_HOST=your_db_host
# ... set all required variables
```

#### 4. Deploy

```bash
git push heroku main
# Or use Procfile with: web: npm start
```

## Troubleshooting

### Database Connection Error

**Error**: `Error: connect ECONNREFUSED 127.0.0.1:3306`

**Solutions**:
1. Check MySQL is running: `mysql --version`
2. Start MySQL: `sudo service mysql start`
3. Verify credentials in `.env`
4. Check database exists: `mysql -u root -p -e "SHOW DATABASES;"`

### Port Already in Use

**Error**: `Error: listen EADDRINUSE: address already in use :::5000`

**Solutions**:
1. Change PORT in `.env`
2. Kill process using port:
   ```bash
   # Linux/Mac
   lsof -i :5000 | grep LISTEN | awk '{print $2}' | xargs kill -9
   
   # Windows
   netstat -ano | findstr :5000
   taskkill /PID <PID> /F
   ```

### Module Not Found

**Error**: `Cannot find module 'express'`

**Solutions**:
1. Install dependencies: `npm install`
2. Check node_modules exists
3. Check package.json for correct dependencies

### JWT Token Expired

**Error**: `JsonWebTokenError: jwt expired`

**Solutions**:
1. Generate new token by logging in again
2. Check JWT_ACCESS_EXPIRY in `.env`
3. Sync system time

### File Upload Fails

**Error**: `EACCES: permission denied`

**Solutions**:
1. Check uploads directory permissions: `chmod -R 755 uploads/`
2. Ensure correct file size limits
3. Check disk space

## Performance Optimization

### 1. Database Optimization

```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_post_slug ON posts(slug);
CREATE INDEX idx_post_status ON posts(status);
CREATE INDEX idx_comment_post ON comments(postId);
CREATE INDEX idx_like_post_visitor ON likes(postId, visitorId);
```

### 2. Caching

Add Redis for caching:

```bash
npm install redis ioredis
```

Cache frequently accessed data like posts, categories.

### 3. Connection Pooling

Already configured in database.js with pool settings:

```javascript
pool: {
  max: 10,
  min: 0,
  acquire: 30000,
  idle: 10000
}
```

Adjust based on traffic load.

### 4. Load Balancing

Use PM2 cluster mode:

```bash
pm2 start src/server.js -i max --name "blog-api"
```

### 5. Compression

Add gzip compression:

```bash
npm install compression
```

Update server.js:
```javascript
const compression = require('compression');
app.use(compression());
```

### 6. Monitoring

Setup monitoring tools:
- **PM2 Plus**: Monitor with PM2
- **New Relic**: Application performance monitoring
- **DataDog**: Infrastructure and application monitoring

## Maintenance

### Regular Tasks

- **Daily**: Monitor logs for errors
- **Weekly**: Check database size and performance
- **Monthly**: Review user activity and post statistics
- **Quarterly**: Update dependencies with `npm update`
- **Yearly**: Security audit and penetration testing

### Update Dependencies Safely

```bash
# Check for outdated packages
npm outdated

# Update minor versions
npm update

# Update major versions (manual)
npm install package-name@latest

# Check for security vulnerabilities
npm audit
npm audit fix
```

## Support & Documentation

For more information:
- See [README.md](./README.md) for API documentation
- See [API-TESTING.md](./API-TESTING.md) for testing examples
- Check `.env.example` for all configuration options
