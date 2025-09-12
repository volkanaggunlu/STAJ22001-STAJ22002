const mongoose = require('mongoose');

const shippingOptionSchema = new mongoose.Schema({
  value: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  label: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  cost: {
    type: Number,
    required: true,
    min: 0
  },
  freeLimit: {
    type: Number,
    min: 0,
    default: 0
  },
  estimatedDays: {
    type: String,
    required: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  applicableCities: [{
    type: String,
    trim: true
  }],
  applicableRegions: [{
    type: String,
    trim: true
  }],
  minOrderAmount: {
    type: Number,
    min: 0,
    default: 0
  },
  maxOrderAmount: {
    type: Number,
    min: 0
  },
  weightLimit: {
    type: Number,
    min: 0
  },
  dimensions: {
    maxLength: Number,
    maxWidth: Number,
    maxHeight: Number
  },
  carrier: {
    type: String,
    trim: true
  },
  trackingUrl: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
shippingOptionSchema.index({ value: 1 }, { unique: true });
shippingOptionSchema.index({ isActive: 1 });
shippingOptionSchema.index({ order: 1 });

// Virtuals
shippingOptionSchema.virtual('isFreeForOrder').get(function() {
  return this.freeLimit > 0;
});

shippingOptionSchema.virtual('formattedCost').get(function() {
  return this.cost.toFixed(2);
});

// Static methods
shippingOptionSchema.statics.findActive = function() {
  return this.find({ isActive: true }).sort({ order: 1 });
};

shippingOptionSchema.statics.findByValue = function(value) {
  return this.findOne({ value, isActive: true });
};

shippingOptionSchema.statics.findForOrder = function(orderAmount, city = null) {
  let query = { 
    isActive: true,
    minOrderAmount: { $lte: orderAmount }
  };
  
  if (this.maxOrderAmount) {
    query.maxOrderAmount = { $gte: orderAmount };
  }
  
  if (city && this.applicableCities.length > 0) {
    query.applicableCities = city;
  }
  
  return this.find(query).sort({ order: 1 });
};

// Instance methods
shippingOptionSchema.methods.calculateCost = function(orderAmount) {
  if (this.freeLimit > 0 && orderAmount >= this.freeLimit) {
    return 0;
  }
  return this.cost;
};

shippingOptionSchema.methods.isApplicableForCity = function(city) {
  if (!this.applicableCities || this.applicableCities.length === 0) {
    return true; // Tüm şehirler için geçerli
  }
  return this.applicableCities.includes(city);
};

module.exports = mongoose.model('ShippingOption', shippingOptionSchema); 