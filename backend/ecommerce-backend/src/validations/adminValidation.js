const Joi = require('joi');
const { validate } = require('../middleware/validate');

// Dashboard validasyon şeması
const dashboardQuerySchema = Joi.object({
  startDate: Joi.date().iso().optional().messages({
    'date.format': 'Başlangıç tarihi geçerli bir ISO 8601 formatında olmalıdır'
  }),
  endDate: Joi.date().iso().optional().messages({
    'date.format': 'Bitiş tarihi geçerli bir ISO 8601 formatında olmalıdır'
  })
});

// Sipariş sorgu şeması
const orderQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional().messages({
    'number.base': 'Sayfa numarası bir sayı olmalıdır',
    'number.integer': 'Sayfa numarası tam sayı olmalıdır',
    'number.min': 'Sayfa numarası 1 veya daha büyük olmalıdır'
  }),
  limit: Joi.number().integer().min(1).max(100).optional().messages({
    'number.base': 'Limit bir sayı olmalıdır',
    'number.integer': 'Limit tam sayı olmalıdır',
    'number.min': 'Limit 1 veya daha büyük olmalıdır',
    'number.max': 'Limit en fazla 100 olabilir'
  }),
  status: Joi.string().valid('pending', 'processing', 'shipped', 'delivered', 'cancelled').optional().messages({
    'any.only': 'Geçersiz sipariş durumu'
  }),
  search: Joi.string().trim().min(1).optional().messages({
    'string.min': 'Arama terimi en az 1 karakter olmalıdır'
  })
});

// Sipariş durumu şeması
const orderStatusSchema = Joi.object({
  id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.pattern.base': 'Geçersiz sipariş ID'
  }),
  status: Joi.string().valid('pending', 'processing', 'shipped', 'delivered', 'cancelled').required().messages({
    'any.only': 'Geçersiz sipariş durumu',
    'any.required': 'Sipariş durumu zorunludur'
  }),
  note: Joi.string().trim().min(1).max(500).optional().messages({
    'string.min': 'Not en az 1 karakter olmalıdır',
    'string.max': 'Not en fazla 500 karakter olabilir'
  })
});

// Kargo takip numarası şeması
const trackingNumberSchema = Joi.object({
  id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.pattern.base': 'Geçersiz sipariş ID'
  }),
  trackingNumber: Joi.string().trim().min(5).max(50).required().messages({
    'string.min': 'Takip numarası en az 5 karakter olmalıdır',
    'string.max': 'Takip numarası en fazla 50 karakter olabilir',
    'any.required': 'Takip numarası zorunludur'
  }),
  carrier: Joi.string().valid('aras', 'yurtici', 'mng', 'ptt').required().messages({
    'any.only': 'Geçersiz kargo firması',
    'any.required': 'Kargo firması zorunludur'
  })
});

// Ürün sorgu şeması
const productQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional().messages({
    'number.base': 'Sayfa numarası bir sayı olmalıdır',
    'number.integer': 'Sayfa numarası tam sayı olmalıdır',
    'number.min': 'Sayfa numarası 1 veya daha büyük olmalıdır'
  }),
  limit: Joi.number().integer().min(1).max(100).optional().messages({
    'number.base': 'Limit bir sayı olmalıdır',
    'number.integer': 'Limit tam sayı olmalıdır',
    'number.min': 'Limit 1 veya daha büyük olmalıdır',
    'number.max': 'Limit en fazla 100 olabilir'
  }),
  search: Joi.string().trim().min(1).optional().messages({
    'string.min': 'Arama terimi en az 1 karakter olmalıdır'
  }),
  category: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional().messages({
    'string.pattern.base': 'Geçersiz kategori ID'
  }),
  stock: Joi.string().valid('low', 'out').optional().messages({
    'any.only': 'Geçersiz stok filtresi'
  })
});

// Ürün stok şeması
const productStockSchema = Joi.object({
  id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.pattern.base': 'Geçersiz ürün ID'
  }),
  stock: Joi.number().integer().min(0).required().messages({
    'number.base': 'Stok miktarı bir sayı olmalıdır',
    'number.integer': 'Stok miktarı tam sayı olmalıdır',
    'number.min': 'Stok miktarı 0 veya daha büyük olmalıdır',
    'any.required': 'Stok miktarı zorunludur'
  })
});

module.exports = {
  validateDashboardQuery: validate(dashboardQuerySchema, 'query'),
  validateOrderQuery: validate(orderQuerySchema, 'query'),
  validateOrderStatus: validate(orderStatusSchema),
  validateTrackingNumber: validate(trackingNumberSchema),
  validateProductQuery: validate(productQuerySchema, 'query'),
  validateProductStock: validate(productStockSchema)
}; 