const logger = require('../logger/logger');

/**
 * SSL/HTTPS zorunluluğu middleware
 * Production ortamında HTTPS kullanımını zorunlu kılar
 */
const requireSSL = (req, res, next) => {
  // Development ortamında SSL kontrolü yapma
  if (process.env.NODE_ENV === 'development') {
    return next();
  }

  // Production ortamında HTTPS kontrolü
  if (process.env.NODE_ENV === 'production') {
    // X-Forwarded-Proto header'ı (proxy arkasında çalışırken)
    const isSecure = req.secure || 
                     req.headers['x-forwarded-proto'] === 'https' ||
                     req.headers['x-forwarded-ssl'] === 'on';

    if (!isSecure) {
      logger.warn(`Non-HTTPS request blocked: ${req.method} ${req.originalUrl} from ${req.ip}`);
      
      return res.status(403).json({
        success: false,
        error: {
          code: 'SSL_REQUIRED',
          message: 'Bu endpoint için HTTPS bağlantısı zorunludur'
        }
      });
    }
  }

  next();
};

/**
 * Güvenli header'ları ekle
 */
const addSecurityHeaders = (req, res, next) => {
  // HSTS (HTTP Strict Transport Security)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:;");
  
  // X-Content-Type-Options
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // X-Frame-Options
  res.setHeader('X-Frame-Options', 'DENY');
  
  // X-XSS-Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  next();
};

/**
 * Güvenli cookie ayarları
 */
const secureCookies = (req, res, next) => {
  // Production ortamında secure cookie ayarları
  if (process.env.NODE_ENV === 'production') {
    res.cookie('secure', true, {
      secure: true,
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 saat
    });
  }

  next();
};

/**
 * Rate limiting için SSL kontrolü
 */
const sslRateLimit = (req, res, next) => {
  // SSL bağlantısı olmayan istekler için daha sıkı rate limiting
  const isSecure = req.secure || 
                   req.headers['x-forwarded-proto'] === 'https' ||
                   req.headers['x-forwarded-ssl'] === 'on';

  if (!isSecure && process.env.NODE_ENV === 'production') {
    // Non-HTTPS istekler için daha sıkı limit
    req.sslRateLimit = true;
  }

  next();
};

module.exports = {
  requireSSL,
  addSecurityHeaders,
  secureCookies,
  sslRateLimit
}; 