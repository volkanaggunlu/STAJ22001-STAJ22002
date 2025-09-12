# Review System Modülü

## Genel Bakış

Review System modülü, ürün değerlendirmeleri, yıldız puanlama sistemi, kullanıcı yorumları ve moderasyon süreçlerini yönetir. Sadece satın alan müşteriler değerlendirme yapabilir.

## Dosya Yapısı

```
src/
├── controllers/
│   └── review.js              # Review controller
├── routes/
│   └── review.js             # Review routes
├── services/
│   └── reviewService.js      # Review business logic
├── models/
│   └── Review.js             # Review model
└── validation/
    └── reviewValidation.js   # Review validation schemas
```

## Review Model Schema

```javascript
// models/Review.js
const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  pros: [String], // Artıları
  cons: [String], // Eksileri
  images: [{
    url: { type: String, required: true },
    alt: String,
    isApproved: { type: Boolean, default: false }
  }],
  helpful: {
    count: { type: Number, default: 0 },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  notHelpful: {
    count: { type: Number, default: 0 },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  isVerifiedPurchase: {
    type: Boolean,
    default: false
  },
  moderationNote: String,
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  moderatedAt: Date,
  response: {
    comment: String,
    respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    respondedAt: Date,
    isApproved: { type: Boolean, default: false }
  },
  flags: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: {
      type: String,
      enum: ['inappropriate', 'spam', 'fake', 'offensive', 'other']
    },
    description: String,
    flaggedAt: { type: Date, default: Date.now }
  }],
  metadata: {
    deviceType: String, // "mobile", "desktop", "tablet"
    location: String,
    ipAddress: String
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

// Bir kullanıcı bir ürün için sadece bir değerlendirme yapabilir
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

// Diğer indexler
reviewSchema.index({ product: 1, isApproved: 1, createdAt: -1 });
reviewSchema.index({ user: 1, createdAt: -1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ 'helpful.count': -1 });

// Satın alma doğrulaması
reviewSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Kullanıcının bu ürünü satın aldığını kontrol et
    const Order = mongoose.model('Order');
    const order = await Order.findOne({
      user: this.user,
      'items.product': this.product,
      status: 'delivered'
    });
    
    if (order) {
      this.isVerifiedPurchase = true;
      this.order = order._id;
    }
  }
  
  this.updatedAt = new Date();
  next();
});

// Ürün rating ortalamasını güncelle
reviewSchema.post('save', async function() {
  await updateProductRating(this.product);
});

reviewSchema.post('remove', async function() {
  await updateProductRating(this.product);
});

// Ürün rating güncelleme fonksiyonu
async function updateProductRating(productId) {
  const Product = mongoose.model('Product');
  
  const stats = await mongoose.model('Review').aggregate([
    {
      $match: {
        product: productId,
        isApproved: true
      }
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratings: {
          $push: '$rating'
        }
      }
    }
  ]);

  const product = await Product.findById(productId);
  if (product) {
    if (stats.length > 0) {
      product.ratings = {
        average: Math.round(stats[0].averageRating * 10) / 10,
        count: stats[0].totalReviews
      };
    } else {
      product.ratings = {
        average: 0,
        count: 0
      };
    }
    await product.save();
  }
}
```

## API Endpoints

### GET `/api/reviews/product/:productId`
Ürüne ait değerlendirmeleri getirir.

**Query Parameters:**
- `page`: Sayfa numarası (default: 1)
- `limit`: Sayfa başına değerlendirme (default: 10)
- `sort`: Sıralama (newest, oldest, rating_high, rating_low, helpful)
- `rating`: Rating filtresi (1-5)

