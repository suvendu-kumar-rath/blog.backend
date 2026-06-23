# Admin APIs - Postman Testing Guide

## 🔑 Step 1: Admin Login (Required First)

**Endpoint:**
```
POST http://127.0.0.1:5001/api/auth/login
```

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@example.com",
    "phone": "9876543210",
    "role": "admin"
  }
}
```

⚠️ **Copy the token - use it for all subsequent requests**

---

## 📋 FETCH APIs

### Get All Editors
```
GET http://127.0.0.1:5001/api/editors?page=1&limit=10&search=
```
**Headers:** `Authorization: Bearer YOUR_TOKEN`

**Query Params:**
- `page` (default: 1)
- `limit` (default: 10)
- `search` (optional - search by name/email)

---

### Get Single Editor
```
GET http://127.0.0.1:5001/api/editors/{id}
```
**Headers:** `Authorization: Bearer YOUR_TOKEN`

**Example:** `GET http://127.0.0.1:5001/api/editors/2`

---

### Get Admin Profile
```
GET http://127.0.0.1:5001/api/users/profile/me
```
**Headers:** `Authorization: Bearer YOUR_TOKEN`

---

### Get All Posts
```
GET http://127.0.0.1:5001/api/posts
```
**Headers:** `Authorization: Bearer YOUR_TOKEN`

---

### Get All Advertisements
```
GET http://127.0.0.1:5001/api/advertisements
```
**Headers:** `Authorization: Bearer YOUR_TOKEN`

---

### Get Single Advertisement
```
GET http://127.0.0.1:5001/api/advertisements/{id}
```
**Headers:** `Authorization: Bearer YOUR_TOKEN`

**Example:** `GET http://127.0.0.1:5001/api/advertisements/1`

---

## ✏️ CREATE/UPDATE APIs

### Create New Editor (Admin Only)
```
POST http://127.0.0.1:5001/api/editors
```

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "9876543210"
}
```

---

### Update Editor (Admin Only)
```
PUT http://127.0.0.1:5001/api/editors/{id}
```

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```

**Body (all optional):**
```json
{
  "name": "John Updated",
  "email": "john.updated@example.com",
  "phone": "9876543211",
  "isActive": true
}
```

---

### Create Post (Admin Only)
```
POST http://127.0.0.1:5001/api/posts
```

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Body (form-data):**
| Key | Type | Value | Required |
|-----|------|-------|----------|
| title | text | "My Blog Post" | Yes |
| content | text | "Post content here..." | Yes |
| categoryId | number | 1 | No |
| image | file | Choose file | No |

---

### Update Post (Admin Only)
```
PUT http://127.0.0.1:5001/api/posts/{id}
```

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Body (form-data, all optional):**
| Key | Type | Value |
|-----|------|-------|
| title | text | "Updated Title" |
| content | text | "Updated content..." |
| categoryId | number | 1 |
| status | text | draft/pending/published/rejected |
| image | file | Choose file |

---

### Create Advertisement (Admin Only)
```
POST http://127.0.0.1:5001/api/advertisements
```

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Body (form-data):**
| Key | Type | Value | Required |
|-----|------|-------|----------|
| title | text | "Ad Title" | Yes |
| link | text | "https://example.com" | No |
| status | text | active/inactive | No |
| image | file | Choose file | No |

---

### Update Advertisement (Admin Only)
```
PUT http://127.0.0.1:5001/api/advertisements/{id}
```

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Body (form-data, all optional):**
| Key | Type | Value |
|-----|------|-------|
| title | text | "Updated Title" |
| link | text | "https://updated.com" |
| status | text | active/inactive |
| image | file | Choose file |

---

## 🗑️ DELETE APIs

### Delete Editor
```
DELETE http://127.0.0.1:5001/api/editors/{id}
```
**Headers:** `Authorization: Bearer YOUR_TOKEN`

---

### Delete Post
```
DELETE http://127.0.0.1:5001/api/posts/{id}
```
**Headers:** `Authorization: Bearer YOUR_TOKEN`

---

### Delete Advertisement
```
DELETE http://127.0.0.1:5001/api/advertisements/{id}
```
**Headers:** `Authorization: Bearer YOUR_TOKEN`

---

## 🔧 Postman Environment Setup

Create a Postman Environment with these variables:

| Variable | Value |
|----------|-------|
| base_url | http://127.0.0.1:5001 |
| admin_token | (paste from login response) |

Then use in requests:
```
{{base_url}}/api/editors
Authorization: Bearer {{admin_token}}
```

---

## ✅ Testing Checklist

- [ ] Login and get token
- [ ] Get all editors
- [ ] Get single editor
- [ ] Create new editor
- [ ] Update editor
- [ ] Delete editor
- [ ] Get all posts
- [ ] Create post
- [ ] Update post
- [ ] Delete post
- [ ] Get all advertisements
- [ ] Create advertisement
- [ ] Update advertisement
- [ ] Delete advertisement

---

## 📝 Notes

- All admin endpoints require valid JWT token in Authorization header
- Use `Bearer` prefix: `Authorization: Bearer {token}`
- Token expires in 7 days
- Phone number must be exactly 10 digits
- Email must be unique
- Post status: draft, pending, published, rejected
- Advertisement status: active, inactive
