const Joi = require('joi');

const orderValidationSchema = Joi.object({
  customerType: Joi.string().valid('bireysel', 'firma').required().messages({
    'any.required': 'Müşteri tipi zorunludur',
    'any.only': 'Müşteri tipi bireysel veya firma olmalıdır'
  }),
  shippingAddress: Joi.object({
    title: Joi.string().optional(),
    firstName: Joi.string().optional(),
    lastName: Joi.string().optional(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^\+?\d{10,15}$/).required(),
    address: Joi.string().required(),
    city: Joi.string().required(),
    district: Joi.string().required(),
    postalCode: Joi.string().required(),
    note: Joi.string().max(500).optional(),
    deliveryNotes: Joi.string().max(500).optional()
  }).required(),
  billingAddress: Joi.object({
    title: Joi.string().optional(),
    firstName: Joi.string().optional(),
    lastName: Joi.string().optional(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^\+?\d{10,15}$/).required(),
    address: Joi.string().required(),
    city: Joi.string().required(),
    district: Joi.string().required(),
    postalCode: Joi.string().required(),
    companyName: Joi.string().optional(),
    taxNumber: Joi.string().optional(),
    taxOffice: Joi.string().optional(),
    eInvoiceAddress: Joi.string().optional(),
    tckn: Joi.string().optional()
  }).optional(),
  invoiceAddress: Joi.when('customerType', {
    is: 'firma',
    then: Joi.object({
      title: Joi.string().optional(),
      firstName: Joi.string().optional(),
      lastName: Joi.string().optional(),
      email: Joi.string().email().required(),
      phone: Joi.string().pattern(/^\+?\d{10,15}$/).required(),
      address: Joi.string().required(),
      city: Joi.string().required(),
      district: Joi.string().required(),
      postalCode: Joi.string().required(),
      companyName: Joi.string().optional(),
      taxNumber: Joi.string().optional(),
      taxOffice: Joi.string().optional(),
      eInvoiceAddress: Joi.string().optional()
    }).optional(),
    otherwise: Joi.object().optional()
  }),
  items: Joi.array().items(
    Joi.object({
      productId: Joi.string().required(),
      quantity: Joi.number().min(1).required(),
      name: Joi.string().optional(),
      image: Joi.string().allow('').optional(),
      price: Joi.number().optional(),
      originalPrice: Joi.number().optional(),
      sku: Joi.string().optional(),
      type: Joi.string().optional(),
      bundleItems: Joi.array().items(Joi.object({
        productId: Joi.string().optional(),
        name: Joi.string().optional(),
        quantity: Joi.number().optional(),
        price: Joi.number().optional()
      })).optional()
    })
  ).min(1).required(),
  paymentMethod: Joi.string().required(),
  couponCode: Joi.string().optional(),
  campaign: Joi.object({
    id: Joi.string().optional(),
    name: Joi.string().optional(),
    type: Joi.string().optional(),
    discountType: Joi.string().optional(),
    discountValue: Joi.number().min(0).optional(),
    discountAmount: Joi.number().min(0).optional()
  }).optional(),
  notes: Joi.object({
    customer: Joi.string().max(500).optional(),
    admin: Joi.string().max(500).optional(),
    delivery: Joi.string().max(500).optional()
  }).optional(),
  shippingType: Joi.string().valid('standart', 'ekspres', 'same-day').optional(),
  kvkkConsent: Joi.boolean().valid(true).required().messages({
    'any.only': 'KVKK aydınlatma metni onayı zorunludur',
    'any.required': 'KVKK onay kutusu zorunludur'
  }),
  privacyPolicyConsent: Joi.boolean().valid(true).required().messages({
    'any.only': 'Gizlilik politikası onayı zorunludur',
    'any.required': 'Gizlilik politikası onay kutusu zorunludur'
  }),
  distanceSalesConsent: Joi.boolean().valid(true).required().messages({
    'any.only': 'Mesafeli satış sözleşmesi onayı zorunludur',
    'any.required': 'Mesafeli satış sözleşmesi onay kutusu zorunludur'
  }),
});

module.exports = {
  orderValidationSchema
}; 