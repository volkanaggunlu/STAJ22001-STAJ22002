const mongoose = require('mongoose');

const trackSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Sipariş ID\'si gerekli']
  },
  trackingNumber: {
    type: String,
    required: [true, 'Takip numarası gerekli'],
    unique: true
  },
  carrier: {
    type: String,
    required: [true, 'Kargo firması gerekli'],
    enum: ['yurtici', 'aras', 'mng', 'ups', 'ptt']
  },
  status: {
    type: String,
    required: true,
    enum: [
      'created',           // Kargo kaydı oluşturuldu
      'label_printed',     // Kargo etiketi yazdırıldı
      'picked_up',         // Kargo teslim alındı
      'in_transit',        // Taşıma aşamasında
      'out_for_delivery',  // Dağıtıma çıktı
      'delivered',         // Teslim edildi
      'failed_delivery',   // Teslimat başarısız
      'returned',          // İade edildi
      'exception'          // Sorun/İstisna durumu
    ],
    default: 'created'
  },
  currentLocation: {
    type: String,
    required: false
  },
  estimatedDelivery: {
    type: Date,
    required: false
  },
  events: [{
    status: {
      type: String,
      required: true
    },
    location: String,
    description: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  lastUpdate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Kargo durumu güncellendiğinde lastUpdate alanını güncelle
trackSchema.pre('save', function(next) {
  if (this.isModified('status') || this.isModified('events')) {
    this.lastUpdate = new Date();
  }
  next();
});

// Yeni bir event eklendiğinde status'u güncelle
trackSchema.methods.addEvent = function(eventData) {
  this.events.push(eventData);
  this.status = eventData.status;
  this.currentLocation = eventData.location;
  return this.save();
};

const Track = mongoose.model('Track', trackSchema);

module.exports = Track; 