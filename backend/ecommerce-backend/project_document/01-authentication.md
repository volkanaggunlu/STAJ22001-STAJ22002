# Authentication & Authorization Modülü

## Genel Bakış

Authentication modülü, kullanıcı kimlik doğrulama, yetkilendirme ve güvenlik işlemlerini yönetir. JWT tabanlı token sistemi kullanılır.

## Dosya Yapısı

```
src/
├── controllers/auth.js         # Authentication controller
├── routes/auth.js             # Authentication routes
├── services/authService.js    # Authentication services
├── middleware/auth.js         # Auth middleware
├── config/jwt.js             # JWT configuration
└── models/User.js            # User model
```

## Temel Özellikler

### 🔐 Kimlik Doğrulama
- Kullanıcı kayıt (register)
- Kullanıcı giriş (login)
- JWT token oluşturma ve doğrulama
- Şifre sıfırlama
- Email doğrulama

### 🛡️ Yetkilendirme
- Role-based access control (RBAC)
- Middleware ile endpoint koruması
- Admin, user, moderator rolleri
- Token refresh mekanizması

## API Endpoints

### POST `/api/auth/register`
Yeni kullanıcı kaydı oluşturur.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "phone": "+90 555 123 45 67"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Kullanıcı başarıyla kaydedildi",
  "data": {
    "user": {
      "id": "64f8a123456789abcdef",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### POST `/api/auth/login`
Kullanıcı girişi yapar.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Başarıyla giriş yapıldı",
  "data": {
    "user": {
      "id": "64f8a123456789abcdef",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### POST `/api/auth/forgot-password`
Şifre sıfırlama isteği gönderir.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

### POST `/api/auth/reset-password`
Şifreyi sıfırlar.

**Request Body:**
```json
{
  "token": "reset_token_here",
  "password": "newSecurePassword123"
}
```

### POST `/api/auth/verify-email`
Email adresini doğrular.

**Request Body:**
```json
{
  "token": "verification_token_here"
}
```

## Middleware Kullanımı

### Temel Auth Middleware
```javascript
const { protect } = require('../middleware/auth');

// Route'u koruma
app.get('/api/protected-route', protect, (req, res) => {
  // req.user ile kullanıcı bilgilerine erişim
  res.json({ user: req.user });
});
```

### Role-based Middleware
```javascript
const { protect, authorize } = require('../middleware/auth');

// Sadece admin erişimi
app.get('/api/admin-only', protect, authorize('admin'), (req, res) => {
  res.json({ message: 'Admin alanı' });
});

// Admin veya moderator erişimi
app.get('/api/moderated', protect, authorize('admin', 'moderator'), (req, res) => {
  res.json({ message: 'Moderator alanı' });
});
```

## Security Features

### 🔐 Şifre Güvenliği
- bcryptjs ile hash'leme (12 rounds)
- Minimum şifre gereksinimleri
- Şifre geçmişi kontrolü

### 🛡️ Token Güvenliği
- JWT ile stateless authentication
- Token expiration (24 saat)
- Refresh token mekanizması
- Blacklist sistemi

### 🚫 Rate Limiting
- Login denemesi sınırlaması (5 deneme/15 dakika)
- IP bazlı sınırlama
- Brute force koruması

## Konfigürasyon

### JWT Ayarları
```javascript
// config/jwt.js
module.exports = {
  secret: process.env.JWT_SECRET,
  expiresIn: '24h',
  refreshExpiresIn: '7d',
  algorithm: 'HS256'
};
```

### Auth Service Fonksiyonları

#### `generateToken(user)`
JWT token oluşturur.

#### `verifyToken(token)`
JWT token doğrular.

#### `hashPassword(password)`
Şifreyi hash'ler.

#### `comparePassword(password, hashedPassword)`
Şifre karşılaştırması yapar.

#### `generateResetToken()`
Şifre sıfırlama token'ı oluşturur.

## Error Handling

### Authentication Errors
```javascript
// Geçersiz token
{
  "success": false,
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Geçersiz token"
  }
}

// Yetkisiz erişim
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Bu işlem için yetkiniz yok"
  }
}

// Token süresi dolmuş
{
  "success": false,
  "error": {
    "code": "TOKEN_EXPIRED",
    "message": "Token süresi dolmuş"
  }
}
```

## Validation Rules

### Register Validation
```javascript
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required(),
  phone: Joi.string().pattern(/^\+90\s\d{3}\s\d{3}\s\d{2}\s\d{2}$/)
});
```

### Login Validation
```javascript
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});
```

## Frontend Entegrasyonu

### Token Storage
```javascript
// Token'ı localStorage'a kaydetme
localStorage.setItem('authToken', response.data.token);

// Token'ı header'a ekleme
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
```

### Auth Context (React)
```javascript
const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('authToken'));

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    setUser(response.data.user);
    setToken(response.data.token);
    localStorage.setItem('authToken', response.data.token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

## Güvenlik Önerileri

1. **Çevre Değişkenleri**: JWT_SECRET güçlü ve gizli tutulmalı
2. **HTTPS**: Production'da mutlaka HTTPS kullanın
3. **Token Rotation**: Refresh token sistemini implementeye edin
4. **Rate Limiting**: Brute force saldırılarına karşı koruma
5. **Input Validation**: Tüm input'ları validate edin
6. **Logging**: Auth işlemlerini logLayın

## Test Örnekleri

```javascript
describe('Authentication', () => {
  test('should register a new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'TestPassword123'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeDefined();
  });

  test('should login existing user', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'TestPassword123'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

---

**Son Güncelleme**: `{new Date().toLocaleDateString('tr-TR')}` 