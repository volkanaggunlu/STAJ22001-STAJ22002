const logger = require('../logger/logger');
const Campaign = require('../models/Campaign');
const Coupon = require('../models/Coupon');
const { ValidationError } = require('../errors/errors');

class CampaignService {
  /**
   * Kullanıcı için uygun kampanyaları bul
   */
  async findApplicableCampaigns(userId, orderAmount, items = []) {
    try {
      const campaigns = await Campaign.findForUser(userId, orderAmount, items);
      const applicableCampaigns = [];

      for (const campaign of campaigns) {
        const canApplyResult = campaign.canApply(userId, orderAmount, items);
        if (canApplyResult.valid) {
          applicableCampaigns.push({
            id: campaign._id,
            name: campaign.name,
            description: campaign.description,
            type: campaign.type,
            discount: campaign.discount,
            discountAmount: campaign.calculateDiscount(orderAmount),
            isAutoApply: campaign.isAutoApply,
            priority: campaign.priority
          });
        }
      }

      // Önceliğe göre sırala
      applicableCampaigns.sort((a, b) => b.priority - a.priority);

      return applicableCampaigns;
    } catch (error) {
      logger.error('Find applicable campaigns failed:', error);
      throw error;
    }
  }

  /**
   * Otomatik uygulanacak kampanyaları bul ve uygula
   */
  async applyAutoCampaigns(userId, orderAmount, items = []) {
    try {
      const campaigns = await Campaign.findForUser(userId, orderAmount, items);
      const appliedCampaigns = [];

      for (const campaign of campaigns) {
        if (campaign.isAutoApply) {
          const canApplyResult = campaign.canApply(userId, orderAmount, items);
          if (canApplyResult.valid) {
            appliedCampaigns.push({
              id: campaign._id,
              name: campaign.name,
              type: campaign.type,
              discount: campaign.discount,
              discountAmount: campaign.calculateDiscount(orderAmount)
            });
          }
        }
      }

      // En yüksek öncelikli kampanyayı seç
      if (appliedCampaigns.length > 0) {
        appliedCampaigns.sort((a, b) => b.priority - a.priority);
        return appliedCampaigns[0];
      }

      return null;
    } catch (error) {
      logger.error('Apply auto campaigns failed:', error);
      throw error;
    }
  }

  /**
   * Kampanya oluştur
   */
  async createCampaign(campaignData, createdBy) {
    try {
      const campaign = new Campaign({
        ...campaignData,
        createdBy
      });

      await campaign.save();
      logger.info(`Campaign created: ${campaign.name} by user: ${createdBy}`);
      return campaign;
    } catch (error) {
      logger.error('Create campaign failed:', error);
      throw error;
    }
  }

  /**
   * Kampanya güncelle
   */
  async updateCampaign(campaignId, updateData) {
    try {
      const campaign = await Campaign.findByIdAndUpdate(
        campaignId,
        updateData,
        { new: true, runValidators: true }
      );

      if (!campaign) {
        throw new ValidationError('Kampanya bulunamadı');
      }

      logger.info(`Campaign updated: ${campaign.name}`);
      return campaign;
    } catch (error) {
      logger.error('Update campaign failed:', error);
      throw error;
    }
  }

  /**
   * Kampanya sil
   */
  async deleteCampaign(campaignId) {
    try {
      const campaign = await Campaign.findByIdAndDelete(campaignId);

      if (!campaign) {
        throw new ValidationError('Kampanya bulunamadı');
      }

      logger.info(`Campaign deleted: ${campaign.name}`);
      return campaign;
    } catch (error) {
      logger.error('Delete campaign failed:', error);
      throw error;
    }
  }

  /**
   * Kampanya istatistiklerini getir
   */
  async getCampaignStats(campaignId) {
    try {
      const campaign = await Campaign.findById(campaignId);
      
      if (!campaign) {
        throw new ValidationError('Kampanya bulunamadı');
      }

      return {
        id: campaign._id,
        name: campaign.name,
        stats: campaign.stats,
        usageHistory: campaign.usageHistory,
        conversionRate: campaign.stats.totalUses > 0 
          ? (campaign.stats.uniqueUsers / campaign.stats.totalUses) * 100 
          : 0
      };
    } catch (error) {
      logger.error('Get campaign stats failed:', error);
      throw error;
    }
  }

  /**
   * Tüm aktif kampanyaları getir
   */
  async getActiveCampaigns() {
    try {
      const campaigns = await Campaign.findActive();
      return campaigns.map(campaign => ({
        id: campaign._id,
        name: campaign.name,
        description: campaign.description,
        type: campaign.type,
        discount: campaign.discount,
        isAutoApply: campaign.isAutoApply,
        priority: campaign.priority,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        stats: campaign.stats
      }));
    } catch (error) {
      logger.error('Get active campaigns failed:', error);
      throw error;
    }
  }

  /**
   * Kampanya kullan
   */
  async useCampaign(campaignId, userId, orderId, orderAmount) {
    try {
      const campaign = await Campaign.findById(campaignId);
      
      if (!campaign) {
        throw new ValidationError('Kampanya bulunamadı');
      }

      const canApplyResult = campaign.canApply(userId, orderAmount);
      if (!canApplyResult.valid) {
        throw new ValidationError(canApplyResult.reason);
      }

      await campaign.apply(userId, orderId, orderAmount);
      
      logger.info(`Campaign used: ${campaign.name} for order: ${orderId}`);
      return campaign;
    } catch (error) {
      logger.error('Use campaign failed:', error);
      throw error;
    }
  }

  /**
   * Sepet için en iyi kampanyayı öner
   */
  async suggestBestCampaign(userId, orderAmount, items = []) {
    try {
      const campaigns = await this.findApplicableCampaigns(userId, orderAmount, items);
      
      if (campaigns.length === 0) {
        return null;
      }

      // En yüksek indirim tutarına sahip kampanyayı seç
      const bestCampaign = campaigns.reduce((best, current) => {
        return current.discountAmount > best.discountAmount ? current : best;
      });

      return bestCampaign;
    } catch (error) {
      logger.error('Suggest best campaign failed:', error);
      throw error;
    }
  }
}

module.exports = new CampaignService(); 