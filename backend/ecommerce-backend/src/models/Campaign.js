const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Kampanya adı zorunludur'],
    trim: true,
    maxlength: [100, 'Kampanya adı en fazla 100 karakter olabilir']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Açıklama en fazla 500 karakter olabilir']
  },
  type: {
    type: String,
    enum: ['discount', 'free_shipping', 'gift', 'bundle', 'flash_sale', 'seasonal'],
    required: [true, 'Kampanya tipi zorunludur']
  },
  // Kampanya kuralları
  rules: {
    // Minimum sipariş tutarı
    minOrderAmount: {
      type: Number,
      min: [0, 'Minimum sipariş tutarı negatif olamaz'],
      default: 0
    },
    // Maksimum sipariş tutarı
    maxOrderAmount: {
      type: Number,
      min: [0, 'Maksimum sipariş tutarı negatif olamaz']
    },
    // Ürün kategorileri
    applicableCategories: [{
      type: String,
      trim: true
    }],
    // Ürün markaları
    applicableBrands: [{
      type: String,
      trim: true
    }],
    // Belirli ürünler
    applicableProducts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }],
    // Hariç tutulacak ürünler
    excludedProducts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }],
    // Kullanıcı grupları
    userGroups: [{
      type: String,
      enum: ['new', 'returning', 'vip', 'all'],
      default: 'all'
    }],
    // Belirli kullanıcılar
    applicableUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    // Hariç tutulacak kullanıcılar
    excludedUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    // Minimum ürün adedi
    minProductCount: {
      type: Number,
      min: [1, 'Minimum ürün adedi en az 1 olmalıdır'],
      default: 1
    },
    // Maksimum ürün adedi
    maxProductCount: {
      type: Number,
      min: [1, 'Maksimum ürün adedi en az 1 olmalıdır']
    }
  },
  // İndirim detayları
  discount: {
    type: {
      type: String,
      enum: ['percentage', 'fixed', 'free_shipping'],
      required: [true, 'İndirim tipi zorunludur']
    },
    value: {
      type: Number,
      required: [true, 'İndirim değeri zorunludur'],
      min: [0, 'İndirim değeri negatif olamaz']
    },
    maxDiscountAmount: {
      type: Number,
      min: [0, 'Maksimum indirim tutarı negatif olamaz']
    }
  },
  // Kampanya durumu
  isActive: {
    type: Boolean,
    default: true
  },
  isAutoApply: {
    type: Boolean,
    default: false
  },
  priority: {
    type: Number,
    default: 1,
    min: [1, 'Öncelik en az 1 olmalıdır']
  },
  // Tarih sınırları
  startDate: {
    type: Date,
    required: [true, 'Başlangıç tarihi zorunludur']
  },
  endDate: {
    type: Date,
    required: [true, 'Bitiş tarihi zorunludur'],
    validate: {
      validator: function(value) {
        return value > this.startDate;
      },
      message: 'Bitiş tarihi başlangıç tarihinden sonra olmalıdır'
    }
  },
  // İstatistikler
  stats: {
    totalUses: {
      type: Number,
      default: 0
    },
    totalDiscount: {
      type: Number,
      default: 0
    },
    totalOrderValue: {
      type: Number,
      default: 0
    },
    uniqueUsers: {
      type: Number,
      default: 0
    }
  },
  // Kullanım geçmişi
  usageHistory: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true
    },
    orderAmount: {
      type: Number,
      required: true
    },
    discountAmount: {
      type: Number,
      required: true
    },
    usedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Oluşturan
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
campaignSchema.index({ isActive: 1 });
campaignSchema.index({ startDate: 1, endDate: 1 });
campaignSchema.index({ type: 1 });
campaignSchema.index({ priority: 1 });

// Virtuals
campaignSchema.virtual('isExpired').get(function() {
  return Date.now() > this.endDate.getTime();
});

campaignSchema.virtual('isNotStarted').get(function() {
  return Date.now() < this.startDate.getTime();
});

