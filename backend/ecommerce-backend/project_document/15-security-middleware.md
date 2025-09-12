# Security Middleware Modülü

## Genel Bakış

Security Middleware modülü, uygulama güvenliğini sağlayan middleware'ler, kimlik doğrulama, yetkilendirme, rate limiting, güvenlik başlıkları ve çeşitli güvenlik önlemlerini yönetir.

## Dosya Yapısı

```
src/
├── middleware/
│   ├── auth.js                    # Kimlik doğrulama middleware
│   ├── authorization.js           # Yetkilendirme middleware
│   ├── rateLimit.js              # Rate limiting
│   ├── securityHeaders.js        # Güvenlik başlıkları
│   ├── inputValidation.js        # Input validasyonu
│   ├── cors.js                   # CORS yapılandırması
│   └── errorHandler.js           # Güvenli hata yönetimi
├── utils/
│   ├── encryption.js             # Şifreleme yardımcıları
│   ├── jwtUtils.js               # JWT yardımcıları
│   └── securityUtils.js          # Güvenlik yardımcıları
├── models/
│   ├── SecurityLog.js            # Güvenlik log modeli
│   └── BlacklistedToken.js       # Kara listedeki token'lar
└── services/
    ├── securityService.js        # Güvenlik servisi
    └── auditService.js           # Audit log servisi
```

## Security Features

### 🛡️ Güvenlik Özellikleri
- **JWT Authentication**: Token tabanlı kimlik doğrulama
- **Role-based Authorization**: Rol tabanlı yetkilendirme
- **Rate Limiting**: İstek sınırlama ve DDoS koruması
- **Input Validation**: Giriş verisi doğrulama
- **SQL Injection Protection**: SQL enjeksiyon koruması
- **XSS Protection**: Cross-site scripting koruması
- **CORS Configuration**: Cross-origin kaynak paylaşımı
- **Security Headers**: Güvenlik başlıkları
- **Audit Logging**: Güvenlik denetim logları
- **IP Filtering**: IP bazlı filtreleme

## SecurityLog Model Schema

```javascript
// models/SecurityLog.js
const securityLogSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'login_attempt', 'login_success', 'login_failure',
      'logout', 'password_change', 'account_locked',
      'suspicious_activity', 'rate_limit_exceeded',
      'unauthorized_access', 'permission_denied',
      'data_access', 'data_modification', 'admin_action'
    ],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true
  },
  email: String,
  ip: {
    type: String,
    required: true
  },
  userAgent: String,
  endpoint: String,
  method: String,
  statusCode: Number,
  details: {
    reason: String,
    resource: String,
    action: String,
    oldValues: mongoose.Schema.Types.Mixed,
    newValues: mongoose.Schema.Types.Mixed,
    failureReason: String,
    attemptCount: Number,
    location: {
      country: String,
      city: String,
      timezone: String
    }
  },
  metadata: {
    sessionId: String,
    requestId: String,
    correlationId: String,
    duration: Number, // ms
    source: String // 'web', 'api', 'mobile'
  },
  resolved: {
    type: Boolean,
    default: false
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true
  },
  resolvedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Indexes for performance
securityLogSchema.index({ type: 1, createdAt: -1 });
securityLogSchema.index({ severity: 1, resolved: 1 });
securityLogSchema.index({ user: 1, createdAt: -1 });
securityLogSchema.index({ ip: 1, createdAt: -1 });
securityLogSchema.index({ 'metadata.sessionId': 1 });

// TTL index for log retention (90 days)
securityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });
```

## BlacklistedToken Model Schema

```javascript
// models/BlacklistedToken.js
const blacklistedTokenSchema = new mongoose.Schema({
  tokenHash: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    enum: ['logout', 'password_change', 'account_suspended', 'security_breach', 'expired'],
    required: true
  },
  originalToken: String, // Sadece geliştirme ortamında
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // TTL index
  },
  blacklistedAt: {
    type: Date,
    default: Date.now
  },
  blacklistedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true
  },
  metadata: {
    ip: String,
    userAgent: String,
    sessionId: String
  }
});

// Compound index for faster lookups
blacklistedTokenSchema.index({ tokenHash: 1, expiresAt: 1 });
```

