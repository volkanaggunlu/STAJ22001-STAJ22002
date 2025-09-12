# Database & Configuration Modülü

## Genel Bakış

Database & Configuration modülü, MongoDB veritabanı bağlantısı, Redis cache konfigürasyonu, environment variables yönetimi ve sistem konfigürasyonlarını içerir.

## Dosya Yapısı

```
src/
├── config/
│   ├── db.js              # MongoDB bağlantısı
│   ├── environment.js     # Environment konfigürasyonu
│   ├── cors.js           # CORS ayarları
│   ├── jwt.js            # JWT konfigürasyonu
│   └── paytr.js          # PayTR konfigürasyonu
├── services/
│   └── cacheService.js   # Redis cache servisi
└── logger/
    └── logger.js         # Winston logger konfigürasyonu
```

## MongoDB Configuration

### Database Connection
```javascript
// config/db.js
const mongoose = require('mongoose');
const logger = require('../logger/logger');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    const options = {
      // Modern MongoDB driver options
      useNewUrlParser: true,
      useUnifiedTopology: true,
      
      // Connection pool settings
      maxPoolSize: 10, // Maximum number of connections
      minPoolSize: 5,  // Minimum number of connections
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      
      // Buffer settings
      bufferMaxEntries: 0, // Disable mongoose buffering
      bufferCommands: false, // Disable mongoose buffering
      
      // Write concern
      writeConcern: {
        w: 'majority',
        j: true,
        wtimeout: 1000
      },
      
      // Read preference
      readPreference: 'primary',
      
      // Auth settings
      authSource: 'admin',
      
      // SSL settings for production
      ssl: process.env.NODE_ENV === 'production',
      sslValidate: process.env.NODE_ENV === 'production'
    };

    const conn = await mongoose.connect(mongoURI, options);
    
    logger.info(`MongoDB Connected: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);
    
    // Connection event listeners
    mongoose.connection.on('connected', () => {
      logger.info('Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('Mongoose disconnected from MongoDB');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed through app termination');
        process.exit(0);
      } catch (error) {
        logger.error('Error during MongoDB connection closure:', error);
        process.exit(1);
      }
    });

  } catch (error) {
    logger.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
```

### Database Indexes

```javascript
// scripts/createIndexes.js
const mongoose = require('mongoose');
const logger = require('../src/logger/logger');

const createIndexes = async () => {
  try {
    // User indexes
    await mongoose.connection.db.collection('users').createIndexes([
      { key: { email: 1 }, unique: true, background: true },
      { key: { phone: 1 }, sparse: true, background: true },
      { key: { role: 1 }, background: true },
      { key: { createdAt: -1 }, background: true },
      { key: { isActive: 1, role: 1 }, background: true }
    ]);

    // Product indexes
    await mongoose.connection.db.collection('products').createIndexes([
      { key: { name: 'text', description: 'text', tags: 'text' }, background: true },
      { key: { slug: 1 }, unique: true, background: true },
      { key: { sku: 1 }, unique: true, background: true },
      { key: { category: 1, isActive: 1 }, background: true },
      { key: { price: 1 }, background: true },
      { key: { 'ratings.average': -1 }, background: true },
      { key: { createdAt: -1 }, background: true },
      { key: { isFeatured: 1, isActive: 1 }, background: true },
      { key: { 'stock.available': 1 }, background: true }
    ]);

    // Order indexes
    await mongoose.connection.db.collection('orders').createIndexes([
      { key: { orderNumber: 1 }, unique: true, background: true },
      { key: { user: 1, createdAt: -1 }, background: true },
      { key: { status: 1 }, background: true },
      { key: { 'payment.status': 1 }, background: true },
      { key: { createdAt: -1 }, background: true },
      { key: { 'items.product': 1 }, background: true }
    ]);

    // Cart indexes
    await mongoose.connection.db.collection('carts').createIndexes([
      { key: { user: 1 }, unique: true, background: true },
      { key: { expiresAt: 1 }, expireAfterSeconds: 0, background: true },
      { key: { 'items.product': 1 }, background: true }
    ]);

    // Category indexes
    await mongoose.connection.db.collection('categories').createIndexes([
      { key: { slug: 1 }, unique: true, background: true },
      { key: { parent: 1 }, sparse: true, background: true },
      { key: { isActive: 1 }, background: true },
      { key: { order: 1 }, background: true }
    ]);

    // Review indexes
    await mongoose.connection.db.collection('reviews').createIndexes([
      { key: { product: 1, createdAt: -1 }, background: true },
      { key: { user: 1, product: 1 }, unique: true, background: true },
      { key: { rating: 1 }, background: true },
      { key: { isApproved: 1 }, background: true }
    ]);

    // Coupon indexes
    await mongoose.connection.db.collection('coupons').createIndexes([
      { key: { code: 1 }, unique: true, background: true },
      { key: { expiresAt: 1 }, background: true },
      { key: { isActive: 1 }, background: true },
      { key: { type: 1 }, background: true }
    ]);

    logger.info('All database indexes created successfully');
  } catch (error) {
    logger.error('Error creating indexes:', error);
  }
};

module.exports = createIndexes;
```

## Redis Configuration

### Redis Connection
```javascript
// services/cacheService.js
const Redis = require('ioredis');
const logger = require('../logger/logger');

class CacheService {
  constructor() {
    this.redis = null;
    this.isConnected = false;
    this.connect();
  }

  connect() {
    try {
      const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
        db: process.env.REDIS_DB || 0,
        
        // Connection settings
        connectTimeout: 10000,
        commandTimeout: 5000,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        
        // Retry strategy
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        
        // Keep alive
        keepAlive: 30000,
        
        // Lazy connect
        lazyConnect: true
      };

      // Cluster configuration for production
      if (process.env.REDIS_CLUSTER_NODES) {
        const nodes = process.env.REDIS_CLUSTER_NODES.split(',').map(node => {
          const [host, port] = node.split(':');
          return { host, port: parseInt(port) };
        });
        
        this.redis = new Redis.Cluster(nodes, {
          redisOptions: redisConfig,
          enableOfflineQueue: false
        });
      } else {
        this.redis = new Redis(redisConfig);
      }

      // Event listeners
      this.redis.on('connect', () => {
        logger.info('Redis connected successfully');
        this.isConnected = true;
      });

      this.redis.on('ready', () => {
        logger.info('Redis is ready to receive commands');
      });

      this.redis.on('error', (error) => {
        logger.error('Redis connection error:', error);
        this.isConnected = false;
      });

      this.redis.on('close', () => {
        logger.warn('Redis connection closed');
        this.isConnected = false;
      });

      this.redis.on('reconnecting', () => {
        logger.info('Redis reconnecting...');
      });

    } catch (error) {
      logger.error('Redis initialization error:', error);
    }
  }

  // Get value from cache
  async get(key) {
    if (!this.isConnected) return null;
    
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  // Set value in cache
  async set(key, value, ttl = 3600) {
    if (!this.isConnected) return false;
    
    try {
      const serialized = JSON.stringify(value);
      if (ttl > 0) {
        await this.redis.setex(key, ttl, serialized);
      } else {
        await this.redis.set(key, serialized);
      }
      return true;
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  // Delete from cache
  async del(key) {
    if (!this.isConnected) return false;
    
    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  // Delete multiple keys
  async delPattern(pattern) {
    if (!this.isConnected) return false;
    
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      return true;
    } catch (error) {
      logger.error(`Cache delete pattern error for ${pattern}:`, error);
      return false;
    }
  }

  // Check if key exists
  async exists(key) {
    if (!this.isConnected) return false;
    
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Cache exists check error for key ${key}:`, error);
      return false;
    }
  }

  // Set expiration
  async expire(key, ttl) {
    if (!this.isConnected) return false;
    
    try {
      await this.redis.expire(key, ttl);
      return true;
    } catch (error) {
      logger.error(`Cache expire error for key ${key}:`, error);
      return false;
    }
  }

  // Increment value
  async incr(key, amount = 1) {
    if (!this.isConnected) return null;
    
    try {
      const result = await this.redis.incrby(key, amount);
      return result;
    } catch (error) {
      logger.error(`Cache increment error for key ${key}:`, error);
      return null;
    }
  }

  // Hash operations
  async hget(key, field) {
    if (!this.isConnected) return null;
    
    try {
      const value = await this.redis.hget(key, field);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Cache hget error for key ${key}, field ${field}:`, error);
      return null;
    }
  }

  async hset(key, field, value) {
    if (!this.isConnected) return false;
    
    try {
      const serialized = JSON.stringify(value);
      await this.redis.hset(key, field, serialized);
      return true;
    } catch (error) {
      logger.error(`Cache hset error for key ${key}, field ${field}:`, error);
      return false;
    }
  }

  // Get cache statistics
  async getStats() {
    if (!this.isConnected) return null;
    
    try {
      const info = await this.redis.info('memory');
      const dbsize = await this.redis.dbsize();
      
      return {
        connected: this.isConnected,
        memory: info,
        keyCount: dbsize
      };
    } catch (error) {
      logger.error('Cache stats error:', error);
      return null;
    }
  }

  // Graceful shutdown
  async disconnect() {
    if (this.redis) {
      try {
        await this.redis.quit();
        logger.info('Redis connection closed gracefully');
      } catch (error) {
        logger.error('Error closing Redis connection:', error);
      }
    }
  }
}

// Singleton instance
const cacheService = new CacheService();

module.exports = cacheService;
```

## Environment Configuration

### Environment Variables
```javascript
// config/environment.js
const dotenv = require('dotenv');
const path = require('path');

// Load environment-specific .env file
const envFile = process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env';
const envPath = path.resolve(process.cwd(), envFile);

dotenv.config({ path: envPath });

// Default .env file as fallback
if (process.env.NODE_ENV && process.env.NODE_ENV !== 'development') {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
}

const config = {
  // Application
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT) || 3000,
  API_URL: process.env.API_URL || 'http://localhost:3000',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3001',
  
  // Database
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce',
  
  // Redis
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: parseInt(process.env.REDIS_PORT) || 6379,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  REDIS_DB: parseInt(process.env.REDIS_DB) || 0,
  REDIS_CLUSTER_NODES: process.env.REDIS_CLUSTER_NODES,
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'example-jwt-secret',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '24h',
  JWT_REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE || '7d',
  
  // Email
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: parseInt(process.env.SMTP_PORT) || 587,
  SMTP_USER: process.env.SMTP_USER || 'example@gmail.com',
  SMTP_PASS: process.env.SMTP_PASS || 'example-app-password',
  FROM_EMAIL: process.env.FROM_EMAIL || 'noreply@example.com',
  FROM_NAME: process.env.FROM_NAME || 'E-Commerce Store',
  
  // PayTR
  PAYTR_MERCHANT_ID: process.env.PAYTR_MERCHANT_ID || 'example-paytr-merchant-id',
  PAYTR_MERCHANT_KEY: process.env.PAYTR_MERCHANT_KEY || 'example-paytr-merchant-key',
  PAYTR_MERCHANT_SALT: process.env.PAYTR_MERCHANT_SALT || 'example-paytr-merchant-salt',
  
  // Shipping
  BASIT_KARGO_API_KEY: process.env.BASIT_KARGO_API_KEY || 'example-api-key',
  BASIT_KARGO_USERNAME: process.env.BASIT_KARGO_USERNAME || 'example-username',
  BASIT_KARGO_PASSWORD: process.env.BASIT_KARGO_PASSWORD || 'example-password',
  
  // File Upload
  UPLOAD_PATH: process.env.UPLOAD_PATH || 'public/uploads',
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB
  
  // Security
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 12,
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW) || 900000, // 15 minutes
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FILE: process.env.LOG_FILE || 'logs/app.log',
  
  // CDN
  CDN_URL: process.env.CDN_URL,
  
  // Analytics
  GOOGLE_ANALYTICS_ID: process.env.GOOGLE_ANALYTICS_ID,
  
  // Social Media
  FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  
  // Feature Flags
  ENABLE_SOCIAL_LOGIN: process.env.ENABLE_SOCIAL_LOGIN === 'true',
  ENABLE_REVIEWS: process.env.ENABLE_REVIEWS !== 'false',
  ENABLE_COUPONS: process.env.ENABLE_COUPONS !== 'false',
  ENABLE_WISHLIST: process.env.ENABLE_WISHLIST !== 'false'
};

