const Joi = require('joi');

/**
 * User Registration Validation Schema
 */
const registerValidation = Joi.object({
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

  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .required()
    .messages({
      'string.empty': 'Email alanı boş olamaz',
      'string.email': 'Geçerli bir email adresi giriniz',
      'any.required': 'Email alanı zorunludur'
    }),

  password: Joi.string()
    .min(6)
    .max(128)
    .required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .messages({
      'string.empty': 'Şifre alanı boş olamaz',
      'string.min': 'Şifre en az 6 karakter olmalıdır',
      'string.max': 'Şifre en fazla 128 karakter olabilir',
      'string.pattern.base': 'Şifre en az bir küçük harf, bir büyük harf ve bir rakam içermelidir',
      'any.required': 'Şifre alanı zorunludur'
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

  gender: Joi.string()
    .valid('male', 'female', 'other')
    .required()
    .messages({
      'any.only': 'Cinsiyet male, female veya other olmalıdır',
      'any.required': 'Cinsiyet alanı zorunludur'
    }),

  birthDate: Joi.date()
    .max('now')
    .optional()
    .messages({
      'date.max': 'Doğum tarihi gelecek bir tarih olamaz'
    })
});

/**
 * User Login Validation Schema
 */
const loginValidation = Joi.object({
  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .required()
    .messages({
      'string.empty': 'Email alanı boş olamaz',
      'string.email': 'Geçerli bir email adresi giriniz',
      'any.required': 'Email alanı zorunludur'
    }),

  password: Joi.string()
    .min(1)
    .required()
    .messages({
      'string.empty': 'Şifre alanı boş olamaz',
      'any.required': 'Şifre alanı zorunludur'
    })
});

/**
 * Refresh Token Validation Schema
 */
const refreshTokenValidation = Joi.object({
  refreshToken: Joi.string()
    .required()
    .messages({
      'string.empty': 'Refresh token boş olamaz',
      'any.required': 'Refresh token zorunludur'
    })
});

/**
 * Email Verification Validation Schema
 */
const emailVerificationValidation = Joi.object({
  token: Joi.string()
    .required()
    .messages({
      'string.empty': 'Doğrulama token\'i boş olamaz',
      'any.required': 'Doğrulama token\'i zorunludur'
    })
});

/**
 * Resend Email Verification Validation Schema
 */
const resendEmailVerificationValidation = Joi.object({
  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .required()
    .messages({
      'string.empty': 'Email alanı boş olamaz',
      'string.email': 'Geçerli bir email adresi giriniz',
      'any.required': 'Email alanı zorunludur'
    })
});

/**
 * Forgot Password Validation Schema
 */
const forgotPasswordValidation = Joi.object({
  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .required()
    .messages({
      'string.empty': 'Email alanı boş olamaz',
      'string.email': 'Geçerli bir email adresi giriniz',
      'any.required': 'Email alanı zorunludur'
    })
});

/**
 * Reset Password Validation Schema
 */
const resetPasswordValidation = Joi.object({
  token: Joi.string()
    .required()
    .messages({
      'string.empty': 'Sıfırlama token\'i boş olamaz',
      'any.required': 'Sıfırlama token\'i zorunludur'
    }),

  newPassword: Joi.string()
    .min(6)
    .max(128)
    .required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .messages({
      'string.empty': 'Yeni şifre alanı boş olamaz',
      'string.min': 'Yeni şifre en az 6 karakter olmalıdır',
      'string.max': 'Yeni şifre en fazla 128 karakter olabilir',
      'string.pattern.base': 'Yeni şifre en az bir küçük harf, bir büyük harf ve bir rakam içermelidir',
      'any.required': 'Yeni şifre alanı zorunludur'
    })
});

/**
 * Change Password Validation Schema
 */
const changePasswordValidation = Joi.object({
  currentPassword: Joi.string()
    .min(1)
    .required()
    .messages({
      'string.empty': 'Mevcut şifre alanı boş olamaz',
      'any.required': 'Mevcut şifre alanı zorunludur'
    }),

  newPassword: Joi.string()
    .min(6)
    .max(128)
    .required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .messages({
      'string.empty': 'Yeni şifre alanı boş olamaz',
      'string.min': 'Yeni şifre en az 6 karakter olmalıdır',
      'string.max': 'Yeni şifre en fazla 128 karakter olabilir',
      'string.pattern.base': 'Yeni şifre en az bir küçük harf, bir büyük harf ve bir rakam içermelidir',
      'any.required': 'Yeni şifre alanı zorunludur'
    })
});

/**
 * Profile Update Validation Schema
 */
const profileUpdateValidation = Joi.object({
  firstName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-ZçÇğĞıİöÖşŞüÜ\s]+$/)
    .optional()
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
    .pattern(/^[a-zA-ZçÇğĞıİöÖşŞüÜ\s]+$/)
    .optional()
    .messages({
      'string.empty': 'Soyad alanı boş olamaz',
      'string.min': 'Soyad en az 2 karakter olmalıdır',
      'string.max': 'Soyad en fazla 50 karakter olabilir',
      'string.pattern.base': 'Soyad sadece harf içerebilir'
    }),

  phone: Joi.string()
    .trim()
    .pattern(/^\+90\s?\d{3}\s?\d{3}\s?\d{2}\s?\d{2}$/)
    .optional()
    .messages({
      'string.empty': 'Telefon alanı boş olamaz',
      'string.pattern.base': 'Geçerli bir telefon numarası giriniz (ör: +90 555 123 45 67)'
    }),

  birthDate: Joi.date()
    .max('now')
    .optional()
    .messages({
      'date.max': 'Doğum tarihi gelecek bir tarih olamaz'
    }),

  gender: Joi.string()
    .valid('male', 'female', 'other')
    .optional()
    .messages({
      'any.only': 'Cinsiyet male, female veya other olmalıdır'
    })
});

/**
 * Validation Middleware Factory
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
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
 * Validation middleware for registration
 */
const validateRegistration = validate(registerValidation);

/**
 * Validation middleware for login
 */
const validateLogin = validate(loginValidation);

/**
 * Validation middleware for refresh token
 */
const validateRefreshToken = validate(refreshTokenValidation);

/**
 * Validation middleware for email verification
 */
const validateEmailVerification = validate(emailVerificationValidation);

/**
 * Validation middleware for resend email verification
 */
const validateResendEmailVerification = validate(resendEmailVerificationValidation);

/**
 * Validation middleware for forgot password
 */
const validateForgotPassword = validate(forgotPasswordValidation);

/**
 * Validation middleware for reset password
 */
const validateResetPassword = validate(resetPasswordValidation);

/**
 * Validation middleware for change password
 */
const validateChangePassword = validate(changePasswordValidation);

/**
 * Validation middleware for profile update
 */
const validateProfileUpdate = validate(profileUpdateValidation);

module.exports = {
  // Schemas
  registerValidation,
  loginValidation,
  refreshTokenValidation,
  emailVerificationValidation,
  resendEmailVerificationValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
  profileUpdateValidation,
  
  // Middleware functions
  validate,
  validateRegistration,
  validateLogin,
  validateRefreshToken,
  validateEmailVerification,
  validateResendEmailVerification,
  validateForgotPassword,
  validateResetPassword,
  validateChangePassword,
  validateProfileUpdate
}; 