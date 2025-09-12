# User Management Modülü

## Genel Bakış

User Management modülü, kullanıcı profil yönetimi, kullanıcı bilgileri güncelleme, kullanıcı arama ve kullanıcı durumu yönetimi işlemlerini ele alır.

## Dosya Yapısı

```
src/
├── controllers/
│   ├── userController.js      # User işlemleri controller
│   └── adminUserController.js # Admin user yönetimi
├── routes/
│   └── userRoutes.js         # User routes
├── services/
│   └── userService.js        # User business logic
├── models/
│   └── User.js              # User model
└── validation/
    └── userValidation.js    # User validation schemas
```

## User Model Schema

```javascript
// models/User.js
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  phone: {
    type: String,
    match: /^\+90\s\d{3}\s\d{3}\s\d{2}\s\d{2}$/
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'Turkey' }
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  avatar: {
    type: String,
    default: null
  },
  preferences: {
    language: { type: String, default: 'tr' },
    newsletter: { type: Boolean, default: false },
    notifications: { type: Boolean, default: true }
  },
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});
```

## API Endpoints

### GET `/api/users/profile`
Kullanıcının kendi profil bilgilerini getirir.

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "64f8a123456789abcdef",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+90 555 123 45 67",
      "address": {
        "street": "Atatürk Caddesi No:123",
        "city": "İstanbul",
        "state": "İstanbul",
        "zipCode": "34000",
        "country": "Turkey"
      },
      "avatar": "https://example.com/avatars/user123.jpg",
      "preferences": {
        "language": "tr",
        "newsletter": true,
        "notifications": true
      },
      "createdAt": "2023-10-01T10:00:00.000Z"
    }
  }
}
```

### PUT `/api/users/profile`
Kullanıcı profil bilgilerini günceller.

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "name": "John Smith",
  "phone": "+90 555 987 65 43",
  "address": {
    "street": "Yeni Mahalle No:456",
    "city": "Ankara",
    "state": "Ankara",
    "zipCode": "06000"
  },
  "preferences": {
    "language": "en",
    "newsletter": false,
    "notifications": true
  }
}
```

### PUT `/api/users/change-password`
Kullanıcı şifresini değiştirir.

**Request Body:**
```json
{
  "currentPassword": "currentPassword123",
  "newPassword": "newPassword456"
}
```

### POST `/api/users/upload-avatar`
Kullanıcı profil fotoğrafını yükler.

**Request:**
- Content-Type: multipart/form-data
- Field: `avatar` (file)

**Response:**
```json
{
  "success": true,
  "message": "Avatar başarıyla yüklendi",
  "data": {
    "avatarUrl": "https://example.com/avatars/user123.jpg"
  }
}
```

### DELETE `/api/users/account`
Kullanıcı hesabını siler (soft delete).

**Response:**
```json
{
  "success": true,
  "message": "Hesap başarıyla silindi"
}
```

### GET `/api/users/orders`
Kullanıcının sipariş geçmişini getirir.

**Query Parameters:**
- `page`: Sayfa numarası (default: 1)
- `limit`: Sayfa başına kayıt (default: 10)
- `status`: Sipariş durumu filtresi

**Response:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "order123",
        "orderNumber": "ORD-2023-001",
        "status": "delivered",
        "total": 299.99,
        "createdAt": "2023-10-01T10:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalOrders": 47
    }
  }
}
```

## Admin User Management

### GET `/api/admin/users`
Tüm kullanıcıları listeler (Admin only).

**Query Parameters:**
- `page`: Sayfa numarası
- `limit`: Sayfa başına kayıt
- `search`: Arama terimi
- `role`: Role filtresi
- `status`: Aktiflik durumu

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "64f8a123456789abcdef",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "user",
        "isActive": true,
        "lastLogin": "2023-10-01T10:00:00.000Z",
        "createdAt": "2023-09-01T10:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalUsers": 95
    }
  }
}
```

### GET `/api/admin/users/:id`
Belirli kullanıcının detaylarını getirir.

### PUT `/api/admin/users/:id`
Kullanıcı bilgilerini günceller (Admin).

### PUT `/api/admin/users/:id/status`
Kullanıcı durumunu değiştirir (aktif/pasif).

**Request Body:**
```json
{
  "isActive": false
}
```

### PUT `/api/admin/users/:id/role`
Kullanıcı rolünü değiştirir.

**Request Body:**
```json
{
  "role": "moderator"
}
```

## User Service Fonksiyonları

### `getUserProfile(userId)`
Kullanıcı profil bilgilerini getirir.

### `updateUserProfile(userId, updateData)`
Kullanıcı profil bilgilerini günceller.