// Validate required environment variables
const requiredVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'PAYTR_MERCHANT_ID',
  'PAYTR_MERCHANT_KEY',
  'PAYTR_MERCHANT_SALT'
];

const missingVars = requiredVars.filter(varName => !config[varName]);

if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars.join(', '));
  process.exit(1);
}

module.exports = config;
```

### Environment Files

#### `.env.example`
```bash
# Application
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000
CLIENT_URL=http://localhost:3001

# Database
MONGODB_URI=mongodb://localhost:27017/ecommerce

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@yourstore.com
FROM_NAME=Your Store

# PayTR
PAYTR_MERCHANT_ID=your-merchant-id
PAYTR_MERCHANT_KEY=your-merchant-key
PAYTR_MERCHANT_SALT=your-merchant-salt

# Shipping
BASIT_KARGO_API_KEY=your-api-key
BASIT_KARGO_USERNAME=your-username
BASIT_KARGO_PASSWORD=your-password

# File Upload
UPLOAD_PATH=public/uploads
MAX_FILE_SIZE=10485760

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# CDN
CDN_URL=https://cdn.yourstore.com

# Feature Flags
ENABLE_SOCIAL_LOGIN=false
ENABLE_REVIEWS=true
ENABLE_COUPONS=true
ENABLE_WISHLIST=true
```

#### `.env.production`
```bash
NODE_ENV=production
PORT=3000
API_URL=https://api.yourstore.com
CLIENT_URL=https://yourstore.com

