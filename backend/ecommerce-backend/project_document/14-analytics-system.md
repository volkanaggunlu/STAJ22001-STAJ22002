# Analytics System Modülü

## Genel Bakış

Analytics System modülü, kullanıcı davranışları, satış analizleri, performans metrikleri ve iş zekası raporlarını yönetir. Real-time dashboard ve detaylı analitik raporlama sunar.

## Dosya Yapısı

```
src/
├── services/
│   ├── analyticsService.js      # Ana analitik servisi
│   ├── dashboardService.js      # Dashboard metrikleri
│   ├── salesAnalytics.js        # Satış analizleri
│   └── userAnalytics.js         # Kullanıcı analizleri
├── models/
│   ├── Analytics.js             # Analitik veriler
│   ├── UserSession.js           # Kullanıcı oturum takibi
│   └── PageView.js              # Sayfa görüntüleme
├── controllers/
│   └── analytics.js             # Analytics controller
├── routes/
│   └── analytics.js             # Analytics routes
└── utils/
    └── metricsCalculator.js     # Metrik hesaplama yardımcıları
```

## Analytics Features

### 📊 Analitik Özellikleri
- **Real-time Dashboard**: Anlık metrikler ve grafikler
- **Sales Analytics**: Satış performansı, trendler
- **User Behavior**: Kullanıcı yolculuğu, etkileşimler
- **Product Analytics**: Ürün performansı, dönüşüm
- **Traffic Analysis**: Ziyaretçi trafiği, kaynak analizi
- **Conversion Tracking**: Dönüşüm hunileri, optimizasyon
- **Custom Reports**: Özelleştirilebilir raporlar
- **A/B Testing**: Test sonuçları ve performans

## Analytics Model Schema

```javascript
// models/Analytics.js
const analyticsSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'page_view', 'product_view', 'cart_add', 'cart_remove',
      'checkout_start', 'checkout_complete', 'purchase',
      'search', 'filter_apply', 'user_signup', 'user_login',
      'review_add', 'wishlist_add', 'share', 'newsletter_signup'
    ],
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  data: {
    // Event'e özel data
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    page: String,
    searchQuery: String,
    filterData: mongoose.Schema.Types.Mixed,
    value: Number, // Parasal değer
    quantity: Number,
    variant: String,
    source: String, // Trafik kaynağı
    medium: String, // Marketing medium
    campaign: String, // Kampanya adı
    referrer: String,
    customProperties: mongoose.Schema.Types.Mixed
  },
  metadata: {
    ip: String,
    userAgent: String,
    device: {
      type: { type: String, enum: ['desktop', 'mobile', 'tablet'] },
      browser: String,
      os: String,
      screenResolution: String
    },
    location: {
      country: String,
      city: String,
      timezone: String,
      language: String
    },
    duration: Number, // Event süresi (ms)
    scrollDepth: Number, // Sayfa kaydırma yüzdesi
    exitPage: Boolean // Çıkış sayfası mı
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Indexes for performance
analyticsSchema.index({ type: 1, timestamp: -1 });
analyticsSchema.index({ sessionId: 1, timestamp: 1 });
analyticsSchema.index({ 'data.productId': 1, type: 1 });
analyticsSchema.index({ 'data.categoryId': 1, type: 1 });
analyticsSchema.index({ user: 1, timestamp: -1 });
analyticsSchema.index({ timestamp: 1 }, { expireAfterSeconds: 31536000 }); // 1 yıl

// TTL index for data retention
analyticsSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });
```

## UserSession Model Schema

