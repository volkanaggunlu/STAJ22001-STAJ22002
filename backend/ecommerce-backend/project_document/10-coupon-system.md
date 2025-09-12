# Coupon System Modülü

## Genel Bakış

Coupon System modülü, indirim kuponu sistemi, promosyon kodları, kullanım kuralları ve indirim hesaplamalarını yönetir. Farklı indirim türleri ve kullanım sınırlamaları destekler.

## Dosya Yapısı

```
src/
├── controllers/
│   └── coupon.js              # Kupon controller
├── routes/
│   └── coupon.js             # Kupon routes
├── services/
│   └── couponService.js      # Kupon business logic
├── models/
│   └── Coupon.js             # Kupon model
└── validation/
    └── couponValidation.js   # Kupon validation schemas
```

## Coupon Model Schema

```javascript
// models/Coupon.js
const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  type: {
    type: String,
    enum: ['percentage', 'fixed', 'shipping', 'buy_x_get_y'],
    required: true
  },
  discount: {
    value: { type: Number, required: true, min: 0 },
    maxAmount: Number, // Maksimum indirim tutarı (percentage için)
    minOrderAmount: { type: Number, default: 0 }, // Minimum sipariş tutarı
    freeShippingThreshold: Number // Ücretsiz kargo için minimum tutar
  },
  buyXGetY: {
    buyQuantity: { type: Number, min: 1 },
    getQuantity: { type: Number, min: 1 },
    getDiscountPercentage: { type: Number, min: 0, max: 100 },
    applicableProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    applicableCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }]
  },
  applicableProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  applicableCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  excludedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  excludedCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  usage: {
    limit: { type: Number, default: null }, // null = sınırsız
    used: { type: Number, default: 0 },
    limitPerUser: { type: Number, default: 1 },
    firstTimeOnly: { type: Boolean, default: false } // Sadece ilk sipariş
  },
  validFrom: {
    type: Date,
    required: true,
    default: Date.now
  },
  validUntil: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: true // false = gizli kupon, sadece link ile
  },
  targetAudience: {
    userGroups: [String], // "new_users", "premium_users", "inactive_users"
    specificUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    minOrderCount: Number, // Minimum sipariş sayısı
    minSpentAmount: Number // Minimum harcama tutarı
  },
  stackable: {
    type: Boolean,
    default: false // Diğer kuponlarla birlikte kullanılabilir mi
  },
  autoApply: {
    type: Boolean,
    default: false // Şartları sağlayan siparişlere otomatik uygula
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  statistics: {
    totalUsage: { type: Number, default: 0 },
    totalDiscount: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
    averageOrderValue: { type: Number, default: 0 }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Kupon kodu otomatik büyük harf
couponSchema.pre('save', function(next) {
  if (this.isModified('code')) {
    this.code = this.code.toUpperCase();
  }
  this.updatedAt = new Date();
  next();
});

// Kupon geçerlilik kontrolü
couponSchema.methods.isValid = function() {
  const now = new Date();
  return this.isActive && 
         now >= this.validFrom && 
         now <= this.validUntil &&
         (this.usage.limit === null || this.usage.used < this.usage.limit);
};

// Kullanım istatistiklerini güncelle
couponSchema.methods.updateStats = function(discountAmount, orderTotal) {
  this.statistics.totalUsage += 1;
  this.statistics.totalDiscount += discountAmount;
  this.statistics.totalRevenue += orderTotal;
  this.statistics.averageOrderValue = this.statistics.totalRevenue / this.statistics.totalUsage;
  this.usage.used += 1;
};

// Indexes
couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1, validFrom: 1, validUntil: 1 });
couponSchema.index({ type: 1 });
couponSchema.index({ autoApply: 1, isActive: 1 });
```

## API Endpoints

### GET `/api/coupons/public`
Herkese açık kuponları listeler.

