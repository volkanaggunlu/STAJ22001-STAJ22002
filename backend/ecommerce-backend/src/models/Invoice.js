const mongoose = require('mongoose');

const sellerSchema = new mongoose.Schema({
  name: { type: String },
  taxOffice: { type: String },
  vkn: { type: String },
  mersis: { type: String },
  address: { type: String },
  city: { type: String },
  district: { type: String },
  postalCode: { type: String },
  phone: { type: String },
  email: { type: String },
  bankName: { type: String },
  iban: { type: String }
}, { _id: false });

const buyerSchema = new mongoose.Schema({
  firstName: { type: String },
  lastName: { type: String },
  companyName: { type: String },
  tckn: { type: String },
  taxNumber: { type: String },
  taxOffice: { type: String },
  email: { type: String },
  phone: { type: String },
  address: { type: String },
  city: { type: String },
  district: { type: String },
  postalCode: { type: String }
}, { _id: false });

const invoiceItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name: { type: String },
  sku: { type: String },
  quantity: { type: Number, default: 1 },
  unitPrice: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  taxRate: { type: Number },
  taxAmount: { type: Number },
  totalExclTax: { type: Number },
  totalInclTax: { type: Number }
}, { _id: false });

const totalsSchema = new mongoose.Schema({
  subtotal: { type: Number, default: 0 },
  discountsTotal: { type: Number, default: 0 },
  shippingCost: { type: Number, default: 0 },
  taxTotal: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 }
}, { _id: false });

const shippingSchema = new mongoose.Schema({
  address: { type: String },
  city: { type: String },
  district: { type: String },
  postalCode: { type: String },
  carrier: { type: String },
  trackingNumber: { type: String },
  deliveredAt: { type: Date }
}, { _id: false });

const metaSchema = new mongoose.Schema({
  invoiceNumber: { type: String },
  invoiceDate: { type: Date },
  currency: { type: String, default: 'TRY' },
  orderNumber: { type: String },
  orderDate: { type: Date },
  paymentMethod: { type: String },
  paymentDate: { type: Date },
  notes: { type: String }
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['pending', 'sent', 'processing', 'approved', 'rejected', 'error'], default: 'pending', index: true },
  sentAt: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // Manual invoicing flags
  isManual: { type: Boolean, default: true },
  // Parties
  seller: { type: sellerSchema, default: {} },
  buyer: { type: buyerSchema, default: {} },
  // Items snapshot
  items: { type: [invoiceItemSchema], default: [] },
  // Totals snapshot
  totals: { type: totalsSchema, default: {} },
  // Shipping info
  shipping: { type: shippingSchema, default: {} },
  // Header/meta
  meta: { type: metaSchema, default: {} },
  // Attachments (store file path instead of base64)
  pdfPath: { type: String },
  manualNotes: { type: String },
  sentToUserAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema); 