## Authentication Middleware

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const BlacklistedToken = require('../models/BlacklistedToken');
const SecurityLog = require('../models/SecurityLog');
const { createHash } = require('crypto');
const config = require('../config/environment');

const authMiddleware = {
  // JWT token doğrulama
  authenticateToken: async (req, res, next) => {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

      if (!token) {
        await authMiddleware.logSecurityEvent(req, 'unauthorized_access', {
          reason: 'No token provided'
        });
        return res.status(401).json({
          success: false,
          error: {
            message: 'Access token gerekli',
            code: 'NO_TOKEN'
          }
        });
      }

      // Token blacklist kontrolü
      const tokenHash = createHash('sha256').update(token).digest('hex');
      const blacklistedToken = await BlacklistedToken.findOne({ tokenHash });
      
      if (blacklistedToken) {
        await authMiddleware.logSecurityEvent(req, 'unauthorized_access', {
          reason: 'Blacklisted token used'
        });
        return res.status(401).json({
          success: false,
          error: {
            message: 'Token geçersiz',
            code: 'BLACKLISTED_TOKEN'
          }
        });
      }

      // Token doğrulama
      const decoded = jwt.verify(token, config.JWT_SECRET);
      
      // Kullanıcı kontrolü
      const user = await User.findById(decoded.userId).select('-password');
      if (!user) {
        await authMiddleware.logSecurityEvent(req, 'unauthorized_access', {
          reason: 'User not found',
          userId: decoded.userId
        });
        return res.status(401).json({
          success: false,
          error: {
            message: 'Kullanıcı bulunamadı',
            code: 'USER_NOT_FOUND'
          }
        });
      }

      // Kullanıcı aktif mi?
      if (!user.isActive) {
        await authMiddleware.logSecurityEvent(req, 'unauthorized_access', {
          reason: 'Inactive user',
          userId: user._id
        });
        return res.status(401).json({
          success: false,
          error: {
            message: 'Hesap devre dışı',
            code: 'ACCOUNT_INACTIVE'
          }
        });
      }

      // Request'e kullanıcı bilgilerini ekle
      req.user = user;
      req.token = token;
      req.tokenPayload = decoded;

      // Başarılı authentication log
      await authMiddleware.logSecurityEvent(req, 'data_access', {
        resource: req.path,
        action: req.method
      }, 'low');

      next();
    } catch (error) {
      let errorCode = 'INVALID_TOKEN';
      let message = 'Token geçersiz';

      if (error.name === 'TokenExpiredError') {
        errorCode = 'TOKEN_EXPIRED';
        message = 'Token süresi dolmuş';
      } else if (error.name === 'JsonWebTokenError') {
        errorCode = 'MALFORMED_TOKEN';
        message = 'Token formatı hatalı';
      }

      await authMiddleware.logSecurityEvent(req, 'unauthorized_access', {
        reason: error.message,
        errorType: error.name
      });

      return res.status(401).json({
        success: false,
        error: {
          message,
          code: errorCode
        }
      });
    }
  },

  // Opsiyonel authentication (kullanıcı yoksa da devam et)
  optionalAuth: async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next();
    }

    try {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
        req.token = token;
        req.tokenPayload = decoded;
      }
    } catch (error) {
      // Hata durumunda sessizce devam et
      console.warn('Optional auth failed:', error.message);
    }

    next();
  },

  // Admin rolü kontrolü
  requireAdmin: (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Kimlik doğrulama gerekli',
          code: 'AUTHENTICATION_REQUIRED'
        }
      });
    }

    if (req.user.role !== 'admin') {
      authMiddleware.logSecurityEvent(req, 'permission_denied', {
        reason: 'Admin access required',
        requiredRole: 'admin',
        userRole: req.user.role
      }, 'high');
      
      return res.status(403).json({
        success: false,
        error: {
          message: 'Admin yetkisi gerekli',
          code: 'INSUFFICIENT_PERMISSIONS'
        }
      });
    }

    next();
  },

  // Çoklu rol kontrolü
  requireRoles: (roles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Kimlik doğrulama gerekli',
            code: 'AUTHENTICATION_REQUIRED'
          }
        });
      }

      if (!roles.includes(req.user.role)) {
        authMiddleware.logSecurityEvent(req, 'permission_denied', {
          reason: 'Role access required',
          requiredRoles: roles,
          userRole: req.user.role
        }, 'high');
        
        return res.status(403).json({
          success: false,
          error: {
            message: 'Yeterli yetki yok',
            code: 'INSUFFICIENT_PERMISSIONS'
          }
        });
      }

      next();
    };
  },

  // Sadece kendi verilerine erişim
  requireOwnership: (resourceField = 'user') => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Kimlik doğrulama gerekli',
            code: 'AUTHENTICATION_REQUIRED'
          }
        });
      }

      // Admin her şeye erişebilir
      if (req.user.role === 'admin') {
        return next();
      }

      // URL'den kullanıcı ID'sini al
      const resourceUserId = req.params.userId || req.params.id;
      
      if (resourceUserId && resourceUserId !== req.user._id.toString()) {
        authMiddleware.logSecurityEvent(req, 'permission_denied', {
          reason: 'Ownership required',
          targetResource: resourceUserId,
          requestingUser: req.user._id
        }, 'high');
        
        return res.status(403).json({
          success: false,
          error: {
            message: 'Bu kaynağa erişim yetkiniz yok',
            code: 'RESOURCE_ACCESS_DENIED'
          }
        });
      }

      next();
    };
  },

  // Güvenlik olayını logla
  logSecurityEvent: async (req, type, details = {}, severity = 'medium') => {
    try {
      const securityLog = new SecurityLog({
        type,
        severity,
        user: req.user?._id || null,
        email: req.user?.email || req.body?.email || null,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        endpoint: req.path,
        method: req.method,
        statusCode: res?.statusCode,
        details,
        metadata: {
          sessionId: req.sessionID,
          requestId: req.id,
          source: req.get('X-Source') || 'web'
        }
      });

      await securityLog.save();
    } catch (error) {
      console.error('Security log failed:', error);
    }
  },

  // Token'ı blacklist'e ekle
  blacklistToken: async (token, userId, reason = 'logout') => {
    try {
      const tokenHash = createHash('sha256').update(token).digest('hex');
      const decoded = jwt.decode(token);
      
      const blacklistedToken = new BlacklistedToken({
        tokenHash,
        userId,
        reason,
        expiresAt: new Date(decoded.exp * 1000),
        metadata: {
          // metadata buraya eklenebilir
        }
      });

      await blacklistedToken.save();
    } catch (error) {
      console.error('Token blacklisting failed:', error);
    }
  }
};

