const express = require('express');
const {
  getTrackingInfo,
  calculateRates,
  getCarriers
} = require('../controllers/shippingController');

const { auth } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');
const {
  validateTrackingCode,
  validateRateCalculation
} = require('../validations/shippingValidation');

const logger = require('../logger/logger');
const router = express.Router();

// Rate limiting uygula
router.use(apiLimiter);

/**
 * @route   GET /api/shipping/tracking/:trackingNumber
 * @desc    Kargo takip bilgisi al (Genel kullanım)
 * @access  Public
 */
router.get('/tracking/:trackingNumber', validateTrackingCode, getTrackingInfo);

/**
 * @route   POST /api/shipping/rates
 * @desc    Kargo ücretlerini hesapla (Genel kullanım)
 * @access  Private
 */
router.post('/rates', auth, validateRateCalculation, calculateRates);

/**
 * @route   GET /api/shipping/carriers
 * @desc    Mevcut kargo şirketlerini listele
 * @access  Public
 */
router.get('/carriers', getCarriers);

/**
 * @route   POST /api/shipping/calculate-cost
 * @desc    Sipariş için kargo ücreti hesapla
 * @access  Public
 */
router.post('/calculate-cost', (req, res) => {
  const { subtotal } = req.body;
  
  if (!subtotal || subtotal < 0) {
    return res.status(400).json({
      success: false,
      error: { message: 'Geçerli bir sepet tutarı göndermelisiniz' }
    });
  }

  const shippingService = require('../services/shippingService');
  const cost = shippingService.calculateShippingCost(subtotal);
  
  res.json({
    success: true,
    data: {
      subtotal,
      shippingCost: cost,
      isFree: cost === 0,
      freeShippingLimit: 200
    }
  });
});

module.exports = router; 