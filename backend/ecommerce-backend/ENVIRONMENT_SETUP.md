# 🔧 Environment Variable Setup

Bu döküman Phase 1 tamamlandıktan sonra gerekli olan environment variable'ları açıklar.

## 📋 Gerekli Environment Variables

`.env` dosyası oluşturun ve aşağıdaki değişkenleri ekleyin:

```env
# Server Configuration
PORT=3000
NODE_ENV=development
DEBUG=true
VERBOSE_LOGGING=true

# Database Configuration
MONGO_URI=mongodb://localhost:27017/elektrotech

# JWT Configuration
JWT_SECRET=example-jwt-secret
JWT_REFRESH_SECRET=example-refresh-secret
JWT_EXPIRE=1h
JWT_REFRESH_EXPIRE=7d

# Email Configuration (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=example@gmail.com
EMAIL_PASS=example-app-password
EMAIL_FROM=noreply@elektrotech.com

# Frontend Configuration
FRONTEND_URL=http://localhost:3000

# Rate Limiting Configuration (optional - comma separated IPs)
RATE_LIMIT_WHITELIST=127.0.0.1,::1

# PayTR Configuration
PAYTR_MERCHANT_ID=example-paytr-merchant-id
PAYTR_MERCHANT_KEY=example-paytr-merchant-key
PAYTR_MERCHANT_SALT=example-paytr-merchant-salt
PAYTR_TEST_MODE=true
PAYTR_TIMEOUT_LIMIT=30
PAYTR_MAX_INSTALLMENT=12

# BasitKargo Configuration
BASITKARGO_API_KEY=example-basitkargo-api-key
BASITKARGO_USERNAME=example-basitkargo-username
BASITKARGO_PASSWORD=example-basitkargo-password
BASITKARGO_TEST_MODE=true
BASITKARGO_WEBHOOK_URL=https://your-domain.com/api/shipping/webhook

# File Upload Configuration
MAX_FILE_SIZE=10mb
UPLOAD_DIR=uploads

# Security Configuration
BCRYPT_ROUNDS=12

# Logging Configuration
LOG_LEVEL=info
LOG_FORMAT=combined

# Application Configuration
APP_NAME=ElektroTech E-Commerce API
APP_VERSION=1.0.0

# Session Configuration
SESSION_SECRET=example-session-secret

# CORS Configuration (comma separated origins)
CORS_ORIGINS=http://localhost:3000,https://your-frontend-domain.com

# Redis Configuration (for future use)
# REDIS_URL=redis://localhost:6379
# REDIS_PASSWORD=your-redis-password

# Monitoring Configuration (optional)
# SENTRY_DSN=your-sentry-dsn

# EDM (EDoksis) e-Fatura/e-Arşiv Configuration
EDM_ENDPOINT=https://test.edm.endpoint/soap
EDM_WSDL_URL=https://test.edm.endpoint/wsdl
EDM_USERNAME=example-edm-username
EDM_PASSWORD=example-edm-password
EDM_VKN=1111111111
EDM_TEST_MODE=true
# Opsiyonel TLS
# EDM_CERT_PATH=/path/to/cert.p12
# EDM_CERT_PASSWORD=changeit
```

## ⚙️ Zorunlu Konfigürasyonlar

### 🔑 JWT Keys
Güvenli rastgele string'ler oluşturun:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 📧 Email Konfigürasyonu
Gmail kullanıyorsanız:
1. Google hesabınızda 2-factor authentication açın
2. App password oluşturun
3. Bu password'u `EMAIL_PASS` olarak kullanın

### 🗄️ MongoDB
MongoDB kurulumu:
```bash
# MongoDB Community Edition kurulumu
# Windows: MongoDB Compass ile GUI
# Mac: brew install mongodb-community
# Linux: apt install mongodb / yum install mongodb
```

## 🚀 Kurulum Adımları

1. Proje klonlandıktan sonra:
```bash
cd ecommerce-backend
npm install
```

2. `.env` dosyası oluşturun ve yukarıdaki template'i doldurun

3. MongoDB'yi başlatın:
```bash
# Linux/Mac
mongod

# Windows (Service olarak)
net start MongoDB
```

4. Serveri başlatın:
```bash
npm run dev
```

## 🔐 Güvenlik Notları

- Production ortamında `NODE_ENV=production` ayarlayın
- JWT secret'ları en az 32 karakter olmalı
- Email şifrelerini asla commit etmeyin
- `.env` dosyasını `.gitignore`'a ekleyin

## 📧 Email Konfigürasyon Örnekleri

### Gmail
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-char-app-password
```

### Outlook
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
```

### SendGrid
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
```

## 🛠️ Development vs Production

### Development
```env
NODE_ENV=development
DEBUG=true
VERBOSE_LOGGING=true
PAYTR_TEST_MODE=true
BASITKARGO_TEST_MODE=true
```

### Production
```env
NODE_ENV=production
DEBUG=false
VERBOSE_LOGGING=false
PAYTR_TEST_MODE=false
BASITKARGO_TEST_MODE=false
``` 