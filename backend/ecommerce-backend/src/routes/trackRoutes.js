const express = require('express');
const {
  createTrack,
  updateTrackStatus,
  getTrackInfo,
  getTrackByNumber,
  getTrackByOrder
} = require('../controllers/trackController');

const { auth, admin } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');
const {
  validateCreateTrack,
  validateUpdateTrack,
  validateTrackId,
  validateTrackingNumber,
  validateOrderId
} = require('../validations/trackValidation');

const router = express.Router();

// Rate limiting uygula
router.use(apiLimiter);

/**
 * @route   POST /api/track
 * @desc    Yeni kargo takip kaydı oluştur
 * @access  Admin
 */
router.post('/', auth, admin, validateCreateTrack, createTrack);

/**
 * @route   PUT /api/track/:id
 * @desc    Kargo durumunu güncelle
 * @access  Admin
 */
router.put('/:id', auth, admin, validateTrackId, validateUpdateTrack, updateTrackStatus);

/**
 * @route   GET /api/track/:id
 * @desc    Kargo takip bilgilerini getir
 * @access  Private
 */
router.get('/:id', auth, validateTrackId, getTrackInfo);

/**
 * @route   GET /api/track/number/:trackingNumber
 * @desc    Kargo takip numarasıyla bilgileri getir
 * @access  Public
 */
router.get('/number/:trackingNumber', validateTrackingNumber, getTrackByNumber);

/**
 * @route   GET /api/track/order/:orderId
 * @desc    Siparişe ait kargo takip bilgilerini getir
 * @access  Private
 */
router.get('/order/:orderId', auth, validateOrderId, getTrackByOrder);

module.exports = router;