# Database - Use MongoDB Atlas or managed MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ecommerce?retryWrites=true&w=majority

# Redis - Use managed Redis service
REDIS_HOST=your-redis-host.com
REDIS_PORT=6380
REDIS_PASSWORD=your-redis-password
REDIS_DB=0

# Use strong secrets in production
JWT_SECRET=super-strong-secret-key-for-production
JWT_EXPIRE=1h
JWT_REFRESH_EXPIRE=7d

# Production email service
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key

# PayTR production credentials
PAYTR_MERCHANT_ID=your-prod-merchant-id
PAYTR_MERCHANT_KEY=your-prod-merchant-key
PAYTR_MERCHANT_SALT=your-prod-merchant-salt

# Security settings
BCRYPT_ROUNDS=14
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=50

# Logging
LOG_LEVEL=warn
LOG_FILE=/var/log/app/app.log

# CDN
CDN_URL=https://cdn.yourstore.com

# Feature flags
ENABLE_SOCIAL_LOGIN=true
ENABLE_REVIEWS=true
ENABLE_COUPONS=true
ENABLE_WISHLIST=true
```

## Logger Configuration

### Winston Logger Setup
```javascript
// logger/logger.js
const winston = require('winston');
const path = require('path');
const config = require('../config/environment');

// Custom format
const customFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return `${timestamp} [${level}]: ${message} ${
      Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
    }`;
  })
);

