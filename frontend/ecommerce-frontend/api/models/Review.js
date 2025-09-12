const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  rating: {
    type: Number,
    required: [true, 'Puan zorunludur'],
    min: [1, 'Puan en az 1 olmalıdır'],
    max: [5, 'Puan en fazla 5 olabilir']
  },
  title: {
    type: String,
    required: [true, 'Değerlendirme başlığı zorunludur'],
    trim: true,
    maxlength: [100, 'Başlık en fazla 100 karakter olabilir']
  },
  comment: {
    type: String,
    required: [true, 'Yorum zorunludur'],
    trim: true,
    minlength: [10, 'Yorum en az 10 karakter olmalıdır'],
    maxlength: [1000, 'Yorum en fazla 1000 karakter olabilir']
  },
  pros: [{
    type: String,
    trim: true,
    maxlength: [100, 'Artı yön en fazla 100 karakter olabilir']
  }],
  cons: [{
    type: String,
    trim: true,
    maxlength: [100, 'Eksi yön en fazla 100 karakter olabilir']
  }],
  images: [{
    url: {
      type: String,
      required: true,
      trim: true
    },
    caption: {
      type: String,
      trim: true,
      maxlength: [100, 'Resim açıklaması en fazla 100 karakter olabilir']
    }
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  // Yardımcı bilgiler
  helpful: {
    count: {
      type: Number,
      default: 0
    },
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  reported: {
    count: {
      type: Number,
      default: 0
    },
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    reasons: [{
      type: String,
      enum: ['spam', 'inappropriate', 'fake', 'other']
    }]
  },
  // Yanıtlar
  responses: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, 'Yanıt en fazla 500 karakter olabilir']
    },
    isFromSeller: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
reviewSchema.index({ productId: 1, rating: -1 });
reviewSchema.index({ userId: 1 });
reviewSchema.index({ status: 1 });
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ isApproved: 1 });

// Compound index - bir kullanıcı aynı ürün için sadece bir değerlendirme yapabilir
reviewSchema.index({ userId: 1, productId: 1 }, { unique: true });

// Virtuals
reviewSchema.virtual('isHelpful').get(function() {
  return this.helpful.count > 0;
});

reviewSchema.virtual('isReported').get(function() {
  return this.reported.count > 0;
});

reviewSchema.virtual('hasResponses').get(function() {
  return this.responses.length > 0;
});

// Pre-save middleware
reviewSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'approved') {
    this.isApproved = true;
    this.approvedAt = new Date();
  }
  
  if (this.isModified('status') && this.status === 'rejected') {
    this.isApproved = false;
    this.approvedAt = null;
  }
  
  next();
});

// Post-save middleware - ürün rating'ini güncelle
reviewSchema.post('save', async function(doc) {
  if (doc.isApproved) {
    const Product = mongoose.model('Product');
    const product = await Product.findById(doc.productId);
    
    if (product) {
      await product.updateRating(doc.rating);
    }
  }
});

// Static methods
reviewSchema.statics.findByProduct = function(productId) {
  return this.find({ productId, isApproved: true }).sort({ createdAt: -1 });
};

reviewSchema.statics.findByUser = function(userId) {
  return this.find({ userId }).sort({ createdAt: -1 });
};

reviewSchema.statics.findPending = function() {
  return this.find({ status: 'pending' }).sort({ createdAt: -1 });
};

reviewSchema.statics.getProductRatingStats = async function(productId) {
  const stats = await this.aggregate([
    {
      $match: { productId: new mongoose.Types.ObjectId(productId), isApproved: true }
    },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let totalRating = 0;
  let totalCount = 0;
  
  stats.forEach(stat => {
    distribution[stat._id] = stat.count;
    totalRating += stat._id * stat.count;
    totalCount += stat.count;
  });
  
  return {
    average: totalCount > 0 ? totalRating / totalCount : 0,
    count: totalCount,
    distribution
  };
};

// Instance methods
reviewSchema.methods.approve = function(approvedBy) {
  this.status = 'approved';
  this.isApproved = true;
  this.approvedBy = approvedBy;
  this.approvedAt = new Date();
  return this.save();
};

reviewSchema.methods.reject = function(reason) {
  this.status = 'rejected';
  this.isApproved = false;
  this.rejectionReason = reason;
  this.approvedBy = null;
  this.approvedAt = null;
  return this.save();
};

reviewSchema.methods.markHelpful = function(userId) {
  if (!this.helpful.users.includes(userId)) {
    this.helpful.users.push(userId);
    this.helpful.count += 1;
    return this.save();
  }
  return Promise.resolve(this);
};

reviewSchema.methods.unmarkHelpful = function(userId) {
  const index = this.helpful.users.indexOf(userId);
  if (index > -1) {
    this.helpful.users.splice(index, 1);
    this.helpful.count -= 1;
    return this.save();
  }
  return Promise.resolve(this);
};

reviewSchema.methods.report = function(userId, reason) {
  if (!this.reported.users.includes(userId)) {
    this.reported.users.push(userId);
    this.reported.reasons.push(reason);
    this.reported.count += 1;
    return this.save();
  }
  return Promise.resolve(this);
};

reviewSchema.methods.addResponse = function(userId, message, isFromSeller = false) {
  this.responses.push({
    userId,
    message,
    isFromSeller,
    createdAt: new Date()
  });
  return this.save();
};

module.exports = mongoose.model('Review', reviewSchema); 