**Response:**
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": "64f8a123456789abcdef",
        "user": {
          "id": "64f8a123456789abcdeg",
          "name": "John D.",
          "avatar": "https://example.com/avatars/john.jpg",
          "isVerified": true
        },
        "rating": 5,
        "title": "Mükemmel ürün!",
        "comment": "iPhone 15 Pro gerçekten harika. Kamera kalitesi çok iyi, performans mükemmel.",
        "pros": ["Harika kamera", "Hızlı performans", "Premium tasarım"],
        "cons": ["Fiyat biraz yüksek"],
        "images": [
          {
            "url": "https://example.com/review-images/photo1.jpg",
            "alt": "iPhone 15 Pro kullanım fotoğrafı"
          }
        ],
        "helpful": {
          "count": 15
        },
        "notHelpful": {
          "count": 2
        },
        "isVerifiedPurchase": true,
        "response": {
          "comment": "Değerlendirmeniz için teşekkürler!",
          "respondedAt": "2023-10-05T10:00:00.000Z"
        },
        "createdAt": "2023-10-02T14:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalReviews": 47
    },
    "summary": {
      "averageRating": 4.3,
      "totalReviews": 47,
      "ratingDistribution": {
        "5": 20,
        "4": 15,
        "3": 8,
        "2": 3,
        "1": 1
      },
      "verifiedPurchasePercentage": 85
    }
  }
}
```

### POST `/api/reviews`
Yeni değerlendirme oluşturur.

**Request Body:**
```json
{
  "productId": "64f8a123456789abcdef",
  "rating": 5,
  "title": "Harika ürün",
  "comment": "Bu ürünü satın aldığım için çok memnunum. Kalitesi mükemmel.",
  "pros": ["Kaliteli", "Hızlı teslimat", "Uygun fiyat"],
  "cons": ["Ambalaj biraz zayıf"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Değerlendirmeniz başarıyla gönderildi. Onay sonrası yayınlanacak.",
  "data": {
    "review": {
      "id": "64f8a123456789abcdef",
      "rating": 5,
      "title": "Harika ürün",
      "isApproved": false,
      "isVerifiedPurchase": true,
      "createdAt": "2023-10-02T14:30:00.000Z"
    }
  }
}
```

### PUT `/api/reviews/:id`
Kendi değerlendirmesini günceller.

### DELETE `/api/reviews/:id`
Kendi değerlendirmesini siler.

### POST `/api/reviews/:id/helpful`
Değerlendirmeyi faydalı olarak işaretler.

**Response:**
```json
{
  "success": true,
  "message": "Değerlendirme faydalı olarak işaretlendi",
  "data": {
    "helpfulCount": 16
  }
}
```

### POST `/api/reviews/:id/flag`
Değerlendirmeyi şikayet eder.

**Request Body:**
```json
{
  "reason": "inappropriate",
  "description": "Bu yorum ürünle ilgili değil"
}
```

### POST `/api/reviews/:id/images`
Değerlendirmeye fotoğraf ekler.

**Request:**
- Content-Type: multipart/form-data
- Field: `images` (multiple files)

### GET `/api/reviews/user`
Kullanıcının kendi değerlendirmelerini getirir.

**Response:**
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": "64f8a123456789abcdef",
        "product": {
          "id": "64f8a123456789abcdeg",
          "name": "iPhone 15 Pro",
          "image": "https://example.com/products/iphone15.jpg"
        },
        "rating": 5,
        "title": "Mükemmel ürün!",
        "isApproved": true,
        "helpful": {
          "count": 15
        },
        "createdAt": "2023-10-02T14:30:00.000Z"
      }
    ]
  }
}
```

## Admin Review Management

### GET `/api/admin/reviews`
Tüm değerlendirmeleri listeler (Admin).

**Query Parameters:**
- `status`: Durum filtresi (pending, approved, rejected)
- `rating`: Rating filtresi
- `hasFlags`: Şikayetli değerlendirmeler
- `verifiedOnly`: Sadece doğrulanmış alımlar

### PUT `/api/admin/reviews/:id/approve` (Admin)
Değerlendirmeyi onaylar.

### PUT `/api/admin/reviews/:id/reject` (Admin)
Değerlendirmeyi reddeder.

**Request Body:**
```json
{
  "reason": "Ürünle ilgili olmayan içerik"
}
```

### POST `/api/admin/reviews/:id/respond` (Admin)
Değerlendirmeye yanıt verir.

**Request Body:**
```json
{
  "comment": "Geri bildiriminiz için teşekkürler. Ambalaj konusundaki önerinizi dikkate alacağız."
}
```

## Review Service Fonksiyonları

### `getProductReviews(productId, filters, pagination)`
Ürün değerlendirmelerini getirir.

### `createReview(userId, reviewData)`
Yeni değerlendirme oluşturur.

### `updateReview(reviewId, userId, updateData)`
Değerlendirmeyi günceller.

### `deleteReview(reviewId, userId)`
Değerlendirmeyi siler.

### `markAsHelpful(reviewId, userId)`
Değerlendirmeyi faydalı olarak işaretler.

### `flagReview(reviewId, userId, flagData)`
Değerlendirmeyi şikayet eder.

### `moderateReview(reviewId, action, note)`
Değerlendirmeyi modere eder.

### `getReviewStats(productId)`
Ürün değerlendirme istatistiklerini getirir.

## Review Moderation

```javascript
// services/reviewService.js
class ReviewService {
  async moderateReview(reviewId, action, moderatorId, note = '') {
    const review = await Review.findById(reviewId);
    if (!review) {
      throw new Error('Değerlendirme bulunamadı');
    }

    switch (action) {
      case 'approve':
        review.isApproved = true;
        review.moderationNote = 'Onaylandı';
        break;
        
      case 'reject':
        review.isApproved = false;
        review.moderationNote = note || 'Reddedildi';
        break;
        
      case 'flag_for_review':
        review.isApproved = false;
        review.moderationNote = note || 'İnceleme bekliyor';
        break;
    }

    review.moderatedBy = moderatorId;
    review.moderatedAt = new Date();
    
    await review.save();

    // Kullanıcıya bildirim gönder
    await this.sendModerationNotification(review, action);

    return review;
  }

  async sendModerationNotification(review, action) {
    const user = await User.findById(review.user);
    const product = await Product.findById(review.product);
    
    const notifications = {
      approve: {
        title: 'Değerlendirmeniz Onaylandı',
        message: `${product.name} ürünü için yaptığınız değerlendirme onaylanarak yayınlandı.`
      },
      reject: {
        title: 'Değerlendirmeniz Reddedildi',
        message: `${product.name} ürünü için yaptığınız değerlendirme reddedildi. Sebep: ${review.moderationNote}`
      }
    };

    if (notifications[action]) {
      await emailService.sendNotification(user.email, notifications[action]);
    }
  }

  async getReviewStats(productId) {
    const stats = await Review.aggregate([
      {
        $match: {
          product: new mongoose.Types.ObjectId(productId),
          isApproved: true
        }
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          verifiedPurchases: {
            $sum: { $cond: ['$isVerifiedPurchase', 1, 0] }
          },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      }
    ]);

    if (stats.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        verifiedPurchasePercentage: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }

    const stat = stats[0];
    
    // Rating dağılımını hesapla
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    stat.ratingDistribution.forEach(rating => {
      distribution[rating]++;
    });

    return {
      averageRating: Math.round(stat.averageRating * 10) / 10,
      totalReviews: stat.totalReviews,
      verifiedPurchasePercentage: Math.round((stat.verifiedPurchases / stat.totalReviews) * 100),
      ratingDistribution: distribution
    };
  }

  async checkCanReview(userId, productId) {
    // Kullanıcı daha önce değerlendirme yapmış mı?
    const existingReview = await Review.findOne({
      user: userId,
      product: productId
    });

    if (existingReview) {
      return {
        canReview: false,
        reason: 'Bu ürün için zaten değerlendirme yapmışsınız'
      };
    }

    // Kullanıcı ürünü satın almış mı?
    const order = await Order.findOne({
      user: userId,
      'items.product': productId,
      status: 'delivered'
    });

    if (!order) {
      return {
        canReview: false,
        reason: 'Bu ürünü satın almanız gerekmektedir'
      };
    }

    return {
      canReview: true,
      orderId: order._id
    };
  }
}
```

## Validation Schemas

### Review Creation Validation
```javascript
const createReviewSchema = Joi.object({
  productId: Joi.string().hex().length(24).required(),
  rating: Joi.number().min(1).max(5).required(),
  title: Joi.string().min(5).max(100).required(),
  comment: Joi.string().min(10).max(1000).required(),
  pros: Joi.array().items(Joi.string().max(100)).max(5),
  cons: Joi.array().items(Joi.string().max(100)).max(5)
});
```

### Review Flag Validation
```javascript
const flagReviewSchema = Joi.object({
  reason: Joi.string().valid('inappropriate', 'spam', 'fake', 'offensive', 'other').required(),
  description: Joi.string().max(200)
});
```

## Frontend Entegrasyonu

### Review Hook (React)
```javascript
import { useState, useEffect } from 'react';

export const useReviews = (productId) => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    sort: 'newest',
    rating: null
  });

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...filters,
        ...(filters.rating && { rating: filters.rating })
      });
      
      const response = await api.get(`/reviews/product/${productId}?${params}`);
      setReviews(response.data.data.reviews);
      setStats(response.data.data.summary);
    } catch (error) {
      console.error('Reviews fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const createReview = async (reviewData) => {
    try {
      const response = await api.post('/reviews', {
        productId,
        ...reviewData
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const markAsHelpful = async (reviewId) => {
    try {
      const response = await api.post(`/reviews/${reviewId}/helpful`);
      
      // Local state güncelle
      setReviews(prev => prev.map(review => 
        review.id === reviewId 
          ? { ...review, helpful: { count: response.data.data.helpfulCount } }
          : review
      ));
      
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    if (productId) {
      fetchReviews();
    }
  }, [productId, filters]);

  return {
    reviews,
    stats,
    loading,
    filters,
    setFilters,
    createReview,
    markAsHelpful,
    refetch: fetchReviews
  };
};
```

### Review List Component
```javascript
import React from 'react';
import { useReviews } from '../hooks/useReviews';

const ReviewList = ({ productId }) => {
  const { reviews, stats, loading, filters, setFilters, markAsHelpful } = useReviews(productId);

  if (loading) return <div>Değerlendirmeler yükleniyor...</div>;

  const handleHelpful = async (reviewId) => {
    try {
      await markAsHelpful(reviewId);
    } catch (error) {
      alert('İşlem başarısız');
    }
  };

  const renderStars = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const renderRatingDistribution = () => {
    if (!stats) return null;

    return (
      <div className="rating-distribution">
        <h4>Değerlendirme Dağılımı</h4>
        {[5, 4, 3, 2, 1].map(rating => (
          <div key={rating} className="rating-bar">
            <span className="rating-label">{rating} ★</span>
            <div className="bar-container">
              <div 
                className="bar-fill"
                style={{ 
                  width: `${(stats.ratingDistribution[rating] / stats.totalReviews) * 100}%` 
                }}
              ></div>
            </div>
            <span className="rating-count">({stats.ratingDistribution[rating]})</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="review-section">
      {stats && (
        <div className="review-summary">
          <div className="average-rating">
            <div className="rating-number">{stats.averageRating}</div>
            <div className="rating-stars">{renderStars(Math.round(stats.averageRating))}</div>
            <div className="rating-text">{stats.totalReviews} değerlendirme</div>
          </div>
          
          {renderRatingDistribution()}
        </div>
      )}

      <div className="review-filters">
        <select
          value={filters.sort}
          onChange={(e) => setFilters({...filters, sort: e.target.value})}
        >
          <option value="newest">En Yeni</option>
          <option value="oldest">En Eski</option>
          <option value="rating_high">En Yüksek Puan</option>
          <option value="rating_low">En Düşük Puan</option>
          <option value="helpful">En Faydalı</option>
        </select>

        <select
          value={filters.rating || ''}
          onChange={(e) => setFilters({...filters, rating: e.target.value || null})}
        >
          <option value="">Tüm Puanlar</option>
          <option value="5">5 Yıldız</option>
          <option value="4">4 Yıldız</option>
          <option value="3">3 Yıldız</option>
          <option value="2">2 Yıldız</option>
          <option value="1">1 Yıldız</option>
        </select>
      </div>

      <div className="review-list">
        {reviews.map(review => (
          <div key={review.id} className="review-item">
            <div className="review-header">
              <div className="user-info">
                <img src={review.user.avatar} alt={review.user.name} />
                <div>
                  <div className="user-name">
                    {review.user.name}
                    {review.isVerifiedPurchase && (
                      <span className="verified-badge">✓ Doğrulanmış Alım</span>
                    )}
                  </div>
                  <div className="review-date">
                    {new Date(review.createdAt).toLocaleDateString('tr-TR')}
                  </div>
                </div>
              </div>
              <div className="review-rating">
                {renderStars(review.rating)}
              </div>
            </div>

            <div className="review-content">
              <h4 className="review-title">{review.title}</h4>
              <p className="review-comment">{review.comment}</p>

              {review.pros.length > 0 && (
                <div className="review-pros">
                  <strong>Artıları:</strong>
                  <ul>
                    {review.pros.map((pro, index) => (
                      <li key={index}>{pro}</li>
                    ))}
                  </ul>
                </div>
              )}

              {review.cons.length > 0 && (
                <div className="review-cons">
                  <strong>Eksileri:</strong>
                  <ul>
                    {review.cons.map((con, index) => (
                      <li key={index}>{con}</li>
                    ))}
                  </ul>
                </div>
              )}

              {review.images.length > 0 && (
                <div className="review-images">
                  {review.images.map((image, index) => (
                    <img key={index} src={image.url} alt={image.alt} />
                  ))}
                </div>
              )}
            </div>

            {review.response && (
              <div className="review-response">
                <strong>Mağaza Yanıtı:</strong>
                <p>{review.response.comment}</p>
                <small>
                  {new Date(review.response.respondedAt).toLocaleDateString('tr-TR')}
                </small>
              </div>
            )}

            <div className="review-actions">
              <button 
                className="helpful-btn"
                onClick={() => handleHelpful(review.id)}
              >
                👍 Faydalı ({review.helpful.count})
              </button>
              <button className="flag-btn">
                🚩 Şikayet Et
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Review Form Component
```javascript
import React, { useState } from 'react';

const ReviewForm = ({ productId, onSuccess }) => {
  const [formData, setFormData] = useState({
    rating: 5,
    title: '',
    comment: '',
    pros: [''],
    cons: ['']
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const reviewData = {
        ...formData,
        pros: formData.pros.filter(pro => pro.trim()),
        cons: formData.cons.filter(con => con.trim())
      };

      await api.post('/reviews', { productId, ...reviewData });
      alert('Değerlendirmeniz başarıyla gönderildi!');
      onSuccess();
    } catch (error) {
      alert('Değerlendirme gönderilirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const addProCon = (type) => {
    setFormData(prev => ({
      ...prev,
      [type]: [...prev[type], '']
    }));
  };

  const removeProCon = (type, index) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const updateProCon = (type, index, value) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].map((item, i) => i === index ? value : item)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="review-form">
      <h3>Değerlendirme Yaz</h3>

      <div className="rating-input">
        <label>Puanınız:</label>
        <div className="star-rating">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              className={`star ${star <= formData.rating ? 'active' : ''}`}
              onClick={() => setFormData({...formData, rating: star})}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>Başlık:</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          placeholder="Değerlendirmenizin başlığı"
          required
        />
      </div>

      <div className="form-group">
        <label>Yorumunuz:</label>
        <textarea
          value={formData.comment}
          onChange={(e) => setFormData({...formData, comment: e.target.value})}
          placeholder="Ürün hakkındaki görüşlerinizi yazın"
          rows="4"
          required
        />
      </div>

      <div className="pros-cons">
        <div className="pros">
          <label>Artıları:</label>
          {formData.pros.map((pro, index) => (
            <div key={index} className="pro-con-input">
              <input
                type="text"
                value={pro}
                onChange={(e) => updateProCon('pros', index, e.target.value)}
                placeholder="Ürünün bir artısı"
              />
              {formData.pros.length > 1 && (
                <button 
                  type="button" 
                  onClick={() => removeProCon('pros', index)}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={() => addProCon('pros')}>
            + Artı Ekle
          </button>
        </div>

        <div className="cons">
          <label>Eksileri:</label>
          {formData.cons.map((con, index) => (
            <div key={index} className="pro-con-input">
              <input
                type="text"
                value={con}
                onChange={(e) => updateProCon('cons', index, e.target.value)}
                placeholder="Ürünün bir eksisi"
              />
              {formData.cons.length > 1 && (
                <button 
                  type="button" 
                  onClick={() => removeProCon('cons', index)}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={() => addProCon('cons')}>
            + Eksi Ekle
          </button>
        </div>
      </div>

      <button type="submit" disabled={loading} className="submit-btn">
        {loading ? 'Gönderiliyor...' : 'Değerlendirmeyi Gönder'}
      </button>
    </form>
  );
};
```

## Test Örnekleri

```javascript
describe('Review System', () => {
  test('should create review for purchased product', async () => {
    const reviewData = {
      productId: productId,
      rating: 5,
      title: 'Harika ürün',
      comment: 'Çok memnun kaldım'
    };

    const response = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${userToken}`)
      .send(reviewData);

    expect(response.status).toBe(201);
    expect(response.body.data.review.isVerifiedPurchase).toBe(true);
  });

  test('should get product reviews', async () => {
    const response = await request(app)
      .get(`/api/reviews/product/${productId}`);

    expect(response.status).toBe(200);
    expect(response.body.data.reviews).toBeInstanceOf(Array);
    expect(response.body.data.summary.averageRating).toBeDefined();
  });

  test('should mark review as helpful', async () => {
    const response = await request(app)
      .post(`/api/reviews/${reviewId}/helpful`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.helpfulCount).toBeGreaterThan(0);
  });
});
```

---

**Son Güncelleme**: `{new Date().toLocaleDateString('tr-TR')}` 