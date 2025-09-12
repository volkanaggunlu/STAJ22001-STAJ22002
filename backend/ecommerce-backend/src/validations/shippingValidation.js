const Joi = require('joi');

/**
 * Kargo Gönderi Oluşturma Validation Schema
 */
const createShipmentValidation = Joi.object({
  orderId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.empty': 'Sipariş ID\'si boş olamaz',
      'string.pattern.base': 'Geçersiz sipariş ID\'si formatı',
      'any.required': 'Sipariş ID\'si zorunludur'
    }),

  carrier: Joi.string()
    .valid('yurtici', 'aras', 'mng', 'ups', 'ptt')
    .required()
    .messages({
      'any.only': 'Geçerli bir kargo firması seçiniz',
      'any.required': 'Kargo firması zorunludur'
    }),

  service: Joi.string()
    .valid('standard', 'express', 'sameday')
    .required()
    .messages({
      'any.only': 'Geçerli bir kargo hizmeti seçiniz',
      'any.required': 'Kargo hizmeti zorunludur'
    }),

  recipient: Joi.object({
    name: Joi.string()
      .min(3)
      .max(100)
      .required()
      .messages({
        'string.min': 'Alıcı adı en az 3 karakter olmalıdır',
        'string.max': 'Alıcı adı en fazla 100 karakter olabilir',
        'any.required': 'Alıcı adı zorunludur'
      }),

    phone: Joi.string()
      .pattern(/^(\+90|0)?[0-9]{10}$/)
      .required()
      .messages({
        'string.pattern.base': 'Geçerli bir telefon numarası giriniz',
        'any.required': 'Telefon numarası zorunludur'
      }),

    address: Joi.string()
      .min(10)
      .max(500)
      .required()
      .messages({
        'string.min': 'Adres en az 10 karakter olmalıdır',
        'string.max': 'Adres en fazla 500 karakter olabilir',
        'any.required': 'Adres zorunludur'
      }),

    city: Joi.string()
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.min': 'Şehir en az 2 karakter olmalıdır',
        'string.max': 'Şehir en fazla 50 karakter olabilir',
        'any.required': 'Şehir zorunludur'
      }),

    district: Joi.string()
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.min': 'İlçe en az 2 karakter olmalıdır',
        'string.max': 'İlçe en fazla 50 karakter olabilir',
        'any.required': 'İlçe zorunludur'
      }),

    postalCode: Joi.string()
      .pattern(/^[0-9]{5}$/)
      .required()
      .messages({
        'string.pattern.base': 'Geçerli bir posta kodu giriniz',
        'any.required': 'Posta kodu zorunludur'
      })
  }).required(),

  package: Joi.object({
    weight: Joi.number()
      .min(0.1)
      .max(100)
      .required()
      .messages({
        'number.min': 'Paket ağırlığı en az 0.1 kg olmalıdır',
        'number.max': 'Paket ağırlığı en fazla 100 kg olabilir',
        'any.required': 'Paket ağırlığı zorunludur'
      }),

    dimensions: Joi.object({
      length: Joi.number().min(1).max(200).required(),
      width: Joi.number().min(1).max(200).required(),
      height: Joi.number().min(1).max(200).required()
    })
    .required()
    .messages({
      'any.required': 'Paket boyutları zorunludur'
    }),

    description: Joi.string()
      .max(500)
      .optional()
      .messages({
        'string.max': 'Açıklama en fazla 500 karakter olabilir'
      })
  }).required()
});

/**
 * Tracking Code Parameter Validation Schema
 */
const trackingCodeValidation = Joi.object({
  code: Joi.string()
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
 * Rate Calculation Validation Schema
 */
const rateCalculationValidation = Joi.object({
  city: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.min': 'Şehir en az 2 karakter olmalıdır',
      'string.max': 'Şehir en fazla 50 karakter olabilir',
      'any.required': 'Şehir zorunludur'
    }),

  district: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.min': 'İlçe en az 2 karakter olmalıdır',
      'string.max': 'İlçe en fazla 50 karakter olabilir',
      'any.required': 'İlçe zorunludur'
    }),

  postalCode: Joi.string()
    .pattern(/^[0-9]{5}$/)
    .required()
    .messages({
      'string.pattern.base': 'Geçerli bir posta kodu giriniz',
      'any.required': 'Posta kodu zorunludur'
    }),

  weight: Joi.number()
    .min(0.1)
    .max(100)
    .required()
    .messages({
      'number.min': 'Ağırlık en az 0.1 kg olmalıdır',
      'number.max': 'Ağırlık en fazla 100 kg olabilir',
      'any.required': 'Ağırlık zorunludur'
    }),

  dimensions: Joi.object({
    length: Joi.number().min(1).max(200).required(),
    width: Joi.number().min(1).max(200).required(),
    height: Joi.number().min(1).max(200).required()
  })
  .required()
  .messages({
    'any.required': 'Paket boyutları zorunludur'
  })
});

/**
 * Shipment ID Parameter Validation Schema
 */
const shipmentIdValidation = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.empty': 'Gönderi ID\'si boş olamaz',
      'string.pattern.base': 'Geçersiz gönderi ID\'si formatı',
      'any.required': 'Gönderi ID\'si zorunludur'
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
const validateCreateShipment = validate(createShipmentValidation);
const validateTrackingCode = validate(trackingCodeValidation, 'params');
const validateRateCalculation = validate(rateCalculationValidation);
const validateShipmentId = validate(shipmentIdValidation, 'params');

module.exports = {
  validateCreateShipment,
  validateTrackingCode,
  validateRateCalculation,
  validateShipmentId
}; 