**Response:**
```json
{
  "success": true,
  "data": {
    "coupons": [
      {
        "id": "64f8a123456789abcdef",
        "code": "WELCOME10",
        "name": "Hoş Geldin İndirimi",
        "description": "İlk alışverişinizde %10 indirim",
        "type": "percentage",
        "discount": {
          "value": 10,
          "maxAmount": 100,
          "minOrderAmount": 200
        },
        "validUntil": "2023-12-31T23:59:59.000Z",
        "usage": {
          "used": 145,
          "limit": 1000
        }
      }
    ]
  }
}
```

### POST `/api/coupons/validate`
Kupon kodunu doğrular.

**Request Body:**
```json
{
  "code": "WELCOME10",
  "cartItems": [
    {
      "productId": "64f8a123456789abcdef",
      "quantity": 2,
      "price": 999.99
    }
  ],
  "subtotal": 1999.98
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "coupon": {
      "id": "64f8a123456789abcdef",
      "code": "WELCOME10",
      "name": "Hoş Geldin İndirimi",
      "type": "percentage",
      "discount": {
        "value": 10,
        "applicableAmount": 1999.98,
        "discountAmount": 199.99,
        "finalAmount": 1799.99
      }
    },
    "message": "Kupon başarıyla uygulandı"
  }
}
```

### POST `/api/coupons/apply`
Sepete kupon uygular.

**Request Body:**
```json
{
  "code": "WELCOME10"
}
```

### GET `/api/coupons/user`
Kullanıcının kullanabileceği kuponları getirir.

**Response:**
```json
{
  "success": true,
  "data": {
    "availableCoupons": [
      {
        "id": "64f8a123456789abcdef",
        "code": "NEWUSER20",
        "name": "Yeni Kullanıcı İndirimi",
        "type": "percentage",
        "discount": {
          "value": 20,
          "maxAmount": 200
        },
        "validUntil": "2023-12-31T23:59:59.000Z",
        "canUse": true,
        "reason": null
      },
      {
        "id": "64f8a123456789abcdeg",
        "code": "PREMIUM50",
        "name": "Premium Kullanıcı İndirimi",
        "canUse": false,
        "reason": "Premium üyelik gerekli"
      }
    ]
  }
}
```

## Admin Coupon Management

### GET `/api/admin/coupons`
Tüm kuponları listeler (Admin).

**Query Parameters:**
- `page`: Sayfa numarası
- `limit`: Sayfa başına kupon
- `status`: Durum filtresi (active, expired, used_up)
- `type`: Kupon türü filtresi

### POST `/api/admin/coupons` (Admin)
Yeni kupon oluşturur.

**Request Body:**
```json
{
  "code": "FLASH50",
  "name": "Flash Sale İndirimi",
  "description": "24 saat geçerli %50 indirim",
  "type": "percentage",
  "discount": {
    "value": 50,
    "maxAmount": 500,
    "minOrderAmount": 1000
  },
  "applicableCategories": ["64f8a123456789abcdef"],
  "usage": {
    "limit": 100,
    "limitPerUser": 1
  },
  "validFrom": "2023-10-01T00:00:00.000Z",
  "validUntil": "2023-10-02T00:00:00.000Z",
  "isPublic": true
}
```

### PUT `/api/admin/coupons/:id` (Admin)
Kupon bilgilerini günceller.

### DELETE `/api/admin/coupons/:id` (Admin)
Kupon siler.

### POST `/api/admin/coupons/bulk-create` (Admin)
Toplu kupon oluşturur.

**Request Body:**
```json
{
  "template": {
    "name": "Black Friday Kuponları",
    "type": "percentage",
    "discount": {
      "value": 25,
      "maxAmount": 250
    },
    "validFrom": "2023-11-24T00:00:00.000Z",
    "validUntil": "2023-11-27T23:59:59.000Z"
  },
  "quantity": 1000,
  "codePattern": "BF2023-{RANDOM:6}" // BF2023-ABC123 formatında
}
```