module.exports = authMiddleware;
```

## Rate Limiting Middleware

```javascript
// middleware/rateLimit.js
const rateLimit = require('express-rate-limit');
const MongoStore = require('rate-limit-mongo');
const SecurityLog = require('../models/SecurityLog');
const config = require('../config/environment');

const rateLimitMiddleware = {
  // Genel rate limiting
  general: rateLimit({
    store: new MongoStore({
      uri: config.MONGODB_URI,
      collectionName: 'rate_limits',
      expireTimeMs: 15 * 60 * 1000 // 15 dakika
    }),
    windowMs: 15 * 60 * 1000, // 15 dakika
    max: 1000, // 15 dakikada maksimum 1000 istek
    message: {
      success: false,
      error: {
        message: 'Çok fazla istek gönderdiniz. Lütfen bekleyin.',
        code: 'RATE_LIMIT_EXCEEDED'
      }
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: async (req, res) => {
      await logRateLimitExceeded(req, 'general');
      res.status(429).json({
        success: false,
        error: {
          message: 'Çok fazla istek gönderdiniz. Lütfen bekleyin.',
          code: 'RATE_LIMIT_EXCEEDED'
        }
      });
    }
  }),

  // Login rate limiting
  login: rateLimit({
    store: new MongoStore({
      uri: config.MONGODB_URI,
      collectionName: 'login_rate_limits',
      expireTimeMs: 60 * 60 * 1000 // 1 saat
    }),
    windowMs: 60 * 60 * 1000, // 1 saat
    max: 5, // 1 saatte maksimum 5 başarısız login
    skipSuccessfulRequests: true,
    keyGenerator: (req) => {
      // IP ve email kombinasyonu
      return `${req.ip}_${req.body.email || 'no-email'}`;
    },
    handler: async (req, res) => {
      await logRateLimitExceeded(req, 'login');
      res.status(429).json({
        success: false,
        error: {
          message: 'Çok fazla başarısız giriş denemesi. 1 saat sonra tekrar deneyin.',
          code: 'LOGIN_RATE_LIMIT_EXCEEDED'
        }
      });
    }
  }),

  // API rate limiting
  api: rateLimit({
    store: new MongoStore({
      uri: config.MONGODB_URI,
      collectionName: 'api_rate_limits',
      expireTimeMs: 60 * 60 * 1000 // 1 saat
    }),
    windowMs: 60 * 60 * 1000, // 1 saat
    max: 10000, // 1 saatte maksimum 10000 API isteği
    keyGenerator: (req) => {
      return req.user?._id?.toString() || req.ip;
    },
    handler: async (req, res) => {
      await logRateLimitExceeded(req, 'api');
      res.status(429).json({
        success: false,
        error: {
          message: 'API rate limit aşıldı. Lütfen bekleyin.',
          code: 'API_RATE_LIMIT_EXCEEDED'
        }
      });
    }
  }),

  // Admin işlemleri için rate limiting
  admin: rateLimit({
    windowMs: 5 * 60 * 1000, // 5 dakika
    max: 100, // 5 dakikada maksimum 100 admin işlemi
    keyGenerator: (req) => {
      return req.user?._id?.toString() || req.ip;
    },
    handler: async (req, res) => {
      await logRateLimitExceeded(req, 'admin');
      res.status(429).json({
        success: false,
        error: {
          message: 'Admin işlemlerinde rate limit aşıldı.',
          code: 'ADMIN_RATE_LIMIT_EXCEEDED'
        }
      });
    }
  }),

  // Şifre sıfırlama rate limiting
  passwordReset: rateLimit({
    store: new MongoStore({
      uri: config.MONGODB_URI,
      collectionName: 'password_reset_limits',
      expireTimeMs: 24 * 60 * 60 * 1000 // 24 saat
    }),
    windowMs: 24 * 60 * 60 * 1000, // 24 saat
    max: 3, // 24 saatte maksimum 3 şifre sıfırlama
    keyGenerator: (req) => {
      return req.body.email || req.ip;
    },
    handler: async (req, res) => {
      await logRateLimitExceeded(req, 'password_reset');
      res.status(429).json({
        success: false,
        error: {
          message: 'Çok fazla şifre sıfırlama talebi. 24 saat sonra tekrar deneyin.',
          code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED'
        }
      });
    }
  })
};

// Rate limit aşımını logla
async function logRateLimitExceeded(req, type) {
  try {
    const securityLog = new SecurityLog({
      type: 'rate_limit_exceeded',
      severity: 'medium',
      user: req.user?._id || null,
      email: req.body?.email || null,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.path,
      method: req.method,
      details: {
        rateLimitType: type,
        attemptCount: req.rateLimit?.current || 0,
        limit: req.rateLimit?.limit || 0
      }
    });

    await securityLog.save();
  } catch (error) {
    console.error('Rate limit log failed:', error);
  }
}

module.exports = rateLimitMiddleware;
```

## Security Headers Middleware

```javascript
// middleware/securityHeaders.js
const helmet = require('helmet');
const config = require('../config/environment');

const securityHeaders = {
  // Helmet ile temel güvenlik başlıkları
  helmet: helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000, // 1 yıl
      includeSubDomains: true,
      preload: true
    }
  }),

  // Özel güvenlik başlıkları
  customHeaders: (req, res, next) => {
    // X-Request-ID
    const requestId = req.id || require('crypto').randomUUID();
    res.setHeader('X-Request-ID', requestId);

    // X-Response-Time
    const startTime = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      res.setHeader('X-Response-Time', `${duration}ms`);
    });

    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // API versioning
    res.setHeader('X-API-Version', config.API_VERSION || '1.0.0');

    // Rate limit info
    if (req.rateLimit) {
      res.setHeader('X-RateLimit-Limit', req.rateLimit.limit);
      res.setHeader('X-RateLimit-Remaining', req.rateLimit.remaining);
      res.setHeader('X-RateLimit-Reset', new Date(Date.now() + req.rateLimit.resetTime));
    }

    next();
  },

  // CORS konfigürasyonu
  cors: (req, res, next) => {
    const allowedOrigins = config.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
    const origin = req.headers.origin;

    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 saat

    // Preflight request
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    next();
  }
};

