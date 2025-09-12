const rateLimit = require('express-rate-limit');
const logger = require('../logger/logger');

// API rate limiter
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 15 dakika
  max: 100, // IP başına maksimum istek
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Çok fazla istek gönderdiniz. Lütfen 15 dakika sonra tekrar deneyin.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(`API rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json(options.message);
  }
});

// Registration rate limiter
const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 saat
  max: 5, // IP başına maksimum kayıt denemesi
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Çok fazla kayıt denemesi. Lütfen 1 saat sonra tekrar deneyin.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(`Registration rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json(options.message);
  }
});

// Auth rate limiter
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 saat
  max: 5, // IP başına maksimum başarısız giriş denemesi
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Çok fazla başarısız giriş denemesi. Lütfen 1 saat sonra tekrar deneyin.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json(options.message);
  }
});

// Password reset rate limiter
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 saat
  max: 3, // IP başına maksimum şifre sıfırlama denemesi
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Çok fazla şifre sıfırlama denemesi. Lütfen 1 saat sonra tekrar deneyin.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(`Password reset rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json(options.message);
  }
});

// Email verification rate limiter
const emailVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 saat
  max: 3, // IP başına maksimum email doğrulama denemesi
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Çok fazla email doğrulama denemesi. Lütfen 1 saat sonra tekrar deneyin.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(`Email verification rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json(options.message);
  }
});

const isDev = process.env.NODE_ENV === 'development';
const noop = (req, res, next) => next();

module.exports = {
  apiLimiter: isDev ? noop : apiLimiter,
  registrationLimiter: isDev ? noop : registrationLimiter,
  authLimiter: isDev ? noop : authLimiter,
  passwordResetLimiter: isDev ? noop : passwordResetLimiter,
  emailVerificationLimiter: isDev ? noop : emailVerificationLimiter
}; 