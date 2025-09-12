const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
  name: { type: String, required: true },
  label: { type: String, required: true },
  type: { type: String, required: true },
  required: { type: Boolean, default: false }
}, { _id: false });

const installmentOptionSchema = new mongoose.Schema({
  count: { type: Number, required: true },
  label: { type: String, required: true }
}, { _id: false });

const bankInfoSchema = new mongoose.Schema({
  bankName: String,
  accountName: String,
  iban: String
}, { _id: false });

const paymentMethodSchema = new mongoose.Schema({
  value: { type: String, required: true, unique: true },
  label: { type: String, required: true },
  description: { type: String },
  fields: [fieldSchema],
  installmentOptions: [installmentOptionSchema],
  bankInfo: bankInfoSchema,
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema); 