module.exports = securityHeaders;
```

## Input Validation Middleware

```javascript
// middleware/inputValidation.js
const { body, param, query, validationResult } = require('express-validator');
const xss = require('xss');
const SecurityLog = require('../models/SecurityLog');

const inputValidation = {
  // Validation sonuçlarını kontrol et
  checkValidation: async (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      // Validation hatalarını logla
      await logValidationError(req, errors.array());
      
      return res.status(400).json({
        success: false,
        error: {
          message: 'Girilen veriler geçersiz',
          code: 'VALIDATION_ERROR',
          details: errors.array().map(error => ({
            field: error.path,
            message: error.msg,
            value: error.value
          }))
        }
      });
    }
    
    next();
  },

  // XSS temizleme
  sanitizeInput: (req, res, next) => {
    const sanitizeObject = (obj) => {
      for (const key in obj) {
        if (typeof obj[key] === 'string') {
          obj[key] = xss(obj[key], {
            whiteList: {}, // Hiçbir HTML tag'ine izin verme
            stripIgnoreTag: true,
            stripIgnoreTagBody: ['script']
          });
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        }
      }
    };

    // Request body'yi temizle
    if (req.body) {
      sanitizeObject(req.body);
    }

    // Query parameters'ı temizle
    if (req.query) {
      sanitizeObject(req.query);
    }

    next();
  },

  // SQL injection koruması
  preventSQLInjection: (req, res, next) => {
    const sqlInjectionPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
      /((\%27)|(\'))\s*((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
      /((\%27)|(\'))\s*((\%55)|u|(\%55))((\%4E)|n|(\%4E))((\%49)|i|(\%49))((\%4F)|o|(\%4F))((\%4E)|n|(\%4E))/i,
      /((\%3D)|(=))[^\n]*((\%27)|(\')|((\%3B)|;))/i
    ];

    const checkForSQLInjection = (obj, path = '') => {
      for (const key in obj) {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (typeof obj[key] === 'string') {
          for (const pattern of sqlInjectionPatterns) {
            if (pattern.test(obj[key])) {
              logSQLInjectionAttempt(req, currentPath, obj[key]);
              return true;
            }
          }
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          if (checkForSQLInjection(obj[key], currentPath)) {
            return true;
          }
        }
      }
      return false;
    };

    // Body ve query'yi kontrol et
    const hasSQLInjection = 
      (req.body && checkForSQLInjection(req.body, 'body')) ||
      (req.query && checkForSQLInjection(req.query, 'query'));

    if (hasSQLInjection) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Güvenlik nedeniyle istek reddedildi',
          code: 'SECURITY_VIOLATION'
        }
      });
    }

    next();
  },

  // Dosya upload güvenliği
  validateFileUpload: (allowedTypes = [], maxSize = 5 * 1024 * 1024) => {
    return (req, res, next) => {
      if (!req.files || Object.keys(req.files).length === 0) {
        return next();
      }

      const files = Array.isArray(req.files) ? req.files : Object.values(req.files);
      
      for (const file of files) {
        // Dosya boyutu kontrolü
        if (file.size > maxSize) {
          return res.status(400).json({
            success: false,
            error: {
              message: `Dosya boyutu çok büyük. Maksimum ${maxSize / (1024 * 1024)}MB`,
              code: 'FILE_TOO_LARGE'
            }
          });
        }

        // Dosya türü kontrolü
        if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
          return res.status(400).json({
            success: false,
            error: {
              message: 'Desteklenmeyen dosya türü',
              code: 'INVALID_FILE_TYPE'
            }
          });
        }

        // Dosya uzantısı kontrolü
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx'];
        const fileExtension = path.extname(file.name).toLowerCase();
        
        if (!allowedExtensions.includes(fileExtension)) {
          return res.status(400).json({
            success: false,
            error: {
              message: 'Desteklenmeyen dosya uzantısı',
              code: 'INVALID_FILE_EXTENSION'
            }
          });
        }
      }

      next();
    };
  }
};

