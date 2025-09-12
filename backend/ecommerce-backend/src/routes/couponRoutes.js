const express = require('express');
const {
  validateCoupon,
  applyCouponToCart,
  getAvailableCoupons,
  getCouponUsageHistory
} = require('../controllers/couponController');

const { auth } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');
const logger = require('../logger/logger');

const router = express.Router();

// Apply rate limiting to all coupon routes
router.use(apiLimiter);

/**
 * @route   POST /api/coupons/validate
 * @desc    Kupon kodunu doğrula ve indirim bilgisini döndür
 * @access  Public
 */
router.post('/validate', validateCoupon);

/**
 * @route   GET /api/coupons/available
 * @desc    Kullanıcının kullanabileceği kuponları listele
 * @access  Public
 */
router.get('/available', getAvailableCoupons);

/**
 * @route   POST /api/cart/apply-coupon
 * @desc    Sepete kupon uygula
 * @access  Public
 */
router.post('/cart/apply-coupon', applyCouponToCart);

/**
 * @route   GET /api/coupons/:id/usage-history
 * @desc    Kupon kullanım geçmişini getir
 * @access  Private
 */
router.get('/:id/usage-history', auth, getCouponUsageHistory);

logger.info('Coupon routes enabled');

module.exports = router; 