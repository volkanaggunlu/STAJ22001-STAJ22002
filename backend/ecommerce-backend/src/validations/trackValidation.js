const Joi = require('joi');

/**
 * Kargo Takip Oluşturma Validation Schema
 */
const createTrackValidation = Joi.object({
  orderId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.empty': 'Sipariş ID\'si boş olamaz',
      'string.pattern.base': 'Geçersiz sipariş ID\'si formatı',
      'any.required': 'Sipariş ID\'si zorunludur'
    }),

  trackingNumber: Joi.string()
    .min(5)
    .max(50)
    .required()
    .messages({
      'string.empty': 'Takip numarası boş olamaz',
      'string.min': 'Takip numarası en az 5 karakter olmalıdır',
      'string.max': 'Takip numarası en fazla 50 karakter olabilir',
      'any.required': 'Takip numarası zorunludur'
    }),

  carrier: Joi.string()
    .valid('yurtici', 'aras', 'mng', 'ups', 'ptt')
    .required()
    .messages({
      'any.only': 'Geçerli bir kargo firması seçiniz',
      'any.required': 'Kargo firması zorunludur'
    }),

  estimatedDelivery: Joi.date()
    .min('now')
    .optional()
    .messages({
      'date.base': 'Geçerli bir tarih giriniz',
      'date.min': 'Tahmini teslimat tarihi geçmiş bir tarih olamaz'
    })
});

/**
 * Kargo Durumu Güncelleme Validation Schema
 */
const updateTrackValidation = Joi.object({
  status: Joi.string()
    .valid(
      'created',
      'label_printed',
      'picked_up',
      'in_transit',
      'out_for_delivery',
      'delivered',
      'failed_delivery',
      'returned',
      'exception'
    )
    .required()
    .messages({
      'any.only': 'Geçerli bir kargo durumu seçiniz',
      'any.required': 'Kargo durumu zorunludur'
    }),

  location: Joi.string()
    .min(2)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Konum en az 2 karakter olmalıdır',
      'string.max': 'Konum en fazla 100 karakter olabilir'
    }),

  description: Joi.string()
    .min(5)
    .max(500)
    .optional()
    .messages({
      'string.min': 'Açıklama en az 5 karakter olmalıdır',
      'string.max': 'Açıklama en fazla 500 karakter olabilir'
    })
});

/**
 * Track ID Parameter Validation Schema
 */
const trackIdValidation = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.empty': 'Kargo takip ID\'si boş olamaz',
      'string.pattern.base': 'Geçersiz kargo takip ID\'si formatı',
      'any.required': 'Kargo takip ID\'si zorunludur'
    })
});

/**
 * Tracking Number Parameter Validation Schema
 */
const trackingNumberValidation = Joi.object({
  trackingNumber: Joi.string()
    .min(5)
    .max(50)
    .required()
    .messages({
      'string.empty': 'Takip numarası boş olamaz',
      'string.min': 'Takip numarası en az 5 karakter olmalıdır',
      'string.max': 'Takip numarası en fazla 50 karakter olabilir',
      'any.required': 'Takip numarası zorunludur'
    })
});

/**
 * Order ID Parameter Validation Schema
 */
const orderIdValidation = Joi.object({
  orderId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.empty': 'Sipariş ID\'si boş olamaz',
      'string.pattern.base': 'Geçersiz sipariş ID\'si formatı',
      'any.required': 'Sipariş ID\'si zorunludur'
    })
});

/**
 * Validation middleware factory
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = req[source];
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        code: 'VALIDATION_ERROR'
      }));

      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Geçersiz veri girişi',
          details: validationErrors
        },
        timestamp: new Date().toISOString()
      });
    }

    req[source] = value;
    next();
  };
};

// Validation middleware'leri
const validateCreateTrack = validate(createTrackValidation);
const validateUpdateTrack = validate(updateTrackValidation);
const validateTrackId = validate(trackIdValidation, 'params');
const validateTrackingNumber = validate(trackingNumberValidation, 'params');
const validateOrderId = validate(orderIdValidation, 'params');

module.exports = {
  validateCreateTrack,
  validateUpdateTrack,
  validateTrackId,
  validateTrackingNumber,
  validateOrderId
}; 