// Validation hatalarını logla
async function logValidationError(req, errors) {
  try {
    const securityLog = new SecurityLog({
      type: 'suspicious_activity',
      severity: 'low',
      user: req.user?._id || null,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.path,
      method: req.method,
      details: {
        reason: 'Validation failed',
        errors: errors.map(err => ({
          field: err.path,
          message: err.msg,
          value: err.value
        }))
      }
    });

    await securityLog.save();
  } catch (error) {
    console.error('Validation error log failed:', error);
  }
}

// SQL injection denemesini logla
async function logSQLInjectionAttempt(req, field, value) {
  try {
    const securityLog = new SecurityLog({
      type: 'suspicious_activity',
      severity: 'high',
      user: req.user?._id || null,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.path,
      method: req.method,
      details: {
        reason: 'SQL injection attempt detected',
        field,
        suspiciousValue: value.substring(0, 100) // İlk 100 karakter
      }
    });

    await securityLog.save();
  } catch (error) {
    console.error('SQL injection log failed:', error);
  }
}

module.exports = inputValidation;
```

## Security Service

```javascript
// services/securityService.js
const SecurityLog = require('../models/SecurityLog');
const BlacklistedToken = require('../models/BlacklistedToken');
const User = require('../models/User');
const emailService = require('./emailService');

