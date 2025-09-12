const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
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
  image: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  originalPrice: {
    type: Number,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  sku: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['product', 'bundle'],
    required: true
  },
  bundleItems: [{
    productId: mongoose.Schema.Types.ObjectId,
    name: String,
    quantity: Number,
    price: Number
  }]
}, { _id: false });

const shippingAddressSchema = new mongoose.Schema({
  title: {
    type: String,
    required: false,
    trim: true,
    default: 'Ev'
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: false,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  district: {
    type: String,
    required: true,
    trim: true
  },
  postalCode: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  }
}, { _id: false });

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    required: true,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned']
  },
  date: {
    type: Date,
    default: Date.now
  },
  note: {
    type: String,
    trim: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { _id: false });

// Fatura adresi şeması (firma için zorunlu alanlar dahil)
const invoiceAddressSchema = new mongoose.Schema({
  firstName: { type: String, required: false, trim: true },
  lastName: { type: String, required: false, trim: true },
  email: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  district: { type: String, required: true, trim: true },
  postalCode: { type: String, required: true, trim: true },
  companyName: { type: String, trim: true },
  taxNumber: { type: String, trim: true },
  taxOffice: { type: String, trim: true },
  eInvoiceAddress: { type: String, trim: true },
  tckn: { type: String, trim: true }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    default: function() { return this.generateOrderNumber(); }
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [orderItemSchema],
  totalItems: {
    type: Number,
    required: true,
    min: 1
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  shippingCost: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  taxAmount: {
    type: Number,
    min: 0,
    default: 0
  },
  discountAmount: {
    type: Number,
    min: 0,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'TRY'
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
    default: 'pending'
  },
  statusHistory: [statusHistorySchema],
  shippingAddress: {
    type: shippingAddressSchema,
    required: true
  },
  billingAddress: {
    type: invoiceAddressSchema,
    required: true
  },
  shippingMethod: {
    type: String,
    enum: ['standard', 'express', 'same-day'],
    default: 'standard'
  },
  shippingTime: {
    type: String,
    enum: ['same-day', '1-2-days', '2-3-days', '3-5-days', '5-7-days'],
    default: '2-3-days'
  },
  tracking: {
    trackingNumber: {
      type: String,
      trim: true
    },
    carrier: {
      type: String,
      trim: true,
      enum: ['aras', 'mng', 'yurtici', 'ptt', 'ups', 'dhl', 'fedex', '']
    },
    service: {
      type: String,
      enum: ['standard', 'express', 'nextday', ''],
      default: 'standard'
    },
    status: {
      type: String,
      enum: ['pending', 'created', 'picked_up', 'in_transit', 'delivered', 'failed'],
      default: 'pending'
    },
    trackingUrl: {
      type: String,
      trim: true
    },
    estimatedDelivery: Date,
    actualDelivery: Date,
    weight: {
      type: Number,
      min: 0
    },
    dimensions: {
      length: {
        type: Number,
        min: 0
      },
      width: {
        type: Number,
        min: 0
      },
      height: {
        type: Number,
        min: 0
      }
    },
    insuranceValue: {
      type: Number,
      min: 0,
      default: 0
    },
    labelUrl: {
      type: String,
      trim: true
    },
    specialInstructions: {
      type: String,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  payment: {
    method: {
      type: String,
      enum: ['credit-card', 'debit-card', 'bank-transfer', 'cash-on-delivery'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    transactionId: {
      type: String,
      trim: true
    },
    paymentDate: Date,
    refundDate: Date,
    refundAmount: {
      type: Number,
      min: 0
    }
  },
  coupon: {
    code: String,
    discountType: String,
    discountValue: Number,
    discountAmount: Number
  },
  campaign: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign'
    },
    name: {
      type: String,
      trim: true
    },
    type: {
      type: String,
      trim: true
    },
    discountType: {
      type: String,
      trim: true
    },
    discountValue: {
      type: Number,
      min: 0
    },
    discountAmount: {
      type: Number,
      min: 0
    }
  },
  notes: {
    customer: {
      type: String,
      trim: true,
      maxlength: [500, 'Müşteri notu en fazla 500 karakter olabilir']
    },
    admin: {
      type: String,
      trim: true,
      maxlength: [500, 'Admin notu en fazla 500 karakter olabilir']
    },
    delivery: {
      type: String,
      trim: true,
      maxlength: [500, 'Teslimat notu en fazla 500 karakter olabilir']
    }
  },
  shippingType: {
    type: String,
    enum: ['standart', 'ekspres', 'same-day'],
    default: 'standart'
  },
  isGift: {
    type: Boolean,
    default: false
  },
  giftMessage: {
    type: String,
    trim: true,
    maxlength: [200, 'Hediye mesajı en fazla 200 karakter olabilir']
  },
  kvkkConsent: {
    type: Boolean,
    required: true,
    default: false
  },
  privacyPolicyConsent: {
    type: Boolean,
    required: true,
    default: false
  },
  distanceSalesConsent: {
    type: Boolean,
    required: true,
    default: false
  },
  // Tarihler
  orderDate: {
    type: Date,
    default: Date.now
  },
  confirmedDate: Date,
  shippedDate: Date,
  deliveredDate: Date,
  cancelledDate: Date,
  returnedDate: Date,
  // İstatistikler
  viewCount: {
    type: Number,
    default: 0
  },
  source: {
    type: String,
    enum: ['website', 'mobile-app', 'admin-panel'],
    default: 'website'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ userId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ orderDate: -1 });
orderSchema.index({ 'tracking.trackingNumber': 1 });
orderSchema.index({ 'payment.status': 1 });

// Virtuals
orderSchema.virtual('totalSavings').get(function() {
  return this.items.reduce((total, item) => {
    if (item.originalPrice && item.originalPrice > item.price) {
      return total + ((item.originalPrice - item.price) * item.quantity);
    }
    return total;
  }, 0) + this.discountAmount;
});

orderSchema.virtual('canBeCancelled').get(function() {
  return ['pending', 'confirmed'].includes(this.status);
});

orderSchema.virtual('canBeReturned').get(function() {
  return this.status === 'delivered' && 
         this.deliveredDate && 
         (Date.now() - this.deliveredDate.getTime()) <= (14 * 24 * 60 * 60 * 1000); // 14 gün
});

orderSchema.virtual('isOverdue').get(function() {
  if (!this.tracking.estimatedDelivery) return false;
  return Date.now() > this.tracking.estimatedDelivery.getTime() && 
         !['delivered', 'cancelled', 'returned'].includes(this.status);
});

// Pre-save middleware
orderSchema.pre('save', function(next) {
  if (this.isNew) {
    // orderNumber artık default ile üretiliyor
    this.statusHistory.push({
      status: this.status,
      date: this.orderDate,
      note: 'Sipariş oluşturuldu'
    });
  }
  
  if (this.isModified('status') && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      date: new Date(),
      note: `Sipariş durumu ${this.status} olarak güncellendi`
    });
    
    // Durum değişikliğine göre tarihleri güncelle
    this.updateStatusDates();
  }
  
  next();
});

// Static methods
orderSchema.statics.generateOrderNumber = function() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const timestamp = Date.now();
  
  return `ORD-${year}${month}${day}-${timestamp.toString().slice(-6)}`;
};

orderSchema.statics.findByUser = function(userId) {
  return this.find({ userId }).sort({ orderDate: -1 });
};

orderSchema.statics.findByStatus = function(status) {
  return this.find({ status });
};

orderSchema.statics.findByDateRange = function(startDate, endDate) {
  return this.find({
    orderDate: {
      $gte: startDate,
      $lte: endDate
    }
  });
};

// Instance methods
orderSchema.methods.generateOrderNumber = function() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const timestamp = Date.now();
  
  return `ORD-${year}${month}${day}-${timestamp.toString().slice(-6)}`;
};

