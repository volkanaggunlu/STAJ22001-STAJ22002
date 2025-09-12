const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Miktar en az 1 olmalıdır'],
    max: [99, 'Miktar en fazla 99 olabilir']
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
  addedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [cartItemSchema],
  totalItems: {
    type: Number,
    default: 0
  },
  subtotal: {
    type: Number,
    default: 0
  },
  totalSavings: {
    type: Number,
    default: 0
  },
  lastModified: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Geçici sepet için (misafir kullanıcılar)
  sessionId: {
    type: String,
    sparse: true
  },
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 gün
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
cartSchema.index({ userId: 1 });
cartSchema.index({ sessionId: 1 });
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtuals
cartSchema.virtual('isEmpty').get(function() {
  return this.items.length === 0;
});

cartSchema.virtual('hasDiscount').get(function() {
  return this.totalSavings > 0;
});

// Pre-save middleware
cartSchema.pre('save', function(next) {
  this.calculateTotals();
  this.lastModified = new Date();
  next();
});

// Instance methods
cartSchema.methods.addItem = function(productId, quantity = 1, price, originalPrice) {
  const existingItem = this.items.find(item => 
    item.productId.toString() === productId.toString()
  );
  
  if (existingItem) {
    existingItem.quantity += quantity;
    existingItem.addedAt = new Date();
  } else {
    this.items.push({
      productId,
      quantity,
      price,
      originalPrice,
      addedAt: new Date()
    });
  }
  
  this.calculateTotals();
  return this.save();
};

cartSchema.methods.removeItem = function(productId) {
  this.items = this.items.filter(item => 
    item.productId.toString() !== productId.toString()
  );
  
  this.calculateTotals();
  return this.save();
};

cartSchema.methods.updateQuantity = function(productId, quantity) {
  const item = this.items.find(item => 
    item.productId.toString() === productId.toString()
  );
  
  if (item) {
    if (quantity <= 0) {
      return this.removeItem(productId);
    }
    
    item.quantity = quantity;
    item.addedAt = new Date();
    this.calculateTotals();
    return this.save();
  }
  
  return Promise.reject(new Error('Ürün sepette bulunamadı'));
};

cartSchema.methods.clear = function() {
  this.items = [];
  this.calculateTotals();
  return this.save();
};

cartSchema.methods.calculateTotals = function() {
  this.totalItems = this.items.reduce((total, item) => total + item.quantity, 0);
  this.subtotal = this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  this.totalSavings = this.items.reduce((total, item) => {
    if (item.originalPrice && item.originalPrice > item.price) {
      return total + ((item.originalPrice - item.price) * item.quantity);
    }
    return total;
  }, 0);
};

cartSchema.methods.mergeWith = function(otherCart) {
  otherCart.items.forEach(otherItem => {
    const existingItem = this.items.find(item => 
      item.productId.toString() === otherItem.productId.toString()
    );
    
    if (existingItem) {
      existingItem.quantity += otherItem.quantity;
    } else {
      this.items.push(otherItem);
    }
  });
  
  this.calculateTotals();
  return this.save();
};

// Static methods
cartSchema.statics.findByUser = function(userId) {
  return this.findOne({ userId, isActive: true });
};

cartSchema.statics.findBySession = function(sessionId) {
  return this.findOne({ sessionId, isActive: true });
};

cartSchema.statics.createForUser = function(userId) {
  return this.create({ userId });
};

cartSchema.statics.createForSession = function(sessionId) {
  return this.create({ sessionId });
};

module.exports = mongoose.model('Cart', cartSchema); 