class SecurityService {
  constructor() {
    this.suspiciousActivityThreshold = 5; // 5 dakikada 10 şüpheli aktivite
    this.bruteForceThreshold = 5; // 5 başarısız login denemesi
  }

  async analyzeSecurityThreats() {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    try {
      // Son 5 dakikadaki güvenlik olayları
      const recentLogs = await SecurityLog.find({
        createdAt: { $gte: fiveMinutesAgo },
        severity: { $in: ['high', 'critical'] }
      });

      // IP bazlı analiz
      const ipStats = {};
      recentLogs.forEach(log => {
        if (!ipStats[log.ip]) {
          ipStats[log.ip] = { count: 0, events: [] };
        }
        ipStats[log.ip].count++;
        ipStats[log.ip].events.push(log);
      });

      // Şüpheli IP'leri tespit et
      const suspiciousIPs = Object.entries(ipStats)
        .filter(([ip, stats]) => stats.count >= this.suspiciousActivityThreshold)
        .map(([ip, stats]) => ({ ip, ...stats }));

      if (suspiciousIPs.length > 0) {
        await this.handleSuspiciousIPs(suspiciousIPs);
      }

      // Brute force saldırılarını tespit et
      await this.detectBruteForceAttacks();

      return {
        suspiciousIPs: suspiciousIPs.length,
        recentHighSeverityEvents: recentLogs.length
      };
    } catch (error) {
      console.error('Security threat analysis failed:', error);
      throw error;
    }
  }

  async detectBruteForceAttacks() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    // Son 1 saatteki başarısız login denemeleri
    const failedLogins = await SecurityLog.aggregate([
      {
        $match: {
          type: 'login_failure',
          createdAt: { $gte: oneHourAgo }
        }
      },
      {
        $group: {
          _id: { ip: '$ip', email: '$email' },
          attempts: { $sum: 1 },
          lastAttempt: { $max: '$createdAt' }
        }
      },
      {
        $match: {
          attempts: { $gte: this.bruteForceThreshold }
        }
      }
    ]);

