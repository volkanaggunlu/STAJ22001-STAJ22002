const Joi = require('joi');

/**
 * Address Validation Schema
 */
const addressValidation = Joi.object({
  title: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.empty': 'Adres başlığı boş olamaz',
      'string.min': 'Adres başlığı en az 2 karakter olmalıdır',
      'string.max': 'Adres başlığı en fazla 50 karakter olabilir',
      'any.required': 'Adres başlığı zorunludur'
    }),

  firstName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .required()
    .pattern(/^[a-zA-ZçÇğĞıİöÖşŞüÜ\s]+$/)
    .messages({
      'string.empty': 'Ad alanı boş olamaz',
      'string.min': 'Ad en az 2 karakter olmalıdır',
      'string.max': 'Ad en fazla 50 karakter olabilir',
      'string.pattern.base': 'Ad sadece harf içerebilir',
      'any.required': 'Ad alanı zorunludur'
    }),

  lastName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .required()
    .pattern(/^[a-zA-ZçÇğĞıİöÖşŞüÜ\s]+$/)
    .messages({
      'string.empty': 'Soyad alanı boş olamaz',
      'string.min': 'Soyad en az 2 karakter olmalıdır',
      'string.max': 'Soyad en fazla 50 karakter olabilir',
      'string.pattern.base': 'Soyad sadece harf içerebilir',
      'any.required': 'Soyad alanı zorunludur'
    }),

  address: Joi.string()
    .trim()
    .min(10)
    .max(200)
    .required()
    .messages({
      'string.empty': 'Adres alanı boş olamaz',
      'string.min': 'Adres en az 10 karakter olmalıdır',
      'string.max': 'Adres en fazla 200 karakter olabilir',
      'any.required': 'Adres alanı zorunludur'
    }),

  city: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .required()
    .pattern(/^[a-zA-ZçÇğĞıİöÖşŞüÜ\s]+$/)
    .messages({
      'string.empty': 'Şehir alanı boş olamaz',
      'string.min': 'Şehir en az 2 karakter olmalıdır',
      'string.max': 'Şehir en fazla 50 karakter olabilir',
      'string.pattern.base': 'Şehir adı sadece harf içerebilir',
      'any.required': 'Şehir alanı zorunludur'
    }),

  district: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .required()
    .pattern(/^[a-zA-ZçÇğĞıİöÖşŞüÜ\s]+$/)
    .messages({
      'string.empty': 'İlçe alanı boş olamaz',
      'string.min': 'İlçe en az 2 karakter olmalıdır',
      'string.max': 'İlçe en fazla 50 karakter olabilir',
      'string.pattern.base': 'İlçe adı sadece harf içerebilir',
      'any.required': 'İlçe alanı zorunludur'
    }),

  postalCode: Joi.string()
    .trim()
    .pattern(/^\d{5}$/)
    .required()
    .messages({
      'string.empty': 'Posta kodu boş olamaz',
      'string.pattern.base': 'Posta kodu 5 haneli rakam olmalıdır',
      'any.required': 'Posta kodu zorunludur'
    }),

  phone: Joi.string()
    .trim()
    .pattern(/^\+90\s?\d{3}\s?\d{3}\s?\d{2}\s?\d{2}$/)
    .required()
    .messages({
      'string.empty': 'Telefon alanı boş olamaz',
      'string.pattern.base': 'Geçerli bir telefon numarası giriniz (ör: +90 555 123 45 67)',
      'any.required': 'Telefon alanı zorunludur'
    }),

  isDefault: Joi.boolean()
    .optional()
    .default(false)
    .messages({
      'boolean.base': 'Varsayılan adres değeri true veya false olmalıdır'
    })
});

/**
 * Invoice Address Validation Schema
 */