// Create logs directory if it doesn't exist
const logDir = path.dirname(config.LOG_FILE);
require('fs').mkdirSync(logDir, { recursive: true });

// Winston logger configuration
const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  format: customFormat,
  defaultMeta: { service: 'ecommerce-backend' },
  transports: [
    // File transport for errors
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),
    
    // File transport for all logs
    new winston.transports.File({
      filename: config.LOG_FILE,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ],
  
  // Handle uncaught exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log')
    })
  ],
  
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log')
    })
  ]
});

// Add console transport for development
if (config.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

// Add HTTP log transport for production
if (config.NODE_ENV === 'production') {
  // Example: Send logs to external service
  // logger.add(new winston.transports.Http({
  //   host: 'your-log-service.com',
  //   port: 443,
  //   path: '/logs'
  // }));
}

module.exports = logger;
```

## Database Migration & Seeding

### Migration Script
```javascript
// scripts/migrate.js
const mongoose = require('mongoose');
const config = require('../src/config/environment');
const logger = require('../src/logger/logger');

const migrations = [
  {
    version: '1.0.0',
    description: 'Initial migration',
    up: async () => {
      // Create initial indexes
      await require('./createIndexes')();
    },
    down: async () => {
      // Rollback logic
    }
  },
  {
    version: '1.1.0',
    description: 'Add product variants',
    up: async () => {
      // Add variants field to existing products
      await mongoose.connection.db.collection('products').updateMany(
        { variants: { $exists: false } },
        { $set: { variants: [] } }
      );
    },
    down: async () => {
      await mongoose.connection.db.collection('products').updateMany(
        {},
        { $unset: { variants: "" } }
      );
    }
  }
];

const runMigrations = async () => {
  try {
    await mongoose.connect(config.MONGODB_URI);
    
    for (const migration of migrations) {
      logger.info(`Running migration: ${migration.version} - ${migration.description}`);
      await migration.up();
      logger.info(`Migration completed: ${migration.version}`);
    }
    
    logger.info('All migrations completed successfully');
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations, migrations };
```

### Seed Data Script
```javascript
// scripts/seed.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../src/config/environment');
const logger = require('../src/logger/logger');

const seedData = async () => {
  try {
    await mongoose.connect(config.MONGODB_URI);
    
    // Create admin user
    const adminExists = await mongoose.connection.db.collection('users').findOne({
      email: 'admin@example.com'
    });
    
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', config.BCRYPT_ROUNDS);
      
      await mongoose.connection.db.collection('users').insertOne({
        name: 'Admin User',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      logger.info('Admin user created');
    }
    
    // Create sample categories
    const categoryExists = await mongoose.connection.db.collection('categories').findOne({
      slug: 'electronics'
    });
    
    if (!categoryExists) {
      await mongoose.connection.db.collection('categories').insertMany([
        {
          name: 'Electronics',
          slug: 'electronics',
          description: 'Electronic devices and gadgets',
          isActive: true,
          order: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'Clothing',
          slug: 'clothing',
          description: 'Fashion and clothing items',
          isActive: true,
          order: 2,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);
      
      logger.info('Sample categories created');
    }
    
    // Create sample settings
    const settingsExists = await mongoose.connection.db.collection('settings').findOne({
      key: 'general'
    });
    
    if (!settingsExists) {
      await mongoose.connection.db.collection('settings').insertOne({
        key: 'general',
        value: {
          siteName: 'E-Commerce Store',
          siteDescription: 'Modern e-commerce platform',
          currency: 'TRY',
          timezone: 'Europe/Istanbul',
          freeShippingThreshold: 500,
          standardShippingCost: 29.99,
          expressShippingCost: 59.99
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      logger.info('Default settings created');
    }
    
    logger.info('Seed data creation completed');
  } catch (error) {
    logger.error('Seed data creation failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

if (require.main === module) {
  seedData();
}

module.exports = seedData;
```

## Performance Monitoring

### Database Performance
```javascript
// utils/dbMonitor.js
const mongoose = require('mongoose');
const logger = require('../logger/logger');

class DatabaseMonitor {
  constructor() {
    this.startTime = Date.now();
    this.queryCount = 0;
    this.slowQueries = [];
  }

  startMonitoring() {
    // Monitor slow queries
    mongoose.set('debug', (collectionName, method, query, doc) => {
      const start = Date.now();
      
      return (err, result) => {
        const duration = Date.now() - start;
        this.queryCount++;
        
        if (duration > 100) { // Log queries slower than 100ms
          const slowQuery = {
            collection: collectionName,
            method,
            query,
            duration,
            timestamp: new Date()
          };
          
          this.slowQueries.push(slowQuery);
          logger.warn('Slow query detected:', slowQuery);
          
          // Keep only last 100 slow queries
          if (this.slowQueries.length > 100) {
            this.slowQueries.shift();
          }
        }
      };
    });

    // Monitor connection pool
    setInterval(() => {
      const connections = mongoose.connection.db?.admin().serverStatus();
      if (connections) {
        logger.info('Database connection stats:', {
          totalQueries: this.queryCount,
          slowQueries: this.slowQueries.length,
          uptime: Date.now() - this.startTime
        });
      }
    }, 60000); // Every minute
  }

  getStats() {
    return {
      totalQueries: this.queryCount,
      slowQueries: this.slowQueries.length,
      recentSlowQueries: this.slowQueries.slice(-10),
      uptime: Date.now() - this.startTime
    };
  }
}

module.exports = new DatabaseMonitor();
```

## Health Check Endpoints

### System Health Check
```javascript
// routes/health.js
const express = require('express');
const mongoose = require('mongoose');
const cacheService = require('../services/cacheService');
const logger = require('../logger/logger');

const router = express.Router();

// Basic health check
router.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0'
    };

    res.status(200).json(health);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Detailed health check
router.get('/health/detailed', async (req, res) => {
  try {
    const checks = {
      database: await checkDatabase(),
      cache: await checkCache(),
      memory: checkMemory(),
      disk: await checkDisk()
    };

    const isHealthy = Object.values(checks).every(check => check.status === 'healthy');

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks
    });
  } catch (error) {
    logger.error('Detailed health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

async function checkDatabase() {
  try {
    await mongoose.connection.db.admin().ping();
    return {
      status: 'healthy',
      responseTime: Date.now(),
      connection: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}

async function checkCache() {
  try {
    const stats = await cacheService.getStats();
    return {
      status: stats && stats.connected ? 'healthy' : 'unhealthy',
      connected: stats?.connected || false,
      keyCount: stats?.keyCount || 0
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}

function checkMemory() {
  const usage = process.memoryUsage();
  const threshold = 1024 * 1024 * 1024; // 1GB

  return {
    status: usage.heapUsed < threshold ? 'healthy' : 'warning',
    heapUsed: usage.heapUsed,
    heapTotal: usage.heapTotal,
    external: usage.external
  };
}

async function checkDisk() {
  try {
    const fs = require('fs').promises;
    await fs.access('./');
    
    return {
      status: 'healthy',
      writable: true
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}

module.exports = router;
```

## Backup & Recovery

### Database Backup Script
```bash
#!/bin/bash
# scripts/backup.sh

# Configuration
DB_NAME="ecommerce"
BACKUP_DIR="/var/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${DATE}.gz"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Create backup
mongodump --db $DB_NAME --gzip --archive=$BACKUP_FILE

# Upload to cloud storage (optional)
# aws s3 cp $BACKUP_FILE s3://your-backup-bucket/

# Clean up old backups (keep last 7 days)
find $BACKUP_DIR -name "${DB_NAME}_*.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE"
```

## Error Handling

### Database Errors
```javascript
// Common database error codes
const DB_ERROR_CODES = {
  DUPLICATE_KEY: 11000,
  INVALID_OBJECT_ID: 'CastError',
  VALIDATION_ERROR: 'ValidationError',
  CONNECTION_ERROR: 'MongoNetworkError'
};

const handleDBError = (error) => {
  switch (error.code || error.name) {
    case DB_ERROR_CODES.DUPLICATE_KEY:
      return {
        code: 'DUPLICATE_ENTRY',
        message: 'Bu kayıt zaten mevcut',
        field: Object.keys(error.keyValue)[0]
      };
      
    case DB_ERROR_CODES.INVALID_OBJECT_ID:
      return {
        code: 'INVALID_ID',
        message: 'Geçersiz ID formatı'
      };
      
    case DB_ERROR_CODES.VALIDATION_ERROR:
      return {
        code: 'VALIDATION_ERROR',
        message: 'Veri doğrulama hatası',
        details: error.errors
      };
      
    default:
      return {
        code: 'DATABASE_ERROR',
        message: 'Veritabanı hatası'
      };
  }
};
```

---

**Son Güncelleme**: `{new Date().toLocaleDateString('tr-TR')}` 