const Joi = require('joi');

const sellerSchema = Joi.object({
  name: Joi.string().allow('').optional(),
  taxOffice: Joi.string().allow('').optional(),
  vkn: Joi.string().allow('').optional(),
  tckn: Joi.string().allow('').optional(),
  mersis: Joi.string().allow('').optional(),
  address: Joi.string().allow('').optional(),
  city: Joi.string().allow('').optional(),
  district: Joi.string().allow('').optional(),
  postalCode: Joi.string().allow('').optional(),
  phone: Joi.string().allow('').optional(),
  email: Joi.string().email().allow('').optional(),
  bankName: Joi.string().allow('').optional(),
  iban: Joi.string().allow('').optional()
}).optional();

const buyerSchema = Joi.object({
  firstName: Joi.string().allow('').optional(),
  lastName: Joi.string().allow('').optional(),
  companyName: Joi.string().allow('').optional(),
  tckn: Joi.string().allow('').optional(),
  taxNumber: Joi.string().allow('').optional(),
  taxOffice: Joi.string().allow('').optional(),
  email: Joi.string().email().allow('').optional(),
  phone: Joi.string().allow('').optional(),
  address: Joi.string().allow('').optional(),
  city: Joi.string().allow('').optional(),
  district: Joi.string().allow('').optional(),
  postalCode: Joi.string().allow('').optional()
}).optional();

const itemSchema = Joi.object({
  productId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
  name: Joi.string().allow('').optional(),
  sku: Joi.string().allow('').optional(),
  quantity: Joi.number().min(0).optional(),
  unitPrice: Joi.number().min(0).optional(),
  discount: Joi.number().min(0).optional(),
  taxRate: Joi.number().min(0).max(100).optional(),
  taxAmount: Joi.number().min(0).optional(),
  totalExclTax: Joi.number().min(0).optional(),
  totalInclTax: Joi.number().min(0).optional()
});

const totalsSchema = Joi.object({
  subtotal: Joi.number().min(0).optional(),
  discountsTotal: Joi.number().min(0).optional(),
  shippingCost: Joi.number().min(0).optional(),
  taxTotal: Joi.number().min(0).optional(),
  grandTotal: Joi.number().min(0).optional()
}).optional();

const shippingSchema = Joi.object({
  address: Joi.string().allow('').optional(),
  city: Joi.string().allow('').optional(),
  district: Joi.string().allow('').optional(),
  postalCode: Joi.string().allow('').optional(),
  carrier: Joi.string().allow('').optional(),
  trackingNumber: Joi.string().allow('').optional(),
  deliveredAt: Joi.date().iso().optional()
}).optional();

const metaSchema = Joi.object({
  invoiceNumber: Joi.string().allow('').optional(),
  invoiceDate: Joi.date().iso().optional(),
  currency: Joi.string().allow('').optional(),
  orderNumber: Joi.string().allow('').optional(),
  orderDate: Joi.date().iso().optional(),
  paymentMethod: Joi.string().allow('').optional(),
  paymentDate: Joi.date().iso().optional(),
  notes: Joi.string().allow('').optional()
}).optional();

exports.manualInvoiceSchema = Joi.object({
  // Backward compatibility fields
  invoiceNumber: Joi.string().trim().max(64).optional(),
  invoiceDate: Joi.date().iso().optional(),
  // Nested structures
  seller: sellerSchema,
  buyer: buyerSchema,
  items: Joi.array().items(itemSchema).optional(),
  totals: totalsSchema,
  shipping: shippingSchema,
  meta: metaSchema,
  // Attachments and notes
  pdfPath: Joi.string().trim().max(512).optional(),
  manualNotes: Joi.string().max(2000).allow('').optional(),
  // Status
  status: Joi.string().valid('pending', 'approved', 'rejected', 'sent', 'processing', 'error').optional()
});

exports.adminListSchema = Joi.object({
  status: Joi.string().valid('pending', 'sent', 'processing', 'approved', 'rejected', 'error'),
  from: Joi.date().iso(),
  to: Joi.date().iso(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
}); 