const invoiceAddressValidation = Joi.object({
  title: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.empty': 'Fatura adresi başlığı boş olamaz',
      'string.min': 'Fatura adresi başlığı en az 2 karakter olmalıdır',
      'string.max': 'Fatura adresi başlığı en fazla 50 karakter olabilir',
      'any.required': 'Fatura adresi başlığı zorunludur'
    }),

  firstName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .optional()
    .pattern(/^[a-zA-ZçÇğĞıİöÖşŞüÜ\s]+$/)
    .messages({
      'string.empty': 'Ad alanı boş olamaz',
      'string.min': 'Ad en az 2 karakter olmalıdır',
      'string.max': 'Ad en fazla 50 karakter olabilir',
      'string.pattern.base': 'Ad sadece harf içerebilir'
    }),

  lastName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .optional()
    .pattern(/^[a-zA-ZçÇğĞıİöÖşŞüÜ\s]+$/)
    .messages({
      'string.empty': 'Soyad alanı boş olamaz',
      'string.min': 'Soyad en az 2 karakter olmalıdır',
      'string.max': 'Soyad en fazla 50 karakter olabilir',
      'string.pattern.base': 'Soyad sadece harf içerebilir'
    }),

  address: Joi.string()
    .trim()
    .min(10)
    .max(200)
    .required()
    .messages({
      'string.empty': 'Adres alanı boş olamaz',
      'string.min': 'Adres en az 10 karakter olmalıdır',
      'string.max': 'Adres en fazla 200 karakter olabilir',
      'any.required': 'Adres alanı zorunludur'
    }),

  city: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .required()
    .pattern(/^[a-zA-ZçÇğĞıİöÖşŞüÜ\s]+$/)
    .messages({
      'string.empty': 'Şehir alanı boş olamaz',
      'string.min': 'Şehir en az 2 karakter olmalıdır',
      'string.max': 'Şehir en fazla 50 karakter olabilir',
      'string.pattern.base': 'Şehir adı sadece harf içerebilir',
      'any.required': 'Şehir alanı zorunludur'
    }),

  district: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .required()
    .pattern(/^[a-zA-ZçÇğĞıİöÖşŞüÜ\s]+$/)
    .messages({
      'string.empty': 'İlçe alanı boş olamaz',
      'string.min': 'İlçe en az 2 karakter olmalıdır',
      'string.max': 'İlçe en fazla 50 karakter olabilir',
      'string.pattern.base': 'İlçe adı sadece harf içerebilir',
      'any.required': 'İlçe alanı zorunludur'
    }),

  postalCode: Joi.string()
    .trim()
    .pattern(/^\d{5}$/)
    .required()
    .messages({
      'string.empty': 'Posta kodu boş olamaz',
      'string.pattern.base': 'Posta kodu 5 haneli rakam olmalıdır',
      'any.required': 'Posta kodu zorunludur'
    }),

  phone: Joi.string()
    .trim()
    .pattern(/^\+90\s?\d{3}\s?\d{3}\s?\d{2}\s?\d{2}$/)
    .required()
    .messages({
      'string.empty': 'Telefon alanı boş olamaz',
      'string.pattern.base': 'Geçerli bir telefon numarası giriniz (ör: +90 555 123 45 67)',
      'any.required': 'Telefon alanı zorunludur'
    }),

  companyName: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Şirket adı en az 2 karakter olmalıdır',
      'string.max': 'Şirket adı en fazla 100 karakter olabilir'
    }),

  taxNumber: Joi.string()
    .trim()
    .pattern(/^\d{10}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Vergi numarası 10 haneli rakam olmalıdır'
    }),

  isDefault: Joi.boolean()
    .optional()
    .default(false)
    .messages({
      'boolean.base': 'Varsayılan adres değeri true veya false olmalıdır'
    })
});

/**
 * Favorites Query Validation Schema
 */
const favoritesQueryValidation = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .optional()
    .default(1)
    .messages({
      'number.base': 'Sayfa numarası sayı olmalıdır',
      'number.integer': 'Sayfa numarası tam sayı olmalıdır',
      'number.min': 'Sayfa numarası en az 1 olmalıdır'
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(50)
    .optional()
    .default(20)
    .messages({
      'number.base': 'Limit sayı olmalıdır',
      'number.integer': 'Limit tam sayı olmalıdır',
      'number.min': 'Limit en az 1 olmalıdır',
      'number.max': 'Limit en fazla 50 olabilir'
    })
});

/**
 * Orders Query Validation Schema
 */
const ordersQueryValidation = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .optional()
    .default(1)
    .messages({
      'number.base': 'Sayfa numarası sayı olmalıdır',
      'number.integer': 'Sayfa numarası tam sayı olmalıdır',
      'number.min': 'Sayfa numarası en az 1 olmalıdır'
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(50)
    .optional()
    .default(10)
    .messages({
      'number.base': 'Limit sayı olmalıdır',
      'number.integer': 'Limit tam sayı olmalıdır',
      'number.min': 'Limit en az 1 olmalıdır',
      'number.max': 'Limit en fazla 50 olabilir'
    }),

  status: Joi.string()
    .valid('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned')
    .optional()
    .messages({
      'any.only': 'Geçersiz sipariş durumu'
    })
});

/**
 * Product ID Validation Schema
 */
const productIdValidation = Joi.object({
  productId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.empty': 'Ürün ID\'si boş olamaz',
      'string.pattern.base': 'Geçersiz ürün ID\'si',
      'any.required': 'Ürün ID\'si zorunludur'
    })
});

/**
 * Address ID Validation Schema
 */
const addressIdValidation = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.empty': 'Adres ID\'si boş olamaz',
      'string.pattern.base': 'Geçersiz adres ID\'si',
      'any.required': 'Adres ID\'si zorunludur'
    })
});

/**
 * Validation Middleware Factory
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error } = schema.validate(req[source], { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path[0],
        message: detail.message
      }));
      
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Geçersiz veri girişi',
          details: errors
        },
        timestamp: new Date().toISOString()
      });
    }
    
    next();
  };
};

/**
 * Validation middleware for address
 */
const validateAddress = validate(addressValidation);

/**
 * Validation middleware for invoice address
 */
const validateInvoiceAddress = validate(invoiceAddressValidation);

/**
 * Validation middleware for favorites query
 */
const validateFavoritesQuery = validate(favoritesQueryValidation, 'query');

/**
 * Validation middleware for orders query
 */
const validateOrdersQuery = validate(ordersQueryValidation, 'query');

/**
 * Validation middleware for product ID params
 */
const validateProductId = validate(productIdValidation, 'params');

/**
 * Validation middleware for address ID params
 */
const validateAddressId = validate(addressIdValidation, 'params');

module.exports = {
  // Schemas
  addressValidation,
  invoiceAddressValidation,
  favoritesQueryValidation,
  ordersQueryValidation,
  productIdValidation,
  addressIdValidation,
  
  // Middleware functions
  validate,
  validateAddress,
  validateInvoiceAddress,
  validateFavoritesQuery,
  validateOrdersQuery,
  validateProductId,
  validateAddressId
}; 