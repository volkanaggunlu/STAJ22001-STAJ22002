const Joi = require('joi');

/**
 * PayTR Payment Initialization Validation Schema
 */
const paytrInitValidation = Joi.object({
  orderId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.empty': 'Sipariş ID\'si boş olamaz',
      'string.pattern.base': 'Geçersiz sipariş ID\'si formatı',
      'any.required': 'Sipariş ID\'si zorunludur'
    }),

  installmentCount: Joi.number()
    .integer()
    .min(0)
    .max(12)
    .optional()
    .default(0)
    .messages({
      'number.base': 'Taksit sayısı sayı olmalıdır',
      'number.integer': 'Taksit sayısı tam sayı olmalıdır',
      'number.min': 'Taksit sayısı 0\'dan küçük olamaz',
      'number.max': 'Taksit sayısı 12\'den büyük olamaz'
    })
});

/**
 * Bank Transfer Payment Initialization Validation Schema
 */
const bankTransferInitValidation = Joi.object({
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
 * Bank Transfer Notification Validation Schema
 */
const bankTransferNotifyValidation = Joi.object({
  orderId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Geçersiz sipariş ID\'si formatı'
    }),

  orderNumber: Joi.string()
    .min(1)
    .max(50)
    .optional()
    .messages({
      'string.empty': 'Sipariş numarası boş olamaz',
      'string.min': 'Sipariş numarası en az 1 karakter olmalıdır',
      'string.max': 'Sipariş numarası en fazla 50 karakter olabilir'
    }),

  transferAmount: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      'number.base': 'Transfer tutarı sayı olmalıdır',
      'number.positive': 'Transfer tutarı pozitif olmalıdır',
      'any.required': 'Transfer tutarı zorunludur'
    }),

  transferDate: Joi.date()
    .iso()
    .required()
    .messages({
      'date.base': 'Transfer tarihi geçerli bir tarih olmalıdır',
      'date.format': 'Transfer tarihi ISO formatında olmalıdır',
      'any.required': 'Transfer tarihi zorunludur'
    }),

  senderName: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Gönderen adı boş olamaz',
      'string.min': 'Gönderen adı en az 2 karakter olmalıdır',
      'string.max': 'Gönderen adı en fazla 100 karakter olabilir',
      'any.required': 'Gönderen adı zorunludur'
    }),

  senderIban: Joi.string()
    .trim()
    .pattern(/^TR\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{2}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Geçerli bir IBAN numarası giriniz (TR ile başlamalı)'
    }),

  description: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Açıklama en fazla 500 karakter olabilir'
    }),

  bankAccount: Joi.string()
    .valid('ziraat', 'garanti', 'isbank')
    .required()
    .messages({
      'any.only': 'Geçerli bir banka hesabı seçiniz',
      'any.required': 'Banka hesabı zorunludur'
    })
}).or('orderId', 'orderNumber')
  .messages({
    'object.missing': 'Sipariş ID\'si veya sipariş numarası belirtilmelidir'
  });

/**
 * Bank Transfer Receipt Upload Validation Schema
 */
const bankTransferReceiptValidation = Joi.object({
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
 * Refund Validation Schema
 */
const refundValidation = Joi.object({
  refundAmount: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      'number.base': 'İade tutarı sayı olmalıdır',
      'number.positive': 'İade tutarı pozitif olmalıdır',
      'any.required': 'İade tutarı zorunludur'
    }),

  refundReason: Joi.string()
    .trim()
    .min(10)
    .max(500)
    .required()
    .messages({
      'string.empty': 'İade sebebi boş olamaz',
      'string.min': 'İade sebebi en az 10 karakter olmalıdır',
      'string.max': 'İade sebebi en fazla 500 karakter olabilir',
      'any.required': 'İade sebebi zorunludur'
    }),

  refundType: Joi.string()
    .valid('full', 'partial')
    .optional()
    .default('full')
    .messages({
      'any.only': 'İade türü full veya partial olmalıdır'
    }),

  refundMethod: Joi.string()
    .valid('original', 'bank_transfer', 'cash')
    .optional()
    .default('original')
    .messages({
      'any.only': 'İade yöntemi original, bank_transfer veya cash olmalıdır'
    })
});

/**
 * Order ID Parameter Validation Schema
 */
const orderIdParamValidation = Joi.object({
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
 * Payment ID Parameter Validation Schema
 */
const paymentIdParamValidation = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.empty': 'Ödeme ID\'si boş olamaz',
      'string.pattern.base': 'Geçersiz ödeme ID\'si formatı',
      'any.required': 'Ödeme ID\'si zorunludur'
    })
});

/**
 * Validation middleware factory
 * @param {Joi.ObjectSchema} schema - Joi validation schema
 * @param {string} source - Source of data (body, query, params)
 * @returns {Function} Express middleware function
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

/**
 * Validation middleware for PayTR initialization
 */
const validatePayTRInit = validate(paytrInitValidation);

/**
 * Validation middleware for bank transfer initialization
 */
const validateBankTransferInit = validate(bankTransferInitValidation);

/**
 * Validation middleware for bank transfer notification
 */
const validateBankTransferNotify = validate(bankTransferNotifyValidation);

/**
 * Validation middleware for bank transfer receipt upload
 */
const validateBankTransferReceipt = validate(bankTransferReceiptValidation);

/**
 * Validation middleware for refund
 */
const validateRefund = validate(refundValidation);

/**
 * Validation middleware for order ID parameter
 */
const validateOrderIdParam = validate(orderIdParamValidation, 'params');

/**
 * Validation middleware for payment ID parameter
 */
const validatePaymentIdParam = validate(paymentIdParamValidation, 'params');

module.exports = {
  // Schemas
  paytrInitValidation,
  bankTransferInitValidation,
  bankTransferNotifyValidation,
  bankTransferReceiptValidation,
  refundValidation,
  orderIdParamValidation,
  paymentIdParamValidation,
  
  // Middleware functions
  validate,
  validatePayTRInit,
  validateBankTransferInit,
  validateBankTransferNotify,
  validateBankTransferReceipt,
  validateRefund,
  validateOrderIdParam,
  validatePaymentIdParam
}; 