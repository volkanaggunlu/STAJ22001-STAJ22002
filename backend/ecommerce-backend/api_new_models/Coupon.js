const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Kupon kodu zorunludur'],
    unique: true,
    uppercase: true,
    trim: true,
    minlength: [3, 'Kupon kodu en az 3 karakter olmalıdır'],
    maxlength: [20, 'Kupon kodu en fazla 20 karakter olabilir']
  },
  name: {
    type: String,
    required: [true, 'Kupon adı zorunludur'],
    trim: true,
    maxlength: [100, 'Kupon adı en fazla 100 karakter olabilir']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Açıklama en fazla 500 karakter olabilir']
  },
  type: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: [true, 'Kupon tipi zorunludur']
  },
  value: {
    type: Number,
    required: [true, 'Kupon değeri zorunludur'],
    min: [0, 'Kupon değeri negatif olamaz']
  },
  // Kullanım koşulları
  minOrderAmount: {
    type: Number,
    min: [0, 'Minimum sipariş tutarı negatif olamaz'],
    default: 0
  },
  maxDiscountAmount: {
    type: Number,
    min: [0, 'Maksimum indirim tutarı negatif olamaz']
  },
  // Kullanım limitleri
  usageLimit: {
    type: Number,
    min: [1, 'Kullanım limiti en az 1 olmalıdır'],
    default: 1
  },
  usageLimitPerUser: {
    type: Number,
    min: [1, 'Kullanıcı başına kullanım limiti en az 1 olmalıdır'],
    default: 1
  },
  usedCount: {
    type: Number,
    default: 0,
    min: 0
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
  // Hedefleme
  applicableProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  applicableCategories: [{
    type: String,
    trim: true
  }],
  applicableBrands: [{
    type: String,
    trim: true
  }],
  excludedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  // Kullanıcı hedefleme
  applicableUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  excludedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  userGroups: [{
    type: String,
    enum: ['new', 'returning', 'vip', 'all'],
    default: 'all'
  }],
  // Durum
  isActive: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  // Kupon türü
  couponType: {
    type: String,
    enum: ['general', 'first-order', 'birthday', 'loyalty', 'referral', 'seasonal'],
    default: 'general'
  },
  // Otomatik uygulama
  autoApply: {
    type: Boolean,
    default: false
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
couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1 });
couponSchema.index({ startDate: 1, endDate: 1 });
couponSchema.index({ couponType: 1 });

// Virtuals
couponSchema.virtual('isExpired').get(function() {
  return Date.now() > this.endDate.getTime();
});

couponSchema.virtual('isNotStarted').get(function() {
  return Date.now() < this.startDate.getTime();
});

couponSchema.virtual('isValid').get(function() {
  return this.isActive && !this.isExpired && !this.isNotStarted;
});

couponSchema.virtual('isUsageLimitReached').get(function() {
  return this.usedCount >= this.usageLimit;
});

couponSchema.virtual('remainingUses').get(function() {
  return Math.max(0, this.usageLimit - this.usedCount);
});

couponSchema.virtual('conversionRate').get(function() {
  if (this.stats.totalUses === 0) return 0;
  return (this.stats.uniqueUsers / this.stats.totalUses) * 100;
});

// Static methods
couponSchema.statics.findByCode = function(code) {
  return this.findOne({ code: code.toUpperCase(), isActive: true });
};

couponSchema.statics.findActive = function() {
  const now = new Date();
  return this.find({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now }
  });
};

couponSchema.statics.findExpired = function() {
  const now = new Date();
  return this.find({
    endDate: { $lt: now }
  });
};

couponSchema.statics.findByType = function(type) {
  return this.find({ couponType: type, isActive: true });
};

couponSchema.statics.findForUser = function(userId) {
  const now = new Date();
  return this.find({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
    $or: [
      { applicableUsers: userId },
      { applicableUsers: { $size: 0 } }
    ],
    excludedUsers: { $nin: [userId] }
  });
};

// Instance methods
couponSchema.methods.canUse = function(userId = null, orderAmount = 0) {
  if (!this.isActive) return { valid: false, reason: 'Kupon aktif değil' };
  if (this.isExpired) return { valid: false, reason: 'Kupon süresi dolmuş' };
  if (this.isNotStarted) return { valid: false, reason: 'Kupon henüz başlamamış' };
  if (this.isUsageLimitReached) return { valid: false, reason: 'Kullanım limiti dolmuş' };
  
  if (orderAmount < this.minOrderAmount) {
    return { 
      valid: false, 
      reason: `Minimum sipariş tutarı ₺${this.minOrderAmount}` 
    };
  }
  
  if (userId) {
    if (this.excludedUsers.includes(userId)) {
      return { valid: false, reason: 'Bu kupon sizin için geçerli değil' };
    }
    
    if (this.applicableUsers.length > 0 && !this.applicableUsers.includes(userId)) {
      return { valid: false, reason: 'Bu kupon sizin için geçerli değil' };
    }
    
    const userUsageCount = this.usageHistory.filter(
      usage => usage.userId.toString() === userId.toString()
    ).length;
    
    if (userUsageCount >= this.usageLimitPerUser) {
      return { valid: false, reason: 'Kullanım limitiniz dolmuş' };
    }
  }
  
  return { valid: true };
};

couponSchema.methods.calculateDiscount = function(orderAmount) {
  if (this.type === 'percentage') {
    let discount = (orderAmount * this.value) / 100;
    
    if (this.maxDiscountAmount && discount > this.maxDiscountAmount) {
      discount = this.maxDiscountAmount;
    }
    
    return Math.round(discount * 100) / 100;
  } else {
    return Math.min(this.value, orderAmount);
  }
};

couponSchema.methods.use = function(userId, orderId, orderAmount) {
  const discountAmount = this.calculateDiscount(orderAmount);
  
  this.usedCount += 1;
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

couponSchema.methods.isApplicableToProduct = function(productId) {
  if (this.applicableProducts.length === 0) return true;
  return this.applicableProducts.includes(productId);
};

couponSchema.methods.isApplicableToCategory = function(category) {
  if (this.applicableCategories.length === 0) return true;
  return this.applicableCategories.includes(category);
};

couponSchema.methods.isApplicableToBrand = function(brand) {
  if (this.applicableBrands.length === 0) return true;
  return this.applicableBrands.includes(brand);
};

couponSchema.methods.getUserUsageCount = function(userId) {
  return this.usageHistory.filter(
    usage => usage.userId.toString() === userId.toString()
  ).length;
};

module.exports = mongoose.model('Coupon', couponSchema); 