### GET `/api/admin/coupons/:id/stats` (Admin)
Kupon istatistiklerini getirir.

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalUsage": 245,
      "totalDiscount": 12450.75,
      "totalRevenue": 89234.50,
      "conversionRate": 15.3,
      "averageOrderValue": 364.02,
      "usageByDate": [
        {
          "date": "2023-10-01",
          "usage": 15,
          "discount": 750.25,
          "revenue": 5234.80
        }
      ]
    }
  }
}
```

## Coupon Service Fonksiyonları

### `validateCoupon(code, userId, cartData)`
Kupon geçerliliğini kontrol eder.

### `applyCoupon(code, userId, cartData)`
Sepete kupon uygular.

### `calculateDiscount(coupon, cartData)`
İndirim miktarını hesaplar.

### `getAvailableCoupons(userId)`
Kullanıcının kullanabileceği kuponları getirir.

### `createCoupon(adminId, couponData)`
Yeni kupon oluşturur.

### `generateCouponCode(pattern)`
Kupon kodu üretir.

### `checkUserEligibility(userId, coupon)`
Kullanıcının kupon kullanma uygunluğunu kontrol eder.

## Coupon Calculation Engine

```javascript
// services/couponService.js
class CouponService {
  async calculateDiscount(coupon, cartData) {
    const { items, subtotal } = cartData;
    let discountAmount = 0;
    let applicableAmount = 0;

    switch (coupon.type) {
      case 'percentage':
        applicableAmount = this.calculateApplicableAmount(coupon, items);
        discountAmount = (applicableAmount * coupon.discount.value) / 100;
        
        // Maksimum indirim kontrolü
        if (coupon.discount.maxAmount && discountAmount > coupon.discount.maxAmount) {
          discountAmount = coupon.discount.maxAmount;
        }
        break;

      case 'fixed':
        applicableAmount = this.calculateApplicableAmount(coupon, items);
        discountAmount = Math.min(coupon.discount.value, applicableAmount);
        break;

      case 'shipping':
        if (subtotal >= (coupon.discount.freeShippingThreshold || 0)) {
          discountAmount = coupon.discount.value; // Kargo ücreti
        }
        break;

      case 'buy_x_get_y':
        discountAmount = this.calculateBuyXGetYDiscount(coupon, items);
        break;
    }

    return {
      applicable: discountAmount > 0,
      applicableAmount,
      discountAmount: Math.round(discountAmount * 100) / 100,
      finalAmount: subtotal - discountAmount
    };
  }

  calculateApplicableAmount(coupon, items) {
    if (!coupon.applicableProducts.length && !coupon.applicableCategories.length) {
      // Tüm ürünlere uygulanabilir
      return items.reduce((total, item) => {
        if (!this.isExcluded(coupon, item.productId)) {
          return total + (item.price * item.quantity);
        }
        return total;
      }, 0);
    }

    return items.reduce((total, item) => {
      if (this.isApplicable(coupon, item) && !this.isExcluded(coupon, item.productId)) {
        return total + (item.price * item.quantity);
      }
      return total;
    }, 0);
  }

  calculateBuyXGetYDiscount(coupon, items) {
    const { buyQuantity, getQuantity, getDiscountPercentage } = coupon.buyXGetY;
    let totalDiscount = 0;

    // Uygulanabilir ürünleri filtrele
    const applicableItems = items.filter(item => 
      this.isApplicableForBuyXGetY(coupon, item)
    );

    for (const item of applicableItems) {
      const sets = Math.floor(item.quantity / (buyQuantity + getQuantity));
      const freeItems = sets * getQuantity;
      const discountPerItem = (item.price * getDiscountPercentage) / 100;
      totalDiscount += freeItems * discountPerItem;
    }

    return totalDiscount;
  }

