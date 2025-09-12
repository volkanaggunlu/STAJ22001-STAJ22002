const express = require('express');
const {
  sendTestEmail,
  sendOrderConfirmationEmail,
  getEmailStatus
} = require('../controllers/emailController');

const { auth, admin } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');
const logger = require('../logger/logger');

const router = express.Router();

// Apply rate limiting to all email routes
router.use(apiLimiter);

/**
 * @route   POST /api/email/test
 * @desc    Test e-postası gönder
 * @access  Admin only
 */
router.post('/test', auth, admin, sendTestEmail);

/**
 * @route   POST /api/email/order-confirmation
 * @desc    Sipariş onay e-postası gönder
 * @access  Admin only
 */
router.post('/order-confirmation', auth, admin, sendOrderConfirmationEmail);

/**
 * @route   GET /api/email/status
 * @desc    E-posta ayarlarını kontrol et
 * @access  Admin only
 */
router.get('/status', auth, admin, getEmailStatus);

logger.info('Email routes enabled');

module.exports = router; 