### `changePassword(userId, currentPassword, newPassword)`
Kullanıcı şifresini değiştirir.

### `uploadAvatar(userId, file)`
Kullanıcı avatar'ını yükler.

### `deactivateUser(userId)`
Kullanıcı hesabını deaktive eder.

### `getUserOrders(userId, pagination)`
Kullanıcının sipariş geçmişini getirir.

### `searchUsers(searchTerm, filters)`
Kullanıcıları arar ve filtreler.

## Validation Schemas

### Profile Update Validation
```javascript
const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(50).trim(),
  phone: Joi.string().pattern(/^\+90\s\d{3}\s\d{3}\s\d{2}\s\d{2}$/),
  address: Joi.object({
    street: Joi.string().max(100),
    city: Joi.string().max(50),
    state: Joi.string().max(50),
    zipCode: Joi.string().pattern(/^\d{5}$/),
    country: Joi.string().max(50)
  }),
  preferences: Joi.object({
    language: Joi.string().valid('tr', 'en'),
    newsletter: Joi.boolean(),
    notifications: Joi.boolean()
  })
});
```

### Password Change Validation
```javascript
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
});
```

## Middleware ve Güvenlik

### Profile Access Control
```javascript
// Kullanıcı sadece kendi profilini görebilir
const checkProfileAccess = (req, res, next) => {
  if (req.params.id && req.params.id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'ACCESS_DENIED',
        message: 'Bu profile erişim yetkiniz yok'
      }
    });
  }
  next();
};
```

### Avatar Upload Middleware
```javascript
const multer = require('multer');
const sharp = require('sharp');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Sadece resim dosyaları yüklenebilir'), false);
    }
  }
});

const processAvatar = async (req, res, next) => {
  if (!req.file) return next();
  
  try {
    const filename = `avatar-${req.user.id}-${Date.now()}.jpeg`;
    
    await sharp(req.file.buffer)
      .resize(200, 200)
      .jpeg({ quality: 90 })
      .toFile(`public/avatars/${filename}`);
    
    req.file.filename = filename;
    next();
  } catch (error) {
    next(error);
  }
};
```

## Frontend Entegrasyonu

### User Profile Hook (React)
```javascript
import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

export const useUserProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  const fetchProfile = async () => {
    try {
      const response = await api.get('/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(response.data.data.user);
    } catch (error) {
      console.error('Profile fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data) => {
    try {
      const response = await api.put('/users/profile', data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(response.data.data.user);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token]);

  return {
    profile,
    loading,
    updateProfile,
    refetch: fetchProfile
  };
};
```

### Profile Form Component
```javascript
import React, { useState } from 'react';
import { useUserProfile } from '../hooks/useUserProfile';

const ProfileForm = () => {
  const { profile, updateProfile } = useUserProfile();
  const [formData, setFormData] = useState(profile || {});

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(formData);
      alert('Profil başarıyla güncellendi');
    } catch (error) {
      alert('Profil güncellenirken hata oluştu');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={formData.name || ''}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
        placeholder="Ad Soyad"
      />
      <input
        type="email"
        value={formData.email || ''}
        disabled
        placeholder="E-posta"
      />
      <input
        type="tel"
        value={formData.phone || ''}
        onChange={(e) => setFormData({...formData, phone: e.target.value})}
        placeholder="Telefon"
      />
      <button type="submit">Güncelle</button>
    </form>
  );
};
```

## Error Handling

### User Errors
```javascript
// Kullanıcı bulunamadı
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "Kullanıcı bulunamadı"
  }
}

// Geçersiz şifre
{
  "success": false,
  "error": {
    "code": "INVALID_PASSWORD",
    "message": "Mevcut şifre yanlış"
  }
}

// Dosya yükleme hatası
{
  "success": false,
  "error": {
    "code": "UPLOAD_ERROR",
    "message": "Dosya yüklenirken hata oluştu"
  }
}
```

## Performans Optimizasyonları

1. **Caching**: Kullanıcı profilleri Redis'te cache'lenir
2. **Pagination**: Büyük kullanıcı listelerinde sayfalama
3. **Lazy Loading**: Avatar'lar lazy loading ile yüklenir
4. **Database Indexing**: Email, phone, createdAt alanlarında index

## Test Örnekleri

```javascript
describe('User Management', () => {
  test('should get user profile', async () => {
    const response = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.data.user.email).toBeDefined();
  });

  test('should update user profile', async () => {
    const updateData = { name: 'Updated Name' };
    
    const response = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${userToken}`)
      .send(updateData);
    
    expect(response.status).toBe(200);
    expect(response.body.data.user.name).toBe('Updated Name');
  });
});
```

---

**Son Güncelleme**: `{new Date().toLocaleDateString('tr-TR')}` 