  async checkUserEligibility(userId, coupon) {
    // Kullanım limiti kontrolü
    if (coupon.usage.limitPerUser) {
      const userUsageCount = await Order.countDocuments({
        user: userId,
        'appliedCoupons.code': coupon.code,
        status: { $nin: ['cancelled', 'refunded'] }
      });

      if (userUsageCount >= coupon.usage.limitPerUser) {
        return {
          eligible: false,
          reason: 'Bu kuponu zaten kullandınız'
        };
      }
    }

    // İlk sipariş kontrolü
    if (coupon.usage.firstTimeOnly) {
      const orderCount = await Order.countDocuments({
        user: userId,
        status: { $nin: ['cancelled', 'refunded'] }
      });

      if (orderCount > 0) {
        return {
          eligible: false,
          reason: 'Bu kupon sadece ilk siparişinizde kullanılabilir'
        };
      }
    }

    // Hedef kitle kontrolü
    if (coupon.targetAudience.specificUsers.length > 0) {
      if (!coupon.targetAudience.specificUsers.includes(userId)) {
        return {
          eligible: false,
          reason: 'Bu kupon sizin için geçerli değil'
        };
      }
    }

    // Minimum sipariş sayısı kontrolü
    if (coupon.targetAudience.minOrderCount) {
      const orderCount = await Order.countDocuments({
        user: userId,
        status: 'delivered'
      });

      if (orderCount < coupon.targetAudience.minOrderCount) {
        return {
          eligible: false,
          reason: `En az ${coupon.targetAudience.minOrderCount} sipariş gerekli`
        };
      }
    }

    return { eligible: true };
  }

  generateCouponCode(pattern = 'COUP{RANDOM:6}') {
    const randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    
    return pattern.replace(/\{RANDOM:(\d+)\}/g, (match, length) => {
      let result = '';
      for (let i = 0; i < parseInt(length); i++) {
        result += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
      }
      return result;
    });
  }

  async getAutoApplyCoupons(userId, cartData) {
    const coupons = await Coupon.find({
      autoApply: true,
      isActive: true,
      validFrom: { $lte: new Date() },
      validUntil: { $gte: new Date() }
    });

    const applicableCoupons = [];

    for (const coupon of coupons) {
      const eligibility = await this.checkUserEligibility(userId, coupon);
      if (eligibility.eligible) {
        const discount = await this.calculateDiscount(coupon, cartData);
        if (discount.applicable && discount.discountAmount > 0) {
          applicableCoupons.push({
            coupon,
            discount
          });
        }
      }
    }

    // En yüksek indirimi sağlayan kuponu seç
    return applicableCoupons.sort((a, b) => 
      b.discount.discountAmount - a.discount.discountAmount
    );
  }
}
```

## Validation Schemas

### Coupon Creation Validation
```javascript
const createCouponSchema = Joi.object({
  code: Joi.string().min(3).max(20).pattern(/^[A-Z0-9]+$/).required(),
  name: Joi.string().min(3).max(100).required(),
  description: Joi.string().max(500),
  type: Joi.string().valid('percentage', 'fixed', 'shipping', 'buy_x_get_y').required(),
  discount: Joi.object({
    value: Joi.number().min(0).required(),
    maxAmount: Joi.number().min(0),
    minOrderAmount: Joi.number().min(0).default(0),
    freeShippingThreshold: Joi.number().min(0)
  }).required(),
  buyXGetY: Joi.when('type', {
    is: 'buy_x_get_y',
    then: Joi.object({
      buyQuantity: Joi.number().min(1).required(),
      getQuantity: Joi.number().min(1).required(),
      getDiscountPercentage: Joi.number().min(0).max(100).required(),
      applicableProducts: Joi.array().items(Joi.string().hex().length(24)),
      applicableCategories: Joi.array().items(Joi.string().hex().length(24))
    }),
    otherwise: Joi.forbidden()
  }),
  applicableProducts: Joi.array().items(Joi.string().hex().length(24)),
  applicableCategories: Joi.array().items(Joi.string().hex().length(24)),
  usage: Joi.object({
    limit: Joi.number().min(1),
    limitPerUser: Joi.number().min(1).default(1),
    firstTimeOnly: Joi.boolean().default(false)
  }),
  validFrom: Joi.date().required(),
  validUntil: Joi.date().greater(Joi.ref('validFrom')).required(),
  isPublic: Joi.boolean().default(true),
  stackable: Joi.boolean().default(false),
  autoApply: Joi.boolean().default(false)
});
```

## Frontend Entegrasyonu

### Coupon Hook (React)
```javascript
import { useState, useEffect } from 'react';