```javascript
// models/UserSession.js
const userSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true
  },
  isAuthenticated: {
    type: Boolean,
    default: false
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: Date,
  duration: Number, // Oturum süresi (saniye)
  pageViews: {
    type: Number,
    default: 0
  },
  events: {
    type: Number,
    default: 0
  },
  conversions: [{
    type: { type: String, enum: ['signup', 'purchase', 'newsletter'] },
    value: Number,
    timestamp: { type: Date, default: Date.now }
  }],
  traffic: {
    source: String, // 'organic', 'direct', 'social', 'email', 'paid'
    medium: String,
    campaign: String,
    referrer: String,
    landingPage: String,
    exitPage: String
  },
  device: {
    type: { type: String, enum: ['desktop', 'mobile', 'tablet'] },
    browser: String,
    os: String,
    screenResolution: String
  },
  location: {
    country: String,
    city: String,
    timezone: String,
    language: String
  },
  metrics: {
    bounceRate: Number,
    avgTimeOnPage: Number,
    pagesPerSession: Number,
    conversionRate: Number,
    revenue: { type: Number, default: 0 }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
});

// Indexes
userSessionSchema.index({ user: 1, startTime: -1 });
userSessionSchema.index({ startTime: -1 });
userSessionSchema.index({ isActive: 1, lastActivity: -1 });
userSessionSchema.index({ 'traffic.source': 1, startTime: -1 });

// Session timeout check
userSessionSchema.methods.checkTimeout = function() {
  const now = new Date();
  const thirtyMinutes = 30 * 60 * 1000;
  
  if (now - this.lastActivity > thirtyMinutes) {
    this.isActive = false;
    this.endTime = this.lastActivity;
    this.duration = Math.floor((this.endTime - this.startTime) / 1000);
    return true;
  }
  return false;
};

// Update session metrics
userSessionSchema.methods.updateMetrics = function() {
  if (this.pageViews > 0) {
    this.metrics.pagesPerSession = this.pageViews;
    this.metrics.bounceRate = this.pageViews === 1 ? 100 : 0;
  }
  
  if (this.duration > 0 && this.pageViews > 0) {
    this.metrics.avgTimeOnPage = this.duration / this.pageViews;
  }
  
  if (this.conversions.length > 0) {
    this.metrics.conversionRate = (this.conversions.length / this.events) * 100;
  }
};
```

## Analytics Service Implementation

