// src/config/environment.js
require('dotenv').config();

// Validate required environment variables
const requiredEnvVars = [
  'MONGO_URI',
  'JWT_SECRET',
  'PORT'
];

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    console.error(`Error: ${envVar} environment variable is required`);
    process.exit(1);
  }
});

module.exports = {
  // Server Configuration
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  TEST_MODE: process.env.TEST_MODE === 'true',

  // Database Configuration
  MONGO_URI: process.env.MONGO_URI,

  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
  JWT_EXPIRE: process.env.JWT_EXPIRE || '1h',
  JWT_REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE || '7d',

  // Email Configuration
  EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
  EMAIL_PORT: process.env.EMAIL_PORT || 587,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  EMAIL_FROM: process.env.EMAIL_FROM || process.env.EMAIL_USER,

  // Frontend Configuration
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Rate Limiting Configuration
  RATE_LIMIT_WHITELIST: process.env.RATE_LIMIT_WHITELIST,

  // PayTR Configuration (existing)
  PAYTR_MERCHANT_ID: process.env.PAYTR_MERCHANT_ID,
  PAYTR_MERCHANT_KEY: process.env.PAYTR_MERCHANT_KEY,
  PAYTR_MERCHANT_SALT: process.env.PAYTR_MERCHANT_SALT,
  PAYTR_TEST_MODE: process.env.PAYTR_TEST_MODE === 'true',
  PAYTR_TIMEOUT_LIMIT: process.env.PAYTR_TIMEOUT_LIMIT || 30,
  PAYTR_MAX_INSTALLMENT: process.env.PAYTR_MAX_INSTALLMENT || 12,

  // Shipping Configuration
  FREE_SHIPPING_LIMIT: parseFloat(process.env.FREE_SHIPPING_LIMIT) || 200,
  STANDARD_SHIPPING_COST: parseFloat(process.env.STANDARD_SHIPPING_COST) || 25,

  // BasitKargo Configuration
  BASITKARGO_API_KEY: process.env.BASITKARGO_API_KEY,
  BASITKARGO_USERNAME: process.env.BASITKARGO_USERNAME,
  BASITKARGO_PASSWORD: process.env.BASITKARGO_PASSWORD,
  BASITKARGO_BASE_URL: process.env.BASITKARGO_BASE_URL || 'https://api.basitkargo.com/v1',
  BASITKARGO_TEST_MODE: process.env.BASITKARGO_TEST_MODE === 'true',
  BASITKARGO_WEBHOOK_URL: process.env.BASITKARGO_WEBHOOK_URL,

  // File Upload Configuration
  MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || '10mb',
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',

  // Security Configuration
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 12,
  
  // Logging Configuration
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FORMAT: process.env.LOG_FORMAT || 'combined',

  // Application Configuration
  APP_NAME: process.env.APP_NAME || 'ElektroTech E-Commerce API',
  APP_VERSION: process.env.npm_package_version || '1.0.0',
  
  // Session Configuration
  SESSION_SECRET: process.env.SESSION_SECRET || process.env.JWT_SECRET,
  
  // CORS Configuration
  CORS_ORIGINS: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000'],
  
  // Redis Configuration (for future use)
  REDIS_URL: process.env.REDIS_URL,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  
  // Monitoring Configuration
  SENTRY_DSN: process.env.SENTRY_DSN,
  
  // Development Configuration
  DEBUG: process.env.DEBUG === 'true',
  VERBOSE_LOGGING: process.env.VERBOSE_LOGGING === 'true'
};