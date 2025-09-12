const express = require('express');
const {
  getLegalLinks,
  getKvkkText,
  getPrivacyPolicy,
  getDistanceSalesContract
} = require('../controllers/legalController');

const { apiLimiter } = require('../middleware/rateLimiter');
const logger = require('../logger/logger');

const router = express.Router();

// Apply rate limiting to all legal routes
router.use(apiLimiter);

/**
 * @route   GET /api/legal/links
 * @desc    Yasal linkleri getir
 * @access  Public
 */
router.get('/links', getLegalLinks);

/**
 * @route   GET /api/legal/kvkk-text
 * @desc    KVKK/GDPR açık aydınlatma metnini getir
 * @access  Public
 */
router.get('/kvkk-text', getKvkkText);

/**
 * @route   GET /api/legal/privacy-policy
 * @desc    Gizlilik politikası metnini getir
 * @access  Public
 */
router.get('/privacy-policy', getPrivacyPolicy);

/**
 * @route   GET /api/legal/distance-sales
 * @desc    Mesafeli satış sözleşmesi metnini getir
 * @access  Public
 */
router.get('/distance-sales', getDistanceSalesContract);

logger.info('Legal routes enabled');

module.exports = router; 