```javascript
// services/analyticsService.js
const Analytics = require('../models/Analytics');
const UserSession = require('../models/UserSession');
const Order = require('../models/Order');
const Product = require('../models/Product');
const redis = require('../config/redis');

class AnalyticsService {
  constructor() {
    this.realTimeMetrics = new Map();
    this.startRealTimeUpdates();
  }

  async trackEvent(eventData) {
    try {
      const {
        type,
        userId = null,
        sessionId,
        data = {},
        metadata = {}
      } = eventData;

      // Event'i kaydet
      const analyticsEvent = new Analytics({
        type,
        user: userId,
        sessionId,
        data,
        metadata,
        timestamp: new Date()
      });

      await analyticsEvent.save();

      // Session güncelle
      await this.updateSession(sessionId, type, data, userId);

      // Real-time metrics güncelle
      await this.updateRealTimeMetrics(type, data);

      // Redis cache güncelle
      await this.updateCacheMetrics(type, data);

      return { success: true, eventId: analyticsEvent._id };
    } catch (error) {
      console.error('Analytics tracking error:', error);
      throw new Error(`Analytics tracking failed: ${error.message}`);
    }
  }

  async updateSession(sessionId, eventType, data, userId) {
    let session = await UserSession.findOne({ sessionId });

    if (!session) {
      session = new UserSession({
        sessionId,
        user: userId || null,
        isAuthenticated: !!userId,
        traffic: {
          source: data.source || 'direct',
          medium: data.medium,
          campaign: data.campaign,
          referrer: data.referrer,
          landingPage: data.page
        },
        device: data.device || {},
        location: data.location || {}
      });
    }

    // Session'ı güncelle
    session.lastActivity = new Date();
    session.events += 1;

    if (eventType === 'page_view') {
      session.pageViews += 1;
      if (!session.traffic.landingPage) {
        session.traffic.landingPage = data.page;
      }
      session.traffic.exitPage = data.page;
    }

    // Conversion tracking
    if (['user_signup', 'purchase', 'newsletter_signup'].includes(eventType)) {
      session.conversions.push({
        type: eventType,
        value: data.value || 0,
        timestamp: new Date()
      });

      if (eventType === 'purchase') {
        session.metrics.revenue += data.value || 0;
      }
    }

    // Metrics güncelle
    session.updateMetrics();

    await session.save();
  }

  async updateRealTimeMetrics(type, data) {
    const now = new Date();
    const minute = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes());

    // Redis'te real-time metrics
    const key = `metrics:${type}:${minute.getTime()}`;
    await redis.incr(key);
    await redis.expire(key, 3600); // 1 saat

    // Özel metrikler
    if (type === 'purchase') {
      const revenueKey = `revenue:${minute.getTime()}`;
      await redis.incrby(revenueKey, data.value || 0);
      await redis.expire(revenueKey, 3600);
    }
  }

  async updateCacheMetrics(type, data) {
    // Günlük metrik cache'i güncelle
    const today = new Date().toISOString().split('T')[0];
    const dailyKey = `daily_metrics:${today}`;
    
    await redis.hincrby(dailyKey, type, 1);
    await redis.expire(dailyKey, 86400 * 7); // 7 gün

    // Ürün metrikleri
    if (data.productId) {
      const productKey = `product_metrics:${data.productId}:${today}`;
      await redis.hincrby(productKey, type, 1);
      await redis.expire(productKey, 86400 * 30); // 30 gün
    }
  }

  async getDashboardMetrics(dateRange) {
    const { startDate, endDate } = dateRange;
    
    try {
      // Paralel olarak tüm metrikleri al
      const [
        totalViews,
        totalUsers,
        totalSessions,
        totalRevenue,
        conversionRate,
        topProducts,
        trafficSources,
        realTimeData
      ] = await Promise.all([
        this.getTotalPageViews(startDate, endDate),
        this.getTotalUsers(startDate, endDate),
        this.getTotalSessions(startDate, endDate),
        this.getTotalRevenue(startDate, endDate),
        this.getConversionRate(startDate, endDate),
        this.getTopProducts(startDate, endDate),
        this.getTrafficSources(startDate, endDate),
        this.getRealTimeMetrics()
      ]);

      return {
        overview: {
          totalViews,
          totalUsers,
          totalSessions,
          totalRevenue,
          conversionRate,
          bounceRate: await this.getBounceRate(startDate, endDate),
          avgSessionDuration: await this.getAvgSessionDuration(startDate, endDate)
        },
        topProducts,
        trafficSources,
        realTime: realTimeData,
        trends: await this.getTrends(startDate, endDate)
      };
    } catch (error) {
      throw new Error(`Dashboard metrics failed: ${error.message}`);
    }
  }

  async getTotalPageViews(startDate, endDate) {
    const result = await Analytics.countDocuments({
      type: 'page_view',
      timestamp: { $gte: startDate, $lte: endDate }
    });
    return result;
  }

  async getTotalUsers(startDate, endDate) {
    const result = await Analytics.distinct('user', {
      timestamp: { $gte: startDate, $lte: endDate },
      user: { $ne: null }
    });
    return result.length;
  }

  async getTotalSessions(startDate, endDate) {
    const result = await UserSession.countDocuments({
      startTime: { $gte: startDate, $lte: endDate }
    });
    return result;
  }

  async getTotalRevenue(startDate, endDate) {
    const result = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $in: ['completed', 'delivered'] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$pricing.total' }
        }
      }
    ]);
    
    return result[0]?.total || 0;
  }

  async getConversionRate(startDate, endDate) {
    const [sessions, purchases] = await Promise.all([
      UserSession.countDocuments({
        startTime: { $gte: startDate, $lte: endDate }
      }),
      Analytics.countDocuments({
        type: 'purchase',
        timestamp: { $gte: startDate, $lte: endDate }
      })
    ]);

    return sessions > 0 ? (purchases / sessions) * 100 : 0;
  }

  async getBounceRate(startDate, endDate) {
    const result = await UserSession.aggregate([
      {
        $match: {
          startTime: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          bouncedSessions: {
            $sum: {
              $cond: [{ $eq: ['$pageViews', 1] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          bounceRate: {
            $multiply: [
              { $divide: ['$bouncedSessions', '$totalSessions'] },
              100
            ]
          }
        }
      }
    ]);

    return result[0]?.bounceRate || 0;
  }

  async getAvgSessionDuration(startDate, endDate) {
    const result = await UserSession.aggregate([
      {
        $match: {
          startTime: { $gte: startDate, $lte: endDate },
          duration: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          avgDuration: { $avg: '$duration' }
        }
      }
    ]);

    return result[0]?.avgDuration || 0;
  }

  async getTopProducts(startDate, endDate, limit = 10) {
    const result = await Analytics.aggregate([
      {
        $match: {
          type: 'product_view',
          'data.productId': { $ne: null },
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$data.productId',
          views: { $sum: 1 },
          uniqueViews: { $addToSet: '$sessionId' }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $unwind: '$product'
      },
      {
        $project: {
          productId: '$_id',
          name: '$product.name',
          slug: '$product.slug',
          image: { $arrayElemAt: ['$product.images.url', 0] },
          price: '$product.price',
          views: 1,
          uniqueViews: { $size: '$uniqueViews' }
        }
      },
      { $sort: { views: -1 } },
      { $limit: limit }
    ]);

    return result;
  }

  async getTrafficSources(startDate, endDate) {
    const result = await UserSession.aggregate([
      {
        $match: {
          startTime: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$traffic.source',
          sessions: { $sum: 1 },
          users: { $addToSet: '$user' },
          revenue: { $sum: '$metrics.revenue' },
          conversions: { $sum: { $size: '$conversions' } }
        }
      },
      {
        $project: {
          source: '$_id',
          sessions: 1,
          users: { $size: '$users' },
          revenue: 1,
          conversions: 1,
          conversionRate: {
            $multiply: [
              { $divide: ['$conversions', '$sessions'] },
              100
            ]
          }
        }
      },
      { $sort: { sessions: -1 } }
    ]);

    return result;
  }

  async getRealTimeMetrics() {
    const now = new Date();
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);

    // Son 1 saatteki metrikler
    const [activeUsers, currentPageViews, recentPurchases] = await Promise.all([
      // Aktif kullanıcılar (son 30 dakika)
      UserSession.countDocuments({
        isActive: true,
        lastActivity: { $gte: new Date(now.getTime() - 30 * 60 * 1000) }
      }),
      
      // Son 1 saatteki sayfa görüntülemeleri
      Analytics.countDocuments({
        type: 'page_view',
        timestamp: { $gte: lastHour }
      }),
      
      // Son 1 saatteki satışlar
      Analytics.countDocuments({
        type: 'purchase',
        timestamp: { $gte: lastHour }
      })
    ]);

    // Redis'ten real-time veriler
    const currentMinute = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes());
    const realtimeViews = await redis.get(`metrics:page_view:${currentMinute.getTime()}`) || 0;

    return {
      activeUsers,
      currentPageViews,
      recentPurchases,
      thisMinuteViews: parseInt(realtimeViews)
    };
  }

  async getTrends(startDate, endDate) {
    const dailyTrends = await Analytics.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$timestamp'
              }
            },
            type: '$type'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          metrics: {
            $push: {
              type: '$_id.type',
              count: '$count'
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return dailyTrends;
  }

  async getSalesAnalytics(dateRange) {
    const { startDate, endDate } = dateRange;

    const salesData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $in: ['completed', 'delivered'] }
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
            }
          },
          totalRevenue: { $sum: '$pricing.total' },
          totalOrders: { $sum: 1 },
          avgOrderValue: { $avg: '$pricing.total' }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    return salesData;
  }

  async getUserAnalytics(userId, dateRange) {
    const { startDate, endDate } = dateRange;

    const userEvents = await Analytics.find({
      user: userId,
      timestamp: { $gte: startDate, $lte: endDate }
    }).sort({ timestamp: 1 });

    const sessions = await UserSession.find({
      user: userId,
      startTime: { $gte: startDate, $lte: endDate }
    }).sort({ startTime: -1 });

    return {
      events: userEvents,
      sessions,
      totalEvents: userEvents.length,
      totalSessions: sessions.length,
      totalRevenue: sessions.reduce((sum, session) => sum + session.metrics.revenue, 0)
    };
  }

  startRealTimeUpdates() {
    // Her dakika real-time metrics güncelle
    setInterval(async () => {
      try {
        const metrics = await this.getRealTimeMetrics();
        this.realTimeMetrics.set('current', metrics);
      } catch (error) {
        console.error('Real-time metrics update failed:', error);
      }
    }, 60000); // 1 dakika
  }

  async generateReport(reportType, dateRange, filters = {}) {
    switch (reportType) {
      case 'sales':
        return await this.generateSalesReport(dateRange, filters);
      case 'user_behavior':
        return await this.generateUserBehaviorReport(dateRange, filters);
      case 'product_performance':
        return await this.generateProductPerformanceReport(dateRange, filters);
      case 'traffic':
        return await this.generateTrafficReport(dateRange, filters);
      default:
        throw new Error('Geçersiz rapor türü');
    }
  }

  async generateSalesReport(dateRange, filters) {
    const { startDate, endDate } = dateRange;
    
    const salesData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $in: ['completed', 'delivered'] }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          orderNumber: 1,
          total: '$pricing.total',
          items: 1,
          createdAt: 1,
          customerName: '$user.name',
          customerEmail: '$user.email'
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    const summary = {
      totalRevenue: salesData.reduce((sum, order) => sum + order.total, 0),
      totalOrders: salesData.length,
      avgOrderValue: salesData.length > 0 ? 
        salesData.reduce((sum, order) => sum + order.total, 0) / salesData.length : 0
    };

    return {
      summary,
      orders: salesData,
      dateRange
    };
  }
}

module.exports = new AnalyticsService();
```

