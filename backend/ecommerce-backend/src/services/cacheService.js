const Redis = require('ioredis');
const logger = require('../logger/logger');

class CacheService {
  constructor() {
    this.client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });

    this.client.on('error', (error) => {
      logger.error('Redis error:', error);
    });

    this.client.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    // Varsayılan TTL: 1 saat
    this.defaultTTL = 3600;
  }

  /**
   * Cache'den veri al
   */
  async get(key) {
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Cache'e veri kaydet
   */
  async set(key, value, ttl = this.defaultTTL) {
    try {
      await this.client.set(
        key,
        JSON.stringify(value),
        'EX',
        ttl
      );
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Cache'den veri sil
   */
  async del(key) {
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Pattern ile eşleşen tüm keyleri sil
   */
  async delByPattern(pattern) {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      logger.error('Cache delete by pattern error:', error);
      return false;
    }
  }

  /**
   * Cache'i temizle
   */
  async flush() {
    try {
      await this.client.flushall();
      return true;
    } catch (error) {
      logger.error('Cache flush error:', error);
      return false;
    }
  }

  /**
   * Cache istatistiklerini al
   */
  async getStats() {
    try {
      const info = await this.client.info();
      return info;
    } catch (error) {
      logger.error('Cache stats error:', error);
      return null;
    }
  }
}

module.exports = new CacheService(); 