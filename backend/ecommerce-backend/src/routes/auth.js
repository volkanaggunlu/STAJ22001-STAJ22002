// src/routes/auth.js
const express = require('express');
const { 
  register, 
  login, 
  logout, 
  refreshToken, 
  verifyEmail, 
  resendEmailVerification, 
  forgotPassword, 
  resetPassword, 
  getUser, 
  updateProfile, 
  changePassword, 
  deactivateAccount 
} = require('../controllers/auth');

const { auth } = require('../middleware/auth');
const { 
  validateRegistration, 
  validateLogin, 
  validateRefreshToken, 
  validateEmailVerification, 
  validateResendEmailVerification, 
  validateForgotPassword, 
  validateResetPassword, 
  validateChangePassword, 
  validateProfileUpdate 
} = require('../validations/authValidation');

const { 
  registrationLimiter, 
  authLimiter, 
  passwordResetLimiter, 
  emailVerificationLimiter 
} = require('../middleware/rateLimiter');

const logger = require('../logger/logger');

const router = express.Router();

// Public routes (no authentication required)

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post('/register', 
  registrationLimiter,
  validateRegistration, 
  register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', 
  authLimiter,
  validateLogin, 
  login
);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh-token', 
  validateRefreshToken, 
  refreshToken
);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email address
 * @access  Public
 */
router.post('/verify-email', 
  validateEmailVerification, 
  verifyEmail
);

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend email verification
 * @access  Public
 */
router.post('/resend-verification', 
  emailVerificationLimiter,
  validateResendEmailVerification, 
  resendEmailVerification
);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post('/forgot-password', 
  passwordResetLimiter,
  validateForgotPassword, 
  forgotPassword
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password
 * @access  Public
 */
router.post('/reset-password', 
  validateResetPassword, 
  resetPassword
);

// Protected routes (authentication required)

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', 
  auth, 
  getUser
);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', 
  auth, 
  validateProfileUpdate, 
  updateProfile
);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password', 
  auth, 
  validateChangePassword, 
  changePassword
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', 
  auth, 
  logout
);

/**
 * @route   POST /api/auth/deactivate
 * @desc    Deactivate user account
 * @access  Private
 */
router.post('/deactivate', 
  auth, 
  deactivateAccount
);

logger.info('Auth routes enabled');

module.exports = router;