campaignSchema.virtual('isValid').get(function() {
  return this.isActive && !this.isExpired && !this.isNotStarted;
});

// Static methods
campaignSchema.statics.findActive = function() {
  const now = new Date();
  return this.find({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now }
  }).sort({ priority: -1 });
};

campaignSchema.statics.findForUser = function(userId, orderAmount = 0, items = []) {
  const now = new Date();
  return this.find({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
    $or: [
      { 'rules.applicableUsers': userId },
      { 'rules.applicableUsers': { $size: 0 } }
    ],
    'rules.excludedUsers': { $nin: [userId] }
  }).sort({ priority: -1 });
};

// Instance methods
campaignSchema.methods.canApply = function(userId, orderAmount, items = []) {
  if (!this.isActive) return { valid: false, reason: 'Kampanya aktif değil' };
  if (this.isExpired) return { valid: false, reason: 'Kampanya süresi dolmuş' };
  if (this.isNotStarted) return { valid: false, reason: 'Kampanya henüz başlamamış' };
  
  // Minimum sipariş tutarı kontrolü
  if (orderAmount < this.rules.minOrderAmount) {
    return { 
      valid: false, 
      reason: `Minimum sipariş tutarı ₺${this.rules.minOrderAmount}` 
    };
  }
  
  // Maksimum sipariş tutarı kontrolü
  if (this.rules.maxOrderAmount && orderAmount > this.rules.maxOrderAmount) {
    return { 
      valid: false, 
      reason: `Maksimum sipariş tutarı ₺${this.rules.maxOrderAmount}` 
    };
  }
  
  // Kullanıcı kontrolü
  if (userId) {
    if (this.rules.excludedUsers.includes(userId)) {
      return { valid: false, reason: 'Bu kampanya sizin için geçerli değil' };
    }
    
    if (this.rules.applicableUsers.length > 0 && !this.rules.applicableUsers.includes(userId)) {
      return { valid: false, reason: 'Bu kampanya sizin için geçerli değil' };
    }
  }
  
  // Ürün kontrolü
  if (items.length > 0) {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    
    if (totalItems < this.rules.minProductCount) {
      return { 
        valid: false, 
        reason: `Minimum ${this.rules.minProductCount} ürün seçmelisiniz` 
      };
    }
    
    if (this.rules.maxProductCount && totalItems > this.rules.maxProductCount) {
      return { 
        valid: false, 
        reason: `Maksimum ${this.rules.maxProductCount} ürün seçebilirsiniz` 
      };
    }
  }
  
  return { valid: true };
};

campaignSchema.methods.calculateDiscount = function(orderAmount) {
  if (this.discount.type === 'percentage') {
    let discount = (orderAmount * this.discount.value) / 100;
    
    if (this.discount.maxDiscountAmount && discount > this.discount.maxDiscountAmount) {
      discount = this.discount.maxDiscountAmount;
    }
    
    return Math.round(discount * 100) / 100;
  } else if (this.discount.type === 'fixed') {
    return Math.min(this.discount.value, orderAmount);
  } else if (this.discount.type === 'free_shipping') {
    // Ücretsiz kargo için sabit değer döndür
    return 29.90; // Varsayılan kargo ücreti
  }
  
  return 0;
};

campaignSchema.methods.apply = function(userId, orderId, orderAmount) {
  const discountAmount = this.calculateDiscount(orderAmount);
  
  this.stats.totalUses += 1;
  this.stats.totalDiscount += discountAmount;
  this.stats.totalOrderValue += orderAmount;
  
  // Unique users hesapla
  const isNewUser = !this.usageHistory.some(
    usage => usage.userId.toString() === userId.toString()
  );
  
  if (isNewUser) {
    this.stats.uniqueUsers += 1;
  }
  
  this.usageHistory.push({
    userId,
    orderId,
    orderAmount,
    discountAmount,
    usedAt: new Date()
  });
  
  return this.save();
};

module.exports = mongoose.model('Campaign', campaignSchema); 