export const useCoupons = () => {
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchAvailableCoupons = async () => {
    try {
      const response = await api.get('/coupons/user');
      setAvailableCoupons(response.data.data.availableCoupons);
    } catch (error) {
      console.error('Coupons fetch error:', error);
    }
  };

  const validateCoupon = async (code, cartData) => {
    setLoading(true);
    try {
      const response = await api.post('/coupons/validate', {
        code,
        cartItems: cartData.items,
        subtotal: cartData.subtotal
      });
      return response.data.data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const applyCoupon = async (code) => {
    setLoading(true);
    try {
      const response = await api.post('/coupons/apply', { code });
      setAppliedCoupon(response.data.data.coupon);
      return response.data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  useEffect(() => {
    fetchAvailableCoupons();
  }, []);

  return {
    availableCoupons,
    appliedCoupon,
    loading,
    validateCoupon,
    applyCoupon,
    removeCoupon,
    refetch: fetchAvailableCoupons
  };
};
```

### Coupon Input Component
```javascript
import React, { useState } from 'react';
import { useCoupons } from '../hooks/useCoupons';

const CouponInput = ({ cartData, onCouponApplied }) => {
  const { validateCoupon, applyCoupon, loading } = useCoupons();
  const [couponCode, setCouponCode] = useState('');
  const [validationResult, setValidationResult] = useState(null);
  const [error, setError] = useState('');

  const handleValidation = async () => {
    if (!couponCode.trim()) return;

    try {
      setError('');
      const result = await validateCoupon(couponCode.toUpperCase(), cartData);
      setValidationResult(result);
      
      if (result.valid) {
        await applyCoupon(couponCode.toUpperCase());
        onCouponApplied(result.coupon);
        setCouponCode('');
        setValidationResult(null);
      }
    } catch (error) {
      setError(error.response?.data?.error?.message || 'Kupon doğrulanamadı');
      setValidationResult(null);
    }
  };

  return (
    <div className="coupon-input">
      <div className="input-group">
        <input
          type="text"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
          placeholder="Kupon kodunu girin"
          maxLength="20"
        />
        <button 
          onClick={handleValidation}
          disabled={loading || !couponCode.trim()}
          className="apply-btn"
        >
          {loading ? 'Kontrol ediliyor...' : 'Uygula'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {validationResult && !validationResult.valid && (
        <div className="error-message">
          Kupon geçersiz: {validationResult.reason}
        </div>
      )}

      {validationResult && validationResult.valid && (
        <div className="success-message">
          <strong>{validationResult.coupon.name}</strong>
          <br />
          İndirim: ₺{validationResult.coupon.discount.discountAmount.toLocaleString('tr-TR')}
        </div>
      )}
    </div>
  );
};
```

### Available Coupons Component
```javascript
import React from 'react';
import { useCoupons } from '../hooks/useCoupons';

const AvailableCoupons = ({ onCouponSelect }) => {
  const { availableCoupons } = useCoupons();

  const formatDiscount = (coupon) => {
    switch (coupon.type) {
      case 'percentage':
        return `%${coupon.discount.value} indirim`;
      case 'fixed':
        return `₺${coupon.discount.value} indirim`;
      case 'shipping':
        return 'Ücretsiz kargo';
      case 'buy_x_get_y':
        return `${coupon.buyXGetY.buyQuantity} al ${coupon.buyXGetY.getQuantity} öde`;
      default:
        return 'İndirim';
    }
  };

  const getDiscountDetails = (coupon) => {
    const details = [];
    
    if (coupon.discount.minOrderAmount > 0) {
      details.push(`Min. ₺${coupon.discount.minOrderAmount} alışveriş`);
    }
    
    if (coupon.discount.maxAmount) {
      details.push(`Max. ₺${coupon.discount.maxAmount} indirim`);
    }
    
    return details.join(' • ');
  };

  return (
    <div className="available-coupons">
      <h4>Kullanılabilir Kuponlar</h4>
      
      {availableCoupons.length === 0 ? (
        <p>Şu anda kullanılabilir kupon bulunmamaktadır.</p>
      ) : (
        <div className="coupon-list">
          {availableCoupons.map(coupon => (
            <div 
              key={coupon.id} 
              className={`coupon-card ${!coupon.canUse ? 'disabled' : ''}`}
            >
              <div className="coupon-header">
                <div className="coupon-code">{coupon.code}</div>
                <div className="coupon-discount">
                  {formatDiscount(coupon)}
                </div>
              </div>
              
              <div className="coupon-content">
                <h5 className="coupon-name">{coupon.name}</h5>
                {coupon.description && (
                  <p className="coupon-description">{coupon.description}</p>
                )}
                
                <div className="coupon-details">
                  {getDiscountDetails(coupon)}
                </div>
                
                <div className="coupon-expiry">
                  Son kullanma: {new Date(coupon.validUntil).toLocaleDateString('tr-TR')}
                </div>
              </div>
              
              <div className="coupon-actions">
                {coupon.canUse ? (
                  <button 
                    className="use-coupon-btn"
                    onClick={() => onCouponSelect(coupon.code)}
                  >
                    Kullan
                  </button>
                ) : (
                  <div className="cannot-use-reason">
                    {coupon.reason}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

## Admin Coupon Management

### Coupon Analytics
```javascript
// services/couponAnalytics.js
class CouponAnalytics {
  async getCouponPerformance(couponId, dateRange) {
    const pipeline = [
      {
        $match: {
          'appliedCoupons.couponId': new mongoose.Types.ObjectId(couponId),
          createdAt: {
            $gte: new Date(dateRange.start),
            $lte: new Date(dateRange.end)
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          usage: { $sum: 1 },
          totalDiscount: { $sum: '$appliedCoupons.discount' },
          totalRevenue: { $sum: '$pricing.total' },
          avgOrderValue: { $avg: '$pricing.total' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ];

    return await Order.aggregate(pipeline);
  }

  async getTopPerformingCoupons(limit = 10) {
    return await Coupon.find({ isActive: true })
      .sort({ 'statistics.totalRevenue': -1 })
      .limit(limit)
      .select('code name type statistics');
  }

  async getCouponConversionRate(couponId) {
    const totalViews = await CouponView.countDocuments({ couponId });
    const totalUsage = await Order.countDocuments({
      'appliedCoupons.couponId': couponId
    });
    
    return totalViews > 0 ? (totalUsage / totalViews) * 100 : 0;
  }
}
```

## Test Örnekleri

```javascript
describe('Coupon System', () => {
  test('should validate percentage coupon', async () => {
    const response = await request(app)
      .post('/api/coupons/validate')
      .send({
        code: 'WELCOME10',
        cartItems: [{ productId: productId, quantity: 1, price: 100 }],
        subtotal: 100
      });

    expect(response.status).toBe(200);
    expect(response.body.data.valid).toBe(true);
    expect(response.body.data.coupon.discount.discountAmount).toBe(10);
  });

  test('should reject expired coupon', async () => {
    const response = await request(app)
      .post('/api/coupons/validate')
      .send({
        code: 'EXPIRED10',
        cartItems: [{ productId: productId, quantity: 1, price: 100 }],
        subtotal: 100
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test('should create new coupon (admin)', async () => {
    const couponData = {
      code: 'TEST50',
      name: 'Test Kupon',
      type: 'percentage',
      discount: { value: 50, maxAmount: 100 },
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    };

    const response = await request(app)
      .post('/api/admin/coupons')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(couponData);

    expect(response.status).toBe(201);
    expect(response.body.data.coupon.code).toBe('TEST50');
  });
});
```

---

**Son Güncelleme**: `{new Date().toLocaleDateString('tr-TR')}` 