    for (const attack of failedLogins) {
      await this.handleBruteForceAttack(attack);
    }
  }

  async handleSuspiciousIPs(suspiciousIPs) {
    for (const ipData of suspiciousIPs) {
      // Critical log oluştur
      const securityLog = new SecurityLog({
        type: 'suspicious_activity',
        severity: 'critical',
        ip: ipData.ip,
        details: {
          reason: 'High frequency suspicious activity',
          eventCount: ipData.count,
          timeWindow: '5 minutes'
        }
      });

      await securityLog.save();

      // Admin'leri bilgilendir
      await this.notifyAdmins('suspicious_ip', {
        ip: ipData.ip,
        eventCount: ipData.count,
        events: ipData.events
      });
    }
  }

  async handleBruteForceAttack(attack) {
    const { ip, email } = attack._id;
    
    // Critical log oluştur
    const securityLog = new SecurityLog({
      type: 'suspicious_activity',
      severity: 'critical',
      ip,
      email,
      details: {
        reason: 'Brute force attack detected',
        attempts: attack.attempts,
        timeWindow: '1 hour'
      }
    });

    await securityLog.save();

    // Hesabı geçici olarak kilitle
    if (email) {
      await this.temporarilyLockAccount(email, 'brute_force_protection');
    }

    // Admin'leri bilgilendir
    await this.notifyAdmins('brute_force', {
      ip,
      email,
      attempts: attack.attempts
    });
  }

  async temporarilyLockAccount(email, reason) {
    try {
      const user = await User.findOne({ email });
      if (user) {
        user.security = user.security || {};
        user.security.isLocked = true;
        user.security.lockReason = reason;
        user.security.lockedAt = new Date();
        user.security.unlockAt = new Date(Date.now() + 60 * 60 * 1000); // 1 saat

        await user.save();

        // Kullanıcıya email gönder
        await emailService.sendSecurityAlert(user, {
          type: 'account_locked',
          reason,
          unlockAt: user.security.unlockAt
        });
      }
    } catch (error) {
      console.error('Account locking failed:', error);
    }
  }

  async notifyAdmins(alertType, data) {
    try {
      const admins = await User.find({ role: 'admin', isActive: true });
      
      for (const admin of admins) {
        await emailService.sendSecurityAlert(admin, {
          type: alertType,
          ...data
        });
      }
    } catch (error) {
      console.error('Admin notification failed:', error);
    }
  }

  async getSecurityDashboard(dateRange) {
    const { startDate, endDate } = dateRange;
    
    try {
      // Güvenlik olayları özeti
      const securitySummary = await SecurityLog.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: { type: '$type', severity: '$severity' },
            count: { $sum: 1 }
          }
        }
      ]);

      // En sık şüpheli aktivite gösteren IP'ler
      const topSuspiciousIPs = await SecurityLog.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            severity: { $in: ['high', 'critical'] }
          }
        },
        {
          $group: {
            _id: '$ip',
            count: { $sum: 1 },
            lastActivity: { $max: '$createdAt' },
            events: { $push: '$type' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);

      // Günlük güvenlik trendleri
      const dailyTrends = await SecurityLog.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              date: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$createdAt'
                }
              },
              severity: '$severity'
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.date': 1 } }
      ]);

      return {
        summary: securitySummary,
        topSuspiciousIPs,
        dailyTrends,
        totalEvents: await SecurityLog.countDocuments({
          createdAt: { $gte: startDate, $lte: endDate }
        })
      };
    } catch (error) {
      throw new Error(`Security dashboard failed: ${error.message}`);
    }
  }

  async cleanupExpiredTokens() {
    try {
      const now = new Date();
      const result = await BlacklistedToken.deleteMany({
        expiresAt: { $lt: now }
      });
      
      console.log(`Cleaned up ${result.deletedCount} expired tokens`);
      return result.deletedCount;
    } catch (error) {
      console.error('Token cleanup failed:', error);
      throw error;
    }
  }

  async startSecurityMonitoring() {
    // Her 5 dakikada bir güvenlik analizi
    setInterval(async () => {
      try {
        await this.analyzeSecurityThreats();
      } catch (error) {
        console.error('Security monitoring failed:', error);
      }
    }, 5 * 60 * 1000);

    // Her gün expired token'ları temizle
    setInterval(async () => {
      try {
        await this.cleanupExpiredTokens();
      } catch (error) {
        console.error('Token cleanup failed:', error);
      }
    }, 24 * 60 * 60 * 1000);

    console.log('Security monitoring started');
  }
}