## API Endpoints

### POST `/api/analytics/track`
Event tracking endpoint.

**Request Body:**
```json
{
  "type": "product_view",
  "sessionId": "sess_123456789",
  "data": {
    "productId": "64f8a123456789abcdef",
    "page": "/products/iphone-15-pro",
    "source": "organic",
    "referrer": "https://google.com"
  },
  "metadata": {
    "device": {
      "type": "desktop",
      "browser": "Chrome",
      "os": "Windows"
    },
    "location": {
      "country": "Turkey",
      "city": "Istanbul"
    }
  }
}
```

### GET `/api/analytics/dashboard`
Dashboard metriklerini getirir.

**Query Parameters:**
- `startDate`: Başlangıç tarihi
- `endDate`: Bitiş tarihi

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalViews": 15420,
      "totalUsers": 3450,
      "totalSessions": 8920,
      "totalRevenue": 125000,
      "conversionRate": 3.2,
      "bounceRate": 45.6,
      "avgSessionDuration": 180
    },
    "topProducts": [
      {
        "productId": "64f8a123456789abcdef",
        "name": "iPhone 15 Pro",
        "views": 1250,
        "uniqueViews": 890
      }
    ],
    "trafficSources": [
      {
        "source": "organic",
        "sessions": 3450,
        "users": 2890,
        "conversionRate": 4.2
      }
    ],
    "realTime": {
      "activeUsers": 45,
      "currentPageViews": 125,
      "recentPurchases": 8
    }
  }
}
```

### GET `/api/analytics/reports/:type`
Özel rapor oluşturur.

**Response:**
```json
{
  "success": true,
  "data": {
    "report": {
      "type": "sales",
      "summary": {
        "totalRevenue": 125000,
        "totalOrders": 450,
        "avgOrderValue": 277.78
      },
      "dateRange": {
        "startDate": "2023-10-01",
        "endDate": "2023-10-31"
      }
    }
  }
}
```

### GET `/api/analytics/realtime`
Real-time metrikler.

### GET `/api/analytics/funnel`
Conversion funnel analizi.

**Response:**
```json
{
  "success": true,
  "data": {
    "funnel": [
      {
        "step": "page_view",
        "count": 10000,
        "dropoffRate": 0
      },
      {
        "step": "product_view",
        "count": 3500,
        "dropoffRate": 65
      },
      {
        "step": "cart_add",
        "count": 1200,
        "dropoffRate": 65.7
      },
      {
        "step": "checkout_start",
        "count": 800,
        "dropoffRate": 33.3
      },
      {
        "step": "purchase",
        "count": 320,
        "dropoffRate": 60
      }
    ]
  }
}
```

## Frontend Analytics Integration

### Analytics Hook (React)
```javascript
import { useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

export const useAnalytics = () => {
  const sessionId = useCallback(() => {
    let id = sessionStorage.getItem('analytics_session_id');
    if (!id) {
      id = uuidv4();
      sessionStorage.setItem('analytics_session_id', id);
    }
    return id;
  }, []);

  const trackEvent = useCallback(async (type, data = {}, metadata = {}) => {
    try {
      const deviceInfo = {
        type: window.innerWidth > 768 ? 'desktop' : 'mobile',
        browser: navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Other',
        os: navigator.platform,
        screenResolution: `${screen.width}x${screen.height}`
      };

      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type,
          sessionId: sessionId(),
          data: {
            ...data,
            page: window.location.pathname,
            referrer: document.referrer
          },
          metadata: {
            ...metadata,
            device: deviceInfo,
            timestamp: new Date().toISOString()
          }
        })
      });
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
  }, [sessionId]);

  const trackPageView = useCallback((page) => {
    trackEvent('page_view', { page });
  }, [trackEvent]);

  const trackProductView = useCallback((productId, productData) => {
    trackEvent('product_view', {
      productId,
      ...productData
    });
  }, [trackEvent]);

  const trackAddToCart = useCallback((productId, quantity, price) => {
    trackEvent('cart_add', {
      productId,
      quantity,
      value: price * quantity
    });
  }, [trackEvent]);

  const trackPurchase = useCallback((orderId, orderValue, items) => {
    trackEvent('purchase', {
      orderId,
      value: orderValue,
      items
    });
  }, [trackEvent]);

  const trackSearch = useCallback((query, resultsCount) => {
    trackEvent('search', {
      searchQuery: query,
      resultsCount
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackPageView,
    trackProductView,
    trackAddToCart,
    trackPurchase,
    trackSearch
  };
};
```

### Analytics Dashboard Component
```javascript
import React, { useState, useEffect } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

const AnalyticsDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics/dashboard?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
      const data = await response.json();
      setDashboardData(data.data);
    } catch (error) {
      console.error('Dashboard data fetch failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !dashboardData) {
    return <div className="loading">Yükleniyor...</div>;
  }

  const { overview, topProducts, trafficSources, realTime } = dashboardData;

  return (
    <div className="analytics-dashboard">
      <div className="dashboard-header">
        <h1>Analytics Dashboard</h1>
        <div className="date-range">
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
          />
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
          />
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Toplam Görüntüleme</h3>
          <div className="metric-value">{overview.totalViews.toLocaleString()}</div>
        </div>
        
        <div className="metric-card">
          <h3>Toplam Kullanıcı</h3>
          <div className="metric-value">{overview.totalUsers.toLocaleString()}</div>
        </div>
        
        <div className="metric-card">
          <h3>Toplam Oturum</h3>
          <div className="metric-value">{overview.totalSessions.toLocaleString()}</div>
        </div>
        
        <div className="metric-card">
          <h3>Toplam Gelir</h3>
          <div className="metric-value">₺{overview.totalRevenue.toLocaleString('tr-TR')}</div>
        </div>
        
        <div className="metric-card">
          <h3>Dönüşüm Oranı</h3>
          <div className="metric-value">{overview.conversionRate.toFixed(2)}%</div>
        </div>
        
        <div className="metric-card">
          <h3>Bounce Rate</h3>
          <div className="metric-value">{overview.bounceRate.toFixed(1)}%</div>
        </div>
      </div>

      {/* Real-time Metrics */}
      <div className="realtime-section">
        <h2>Gerçek Zamanlı Metrikler</h2>
        <div className="realtime-grid">
          <div className="realtime-metric">
            <span className="realtime-label">Aktif Kullanıcı</span>
            <span className="realtime-value">{realTime.activeUsers}</span>
          </div>
          <div className="realtime-metric">
            <span className="realtime-label">Bu Dakika Görüntüleme</span>
            <span className="realtime-value">{realTime.thisMinuteViews}</span>
          </div>
          <div className="realtime-metric">
            <span className="realtime-label">Son Saatteki Satış</span>
            <span className="realtime-value">{realTime.recentPurchases}</span>
          </div>
        </div>
      </div>

      <div className="charts-section">
        {/* Traffic Sources Chart */}
        <div className="chart-container">
          <h3>Trafik Kaynakları</h3>
          <Doughnut 
            data={{
              labels: trafficSources.map(source => source.source),
              datasets: [{
                data: trafficSources.map(source => source.sessions),
                backgroundColor: [
                  '#FF6384',
                  '#36A2EB',
                  '#FFCE56',
                  '#4BC0C0',
                  '#9966FF'
                ]
              }]
            }}
          />
        </div>

        {/* Top Products Chart */}
        <div className="chart-container">
          <h3>En Çok Görüntülenen Ürünler</h3>
          <Bar 
            data={{
              labels: topProducts.slice(0, 5).map(product => product.name),
              datasets: [{
                label: 'Görüntüleme',
                data: topProducts.slice(0, 5).map(product => product.views),
                backgroundColor: '#36A2EB'
              }]
            }}
            options={{
              responsive: true,
              scales: {
                y: {
                  beginAtZero: true
                }
              }
            }}
          />
        </div>
      </div>

      {/* Top Products Table */}
      <div className="table-section">
        <h3>En Popüler Ürünler</h3>
        <table className="analytics-table">
          <thead>
            <tr>
              <th>Ürün</th>
              <th>Görüntüleme</th>
              <th>Benzersiz Görüntüleme</th>
              <th>Fiyat</th>
            </tr>
          </thead>
          <tbody>
            {topProducts.slice(0, 10).map(product => (
              <tr key={product.productId}>
                <td>
                  <div className="product-info">
                    <img src={product.image} alt={product.name} className="product-thumb" />
                    <span>{product.name}</span>
                  </div>
                </td>
                <td>{product.views.toLocaleString()}</td>
                <td>{product.uniqueViews.toLocaleString()}</td>
                <td>₺{product.price.toLocaleString('tr-TR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
```

## Test Examples

```javascript
describe('Analytics System', () => {
  test('should track page view event', async () => {
    const eventData = {
      type: 'page_view',
      sessionId: 'test_session_123',
      data: {
        page: '/products/test-product'
      }
    };

    const response = await request(app)
      .post('/api/analytics/track')
      .send(eventData);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test('should get dashboard metrics', async () => {
    const startDate = new Date('2023-10-01');
    const endDate = new Date('2023-10-31');

    const response = await request(app)
      .get(`/api/analytics/dashboard?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.overview).toBeDefined();
    expect(response.body.data.topProducts).toBeInstanceOf(Array);
  });

  test('should generate sales report', async () => {
    const response = await request(app)
      .get('/api/analytics/reports/sales?startDate=2023-10-01&endDate=2023-10-31')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.report.summary).toBeDefined();
    expect(typeof response.body.data.report.summary.totalRevenue).toBe('number');
  });
});
```

---

**Son Güncelleme**: `{new Date().toLocaleDateString('tr-TR')}` 