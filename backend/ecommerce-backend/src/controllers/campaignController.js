const logger = require('../logger/logger');
const campaignService = require('../services/campaignService');
const { ValidationError } = require('../errors/errors');

/**
 * Kullanıcı için uygun kampanyaları getir
 * GET /api/campaigns/applicable
 */
const getApplicableCampaigns = async (req, res, next) => {
  try {
    const { orderAmount = 0, items = [] } = req.query;
    const userId = req.user?._id;

    const campaigns = await campaignService.findApplicableCampaigns(userId, orderAmount, items);

    res.json({
      success: true,
      message: 'Uygun kampanyalar getirildi',
      data: {
        campaigns: campaigns,
        count: campaigns.length
      }
    });

  } catch (error) {
    logger.error('Get applicable campaigns failed:', error);
    next(error);
  }
};

/**
 * Sepet için en iyi kampanyayı öner
 * GET /api/campaigns/suggest
 */
const suggestBestCampaign = async (req, res, next) => {
  try {
    const { orderAmount = 0, items = [] } = req.query;
    const userId = req.user?._id;

    const bestCampaign = await campaignService.suggestBestCampaign(userId, orderAmount, items);

    res.json({
      success: true,
      message: 'En iyi kampanya önerisi getirildi',
      data: {
        campaign: bestCampaign
      }
    });

  } catch (error) {
    logger.error('Suggest best campaign failed:', error);
    next(error);
  }
};

/**
 * Kampanya oluştur
 * POST /api/campaigns
 */
const createCampaign = async (req, res, next) => {
  try {
    const campaignData = req.body;
    const createdBy = req.user._id;

    const campaign = await campaignService.createCampaign(campaignData, createdBy);

    res.status(201).json({
      success: true,
      message: 'Kampanya başarıyla oluşturuldu',
      data: {
        campaign: campaign
      }
    });

  } catch (error) {
    logger.error('Create campaign failed:', error);
    next(error);
  }
};

/**
 * Kampanya güncelle
 * PUT /api/campaigns/:id
 */
const updateCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const campaign = await campaignService.updateCampaign(id, updateData);

    res.json({
      success: true,
      message: 'Kampanya başarıyla güncellendi',
      data: {
        campaign: campaign
      }
    });

  } catch (error) {
    logger.error('Update campaign failed:', error);
    next(error);
  }
};

/**
 * Kampanya sil
 * DELETE /api/campaigns/:id
 */
const deleteCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;

    await campaignService.deleteCampaign(id);

    res.json({
      success: true,
      message: 'Kampanya başarıyla silindi'
    });

  } catch (error) {
    logger.error('Delete campaign failed:', error);
    next(error);
  }
};

/**
 * Kampanya detaylarını getir
 * GET /api/campaigns/:id
 */
const getCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;

    const campaign = await campaignService.getCampaignStats(id);

    res.json({
      success: true,
      message: 'Kampanya detayları getirildi',
      data: {
        campaign: campaign
      }
    });

  } catch (error) {
    logger.error('Get campaign failed:', error);
    next(error);
  }
};

/**
 * Tüm aktif kampanyaları getir
 * GET /api/campaigns
 */
const getActiveCampaigns = async (req, res, next) => {
  try {
    const campaigns = await campaignService.getActiveCampaigns();

    res.json({
      success: true,
      message: 'Aktif kampanyalar getirildi',
      data: {
        campaigns: campaigns,
        count: campaigns.length
      }
    });

  } catch (error) {
    logger.error('Get active campaigns failed:', error);
    next(error);
  }
};

/**
 * Kampanya kullan
 * POST /api/campaigns/:id/use
 */
const useCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { orderId, orderAmount } = req.body;
    const userId = req.user._id;

    if (!orderId || !orderAmount) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMETERS',
          message: 'Sipariş ID ve tutarı gereklidir'
        }
      });
    }

    const campaign = await campaignService.useCampaign(id, userId, orderId, orderAmount);

    res.json({
      success: true,
      message: 'Kampanya başarıyla kullanıldı',
      data: {
        campaign: {
          id: campaign._id,
          name: campaign.name,
          discountAmount: campaign.calculateDiscount(orderAmount)
        }
      }
    });

  } catch (error) {
    logger.error('Use campaign failed:', error);
    next(error);
  }
};

/**
 * Otomatik kampanya uygula
 * POST /api/campaigns/auto-apply
 */
const autoApplyCampaign = async (req, res, next) => {
  try {
    const { orderAmount, items = [] } = req.body;
    const userId = req.user?._id;

    const autoCampaign = await campaignService.applyAutoCampaigns(userId, orderAmount, items);

    res.json({
      success: true,
      message: 'Otomatik kampanya kontrolü tamamlandı',
      data: {
        campaign: autoCampaign,
        applied: !!autoCampaign
      }
    });

  } catch (error) {
    logger.error('Auto apply campaign failed:', error);
    next(error);
  }
};

module.exports = {
  getApplicableCampaigns,
  suggestBestCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getCampaign,
  getActiveCampaigns,
  useCampaign,
  autoApplyCampaign
}; 