orderSchema.methods.updateStatus = function(newStatus, note = '', updatedBy = null) {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    date: new Date(),
    note: note || `Sipariş durumu ${newStatus} olarak güncellendi`,
    updatedBy
  });
  
  this.updateStatusDates();
  return this.save();
};

orderSchema.methods.updateStatusDates = function() {
  const now = new Date();
  
  switch (this.status) {
    case 'confirmed':
      this.confirmedDate = now;
      break;
    case 'shipped':
      this.shippedDate = now;
      break;
    case 'delivered':
      this.deliveredDate = now;
      break;
    case 'cancelled':
      this.cancelledDate = now;
      break;
    case 'returned':
      this.returnedDate = now;
      break;
  }
};

orderSchema.methods.addTracking = function(trackingNumber, carrier, estimatedDelivery) {
  this.tracking.trackingNumber = trackingNumber;
  this.tracking.carrier = carrier;
  this.tracking.estimatedDelivery = estimatedDelivery;
  this.tracking.trackingUrl = this.generateTrackingUrl(trackingNumber, carrier);
  
  return this.save();
};

orderSchema.methods.generateTrackingUrl = function(trackingNumber, carrier) {
  const carriers = {
    'aras': `https://www.araskargo.com.tr/tr/cargo-tracking?code=${trackingNumber}`,
    'yurtici': `https://www.yurticikargo.com/tr/cargo-tracking?code=${trackingNumber}`,
    'mng': `https://www.mngkargo.com.tr/tr/cargo-tracking?code=${trackingNumber}`,
    'ptt': `https://www.ptt.gov.tr/tr/cargo-tracking?code=${trackingNumber}`
  };
  
  return carriers[carrier.toLowerCase()] || `https://example.com/track/${trackingNumber}`;
};

orderSchema.methods.calculateTotalAmount = function() {
  this.totalAmount = this.subtotal + this.shippingCost + this.taxAmount - this.discountAmount;
  return this.totalAmount;
};

module.exports = mongoose.model('Order', orderSchema); 