module.exports = new SecurityService();
```

## API Endpoints

### GET `/api/security/logs`
Güvenlik loglarını getirir (Admin).

**Query Parameters:**
- `page`: Sayfa numarası
- `limit`: Sayfa başına log
- `severity`: Önem derecesi filtresi
- `type`: Log türü filtresi
- `startDate`: Başlangıç tarihi
- `endDate`: Bitiş tarihi

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "64f8a123456789abcdef",
        "type": "login_failure",
        "severity": "medium",
        "ip": "192.168.1.1",
        "email": "user@example.com",
        "details": {
          "reason": "Invalid password",
          "attemptCount": 3
        },
        "createdAt": "2023-10-01T10:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalLogs": 500
    }
  }
}
```

### GET `/api/security/dashboard`
Güvenlik dashboard'u (Admin).

### POST `/api/security/blacklist-token`
Token'ı blacklist'e ekler (Admin).

### GET `/api/security/suspicious-activities`
Şüpheli aktiviteleri listeler (Admin).

## Frontend Security Integration

### Security Hook (React)
```javascript
import { useEffect, useCallback } from 'react';

export const useSecurity = () => {
  const reportSecurityEvent = useCallback(async (eventType, details) => {
    try {
      await fetch('/api/security/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          type: eventType,
          details,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.warn('Security event reporting failed:', error);
    }
  }, []);

  const checkPasswordStrength = useCallback((password) => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /\d/.test(password),
      symbols: /[!@#$%^&*]/.test(password)
    };

    const score = Object.values(checks).filter(Boolean).length;
    
    return {
      score,
      strength: score < 3 ? 'weak' : score < 4 ? 'medium' : 'strong',
      checks
    };
  }, []);

  const validateInput = useCallback((input, type = 'text') => {
    // XSS kontrolü
    const xssPattern = /<script|javascript:|on\w+\s*=/i;
    if (xssPattern.test(input)) {
      reportSecurityEvent('xss_attempt', { input: input.substring(0, 100) });
      return { valid: false, reason: 'Güvenlik nedeniyle reddedildi' };
    }

    // SQL injection kontrolü
    const sqlPattern = /(union|select|insert|update|delete|drop|create|alter)/i;
    if (sqlPattern.test(input)) {
      reportSecurityEvent('sql_injection_attempt', { input: input.substring(0, 100) });
      return { valid: false, reason: 'Güvenlik nedeniyle reddedildi' };
    }

    return { valid: true };
  }, [reportSecurityEvent]);

  return {
    reportSecurityEvent,
    checkPasswordStrength,
    validateInput
  };
};
```

## Test Examples

```javascript
describe('Security Middleware', () => {
  test('should authenticate valid JWT token', async () => {
    const token = jwt.sign({ userId: user._id }, config.JWT_SECRET);
    
    const response = await request(app)
      .get('/api/user/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
  });

  test('should reject blacklisted token', async () => {
    const token = jwt.sign({ userId: user._id }, config.JWT_SECRET);
    
    // Token'ı blacklist'e ekle
    await authMiddleware.blacklistToken(token, user._id, 'test');
    
    const response = await request(app)
      .get('/api/user/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('BLACKLISTED_TOKEN');
  });

  test('should enforce rate limiting', async () => {
    // Rate limit'i aş
    for (let i = 0; i < 6; i++) {
      await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrong' });
    }

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'wrong' });

    expect(response.status).toBe(429);
  });

  test('should detect SQL injection attempt', async () => {
    const response = await request(app)
      .get('/api/products?search=\' OR 1=1--');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('SECURITY_VIOLATION');
  });
});
```

---

**Son Güncelleme**: `{new Date().toLocaleDateString('tr-TR')}` 