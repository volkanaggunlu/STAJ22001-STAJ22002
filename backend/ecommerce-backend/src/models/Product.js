const mongoose = require('mongoose');

const specificationSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    trim: true
  },
  value: {
    type: String,
    required: true,
    trim: true
  }
}, { _id: false });

const bundleItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  image: {
    type: String,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Ürün adı zorunludur'],
    trim: true,
    minlength: [3, 'Ürün adı en az 3 karakter olmalıdır'],
    maxlength: [200, 'Ürün adı en fazla 200 karakter olabilir']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Ürün açıklaması zorunludur'],
    trim: true,
    minlength: [10, 'Ürün açıklaması en az 10 karakter olmalıdır']
  },
  shortDescription: {
    type: String,
    trim: true,
    maxlength: [500, 'Kısa açıklama en fazla 500 karakter olabilir']
  },
  price: {
    type: Number,
    required: [true, 'Fiyat zorunludur'],
    min: [0, 'Fiyat negatif olamaz']
  },
  originalPrice: {
    type: Number,
    min: [0, 'Orijinal fiyat negatif olamaz']
  },
  discountPercentage: {
    type: Number,
    min: [0, 'İndirim oranı negatif olamaz'],
    max: [100, 'İndirim oranı %100\'den fazla olamaz']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Kategori zorunludur']
  },
  subCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  brand: {
    type: String,
    required: [true, 'Marka zorunludur'],
    trim: true
  },
  sku: {
    type: String,
    required: [true, 'SKU zorunludur'],
    unique: true,
    trim: true,
    uppercase: true
  },
  images: [{
    url: {
      type: String,
      required: true,
      trim: true
    },
    alt: {
      type: String,
      trim: true
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  stock: {
    quantity: {
      type: Number,
      required: true,
      min: [0, 'Stok miktarı negatif olamaz'],
      default: 0
    },
    lowStockThreshold: {
      type: Number,
      default: 5
    },
    trackStock: {
      type: Boolean,
      default: true
    }
  },
  specifications: [specificationSchema],
  features: [{
    type: String,
    trim: true
  }],
  type: {
    type: String,
    enum: ['product', 'bundle'],
    required: [true, 'Ürün tipi zorunludur'],
    default: 'product'
  },
  // Bundle/Set özel alanları
  bundleItems: {
    type: [bundleItemSchema],
    validate: {
      validator: function(items) {
        return this.type !== 'bundle' || items.length > 0;
      },
      message: 'Paket ürünleri için en az bir item gereklidir'
    }
  },
  bundleType: {
    type: String,
    enum: ['kit', 'set', 'package', 'bundle'],
    required: function() {
      return this.type === 'bundle';
    }
  },
  itemCount: {
    type: Number,
    min: 1,
    validate: {
      validator: function(value) {
        return this.type !== 'bundle' || value > 0;
      },
      message: 'Paket ürünleri için parça sayısı belirtilmelidir'
    }
  },
  // SEO ve Meta
  seo: {
    title: {
      type: String,
      trim: true,
      maxlength: [60, 'SEO title en fazla 60 karakter olabilir']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [160, 'SEO description en fazla 160 karakter olabilir']
    },
    keywords: [{
      type: String,
      trim: true
    }]
  },
  // Değerlendirme ve İstatistikler
  rating: {
    average: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    count: {
      type: Number,
      min: 0,
      default: 0
    },
    distribution: {
      five: { type: Number, default: 0 },
      four: { type: Number, default: 0 },
      three: { type: Number, default: 0 },
      two: { type: Number, default: 0 },
      one: { type: Number, default: 0 }
    }
  },
  reviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  }],
  // Durumlar
  status: {
    type: String,
    enum: ['active', 'inactive', 'discontinued'],
    default: 'active'
  },
  isNew: {
    type: Boolean,
    default: false
  },
  isBestseller: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  // Kargo ve Teslimat
  shipping: {
    weight: {
      type: Number,
      min: 0
    },
    dimensions: {
      length: { type: Number, min: 0 },
      width: { type: Number, min: 0 },
      height: { type: Number, min: 0 }
    },
    freeShipping: {
      type: Boolean,
      default: false
    },
    shippingTime: {
      type: String,
      enum: ['same-day', '1-2-days', '2-3-days', '3-5-days', '5-7-days'],
      default: '2-3-days'
    }
  },
  // İstatistikler
  stats: {
    views: {
      type: Number,
      default: 0
    },
    purchases: {
      type: Number,
      default: 0
    },
    addedToCart: {
      type: Number,
      default: 0
    },
    addedToWishlist: {
      type: Number,
      default: 0
    }
  },
  // Tarihler
  publishedAt: {
    type: Date,
    default: Date.now
  },
  lastModified: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes - Duplike indeksleri kaldırdım
productSchema.index({ name: 'text', description: 'text', brand: 'text' });
productSchema.index({ category: 1, subCategory: 1 });
productSchema.index({ slug: 1 }, { unique: true });
productSchema.index({ sku: 1 }, { unique: true });
productSchema.index({ status: 1, isNew: 1, isBestseller: 1 });
productSchema.index({ 'stock.quantity': 1 });

// Virtuals
productSchema.virtual('isInStock').get(function() {
  return this.stock.quantity > 0;
});

productSchema.virtual('isLowStock').get(function() {
  return this.stock.quantity <= this.stock.lowStockThreshold;
});

productSchema.virtual('hasDiscount').get(function() {
  return this.originalPrice && this.originalPrice > this.price;
});

productSchema.virtual('totalBundleValue').get(function() {
  if (this.type !== 'bundle') return null;
  return this.bundleItems.reduce((total, item) => total + (item.price * item.quantity), 0);
});

productSchema.virtual('bundleSavings').get(function() {
  if (this.type !== 'bundle') return null;
  const totalValue = this.totalBundleValue;
  return totalValue ? totalValue - this.price : 0;
});

// Pre-save middleware
productSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
  
  if (this.originalPrice && this.price) {
    this.discountPercentage = Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }
  
  this.lastModified = new Date();
  next();
});

// Static methods
productSchema.statics.findByCategory = function(category) {
  return this.find({ category, status: 'active' });
};

productSchema.statics.findFeatured = function() {
  return this.find({ isFeatured: true, status: 'active' });
};

productSchema.statics.findBestsellers = function() {
  return this.find({ isBestseller: true, status: 'active' });
};

productSchema.statics.findByType = function(type) {
  return this.find({ type, status: 'active' });
};

// Instance methods
productSchema.methods.incrementViews = function() {
  this.stats.views += 1;
  return this.save();
};

productSchema.methods.updateStock = function(quantity) {
  if (this.stock.trackStock) {
    this.stock.quantity += quantity;
    if (this.stock.quantity < 0) {
      this.stock.quantity = 0;
    }
  }
  return this.save();
};

productSchema.methods.updateRating = function(newRating) {
  const oldAverage = this.rating.average;
  const oldCount = this.rating.count;
  
  this.rating.count += 1;
  this.rating.average = ((oldAverage * oldCount) + newRating) / this.rating.count;
  
  // Update distribution
  this.rating.distribution[this.getRatingKey(newRating)] += 1;
  
  return this.save();
};

productSchema.methods.getRatingKey = function(rating) {
  if (rating >= 4.5) return 'five';
  if (rating >= 3.5) return 'four';
  if (rating >= 2.5) return 'three';
  if (rating >= 1.5) return 'two';
  return 'one';
};

module.exports = mongoose.model('Product', productSchema); 