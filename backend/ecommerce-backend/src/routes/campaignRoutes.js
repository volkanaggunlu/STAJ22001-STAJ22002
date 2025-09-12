const express = require('express');
const {
  getApplicableCampaigns,
  suggestBestCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getCampaign,
  getActiveCampaigns,
  useCampaign,
  autoApplyCampaign
} = require('../controllers/campaignController');

const { auth, admin } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');
const logger = require('../logger/logger');

const router = express.Router();

// Apply rate limiting to all campaign routes
router.use(apiLimiter);

/**
 * @route   GET /api/campaigns/applicable
 * @desc    Kullanıcı için uygun kampanyaları getir
 * @access  Public
 */
router.get('/applicable', getApplicableCampaigns);

/**
 * @route   GET /api/campaigns/suggest
 * @desc    Sepet için en iyi kampanyayı öner
 * @access  Public
 */
router.get('/suggest', suggestBestCampaign);

/**
 * @route   POST /api/campaigns/auto-apply
 * @desc    Otomatik kampanya uygula
 * @access  Public
 */
router.post('/auto-apply', autoApplyCampaign);

/**
 * @route   GET /api/campaigns
 * @desc    Tüm aktif kampanyaları getir
 * @access  Public
 */
router.get('/', getActiveCampaigns);

/**
 * @route   GET /api/campaigns/:id
 * @desc    Kampanya detaylarını getir
 * @access  Admin only
 */
router.get('/:id', auth, admin, getCampaign);

/**
 * @route   POST /api/campaigns
 * @desc    Kampanya oluştur
 * @access  Admin only
 */
router.post('/', auth, admin, createCampaign);

/**
 * @route   PUT /api/campaigns/:id
 * @desc    Kampanya güncelle
 * @access  Admin only
 */
router.put('/:id', auth, admin, updateCampaign);

/**
 * @route   DELETE /api/campaigns/:id
 * @desc    Kampanya sil
 * @access  Admin only
 */
router.delete('/:id', auth, admin, deleteCampaign);

/**
 * @route   POST /api/campaigns/:id/use
 * @desc    Kampanya kullan
 * @access  Private
 */
router.post('/:id/use', auth, useCampaign);

logger.info('Campaign routes enabled');

module.exports = router; 