const Joi = require('joi');
const { ValidationError } = require('../errors/errors.js');
const logger = require('../logger/logger');

const {
  MAX_PRODUCT_DESCRIPTION_LENGTH,
  MIN_PRODUCT_DESCRIPTION_LENGTH,
  MAX_PRODUCT_NAME_LENGTH,
  MIN_PRODUCT_NAME_LENGTH
} = require('../utils/constants.js');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      logger.warn(`Validation errors: ${JSON.stringify(error.details)}`);
      const errors = error.details.map(detail => detail.message);
      throw new ValidationError(errors.join(', '));
    }
    next();
  };
};

const registrationSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Geçerli bir email adresi giriniz',
    'any.required': 'Email alanı zorunludur'
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Şifre en az 8 karakter olmalıdır',
    'any.required': 'Şifre alanı zorunludur'
  }),
  name: Joi.string().min(2).required().messages({
    'string.min': 'İsim en az 2 karakter olmalıdır',
    'any.required': 'İsim alanı zorunludur'
  }),
  surname: Joi.string().min(2).required().messages({
    'string.min': 'Soyisim en az 2 karakter olmalıdır',
    'any.required': 'Soyisim alanı zorunludur'
  }),
  phone: Joi.string().pattern(/^\+90\d{10}$/).required().messages({
    'string.pattern.base': 'Geçerli bir telefon numarası giriniz (+90 ile başlamalı)',
    'any.required': 'Telefon alanı zorunludur'
  })
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Geçerli bir email adresi giriniz',
    'any.required': 'Email alanı zorunludur'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Şifre alanı zorunludur'
  })
});

const productSchema = Joi.object({
  name: Joi.string()
    .min(MIN_PRODUCT_NAME_LENGTH)
    .max(MAX_PRODUCT_NAME_LENGTH)
    .required()
    .messages({
      'string.min': `Ürün adı en az ${MIN_PRODUCT_NAME_LENGTH} karakter olmalıdır`,
      'string.max': `Ürün adı en fazla ${MAX_PRODUCT_NAME_LENGTH} karakter olabilir`,
      'any.required': 'Ürün adı zorunludur'
    }),
  description: Joi.string()
    .min(MIN_PRODUCT_DESCRIPTION_LENGTH)
    .max(MAX_PRODUCT_DESCRIPTION_LENGTH)
    .required()
    .messages({
      'string.min': `Açıklama en az ${MIN_PRODUCT_DESCRIPTION_LENGTH} karakter olmalıdır`,
      'string.max': `Açıklama en fazla ${MAX_PRODUCT_DESCRIPTION_LENGTH} karakter olabilir`,
      'any.required': 'Ürün açıklaması zorunludur'
    }),
  shortDescription: Joi.string()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Kısa açıklama en fazla 500 karakter olabilir'
    }),
  price: Joi.number()
    .positive()
    .required()
    .messages({
      'number.base': 'Fiyat bir sayı olmalıdır',
      'number.positive': 'Fiyat pozitif bir sayı olmalıdır',
      'any.required': 'Fiyat alanı zorunludur'
    }),
  originalPrice: Joi.number()
    .positive()
    .optional()
    .messages({
      'number.positive': 'Orijinal fiyat pozitif bir sayı olmalıdır'
    }),
  category: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Geçersiz kategori ID',
      'any.required': 'Kategori alanı zorunludur'
    }),
  brand: Joi.string()
    .required()
    .messages({
      'any.required': 'Marka alanı zorunludur'
    }),
  sku: Joi.string()
    .required()
    .messages({
      'any.required': 'SKU alanı zorunludur'
    }),
  stock: Joi.object({
    quantity: Joi.number().integer().min(0).required(),
    lowStockThreshold: Joi.number().integer().min(0).optional(),
    trackStock: Joi.boolean().optional()
  }).required(),
  specifications: Joi.array().items(
    Joi.object({
      key: Joi.string().required(),
      value: Joi.string().required()
    })
  ).optional(),
  features: Joi.array()
    .items(Joi.string())
    .optional(),
  type: Joi.string()
    .valid('product', 'bundle')
    .required(),
  bundleItems: Joi.when('type', {
    is: 'bundle',
    then: Joi.array().items(
      Joi.object({
        productId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
        name: Joi.string().required(),
        description: Joi.string().optional(),
        quantity: Joi.number().integer().min(1).required(),
        price: Joi.number().positive().required()
      })
    ).required(),
    otherwise: Joi.forbidden()
  }),
  bundleType: Joi.when('type', {
    is: 'bundle',
    then: Joi.string().valid('kit', 'set', 'package', 'bundle').required(),
    otherwise: Joi.forbidden()
  }),
  itemCount: Joi.when('type', {
    is: 'bundle',
    then: Joi.number().integer().min(1).required(),
    otherwise: Joi.forbidden()
  }),
  seo: Joi.object({
    title: Joi.string().max(60).optional(),
    description: Joi.string().max(160).optional(),
    keywords: Joi.array().items(Joi.string()).optional()
  }).optional(),
  shipping: Joi.object({
    weight: Joi.number().min(0).optional(),
    dimensions: Joi.object({
      length: Joi.number().min(0).optional(),
      width: Joi.number().min(0).optional(),
      height: Joi.number().min(0).optional()
    }).optional(),
    freeShipping: Joi.boolean().optional(),
    shippingTime: Joi.string()
      .valid('same-day', '1-2-days', '2-3-days', '3-5-days', '5-7-days')
      .optional()
  }).optional()
});

const categorySchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Kategori adı en az 2 karakter olmalıdır',
      'string.max': 'Kategori adı en fazla 100 karakter olabilir',
      'any.required': 'Kategori adı zorunludur'
    }),
  description: Joi.string()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Açıklama en fazla 500 karakter olabilir'
    }),
  parent: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Geçersiz üst kategori ID'
    }),
  level: Joi.number()
    .min(0)
    .max(5)
    .optional(),
  image: Joi.object({
    url: Joi.string().trim().optional(),
    alt: Joi.string().trim().optional()
  }).optional(),
  icon: Joi.string().trim().optional(),
  isActive: Joi.boolean()
    .optional(),
  isVisible: Joi.boolean()
    .optional(),
  isFeatured: Joi.boolean()
    .optional(),
  showInMenu: Joi.boolean()
    .optional(),
  showInFooter: Joi.boolean()
    .optional(),
  sortOrder: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.base': 'Sıralama bir sayı olmalıdır',
      'number.integer': 'Sıralama tam sayı olmalıdır',
      'number.min': 'Sıralama 0 veya daha büyük olmalıdır'
    }),
  seo: Joi.object({
    title: Joi.string()
      .max(60)
      .optional()
      .messages({
        'string.max': 'SEO başlığı en fazla 60 karakter olabilir'
      }),
    description: Joi.string()
      .max(160)
      .optional()
      .messages({
        'string.max': 'SEO açıklaması en fazla 160 karakter olabilir'
      }),
    keywords: Joi.array()
      .items(Joi.string())
      .optional()
  }).optional(),
  filters: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      type: Joi.string().valid('range', 'checkbox', 'radio', 'select').required(),
      options: Joi.array().items(
        Joi.object({
          label: Joi.string(),
          value: Joi.string(),
          count: Joi.number().default(0)
        })
      ),
      isActive: Joi.boolean().default(true)
    })
  ).optional(),
  customFields: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      value: Joi.string().required(),
      type: Joi.string().valid('text', 'number', 'boolean', 'url').default('text')
    })
  ).optional()
});

module.exports = {
  validate,
  validateRegistration: validate(registrationSchema),
  validateLogin: validate(loginSchema),
  validateProduct: validate(productSchema),
  validateCategory: validate(categorySchema)
};