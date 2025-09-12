const shippingService = require('../services/shippingService');
const logger = require('../logger/logger');

/**
 * Kargo takip bilgisi al
 * GET /api/shipping/tracking/:trackingNumber
 */
const getTrackingInfo = async (req, res, next) => {
  try {
    const { trackingNumber } = req.params;
    const { carrier } = req.query; // Carrier bilgisi query parametresinden alınabilir
    
    // Eğer carrier belirtilmemişse, en yaygın kargo şirketlerini dene
    const carriersToTry = carrier ? [carrier] : ['aras', 'mng', 'yurtici', 'ptt'];
    
    let trackingInfo = null;
    let lastError = null;
    
    for (const carrierCode of carriersToTry) {
      try {
        trackingInfo = await shippingService.trackShipment(carrierCode, trackingNumber);
        if (trackingInfo) {
          trackingInfo.carrier = carrierCode;
          break;
        }
      } catch (error) {
        lastError = error;
        continue;
      }
    }
    
    if (!trackingInfo) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TRACKING_NOT_FOUND',
          message: 'Takip numarası bulunamadı veya geçersiz'
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Kargo takip bilgisi başarıyla alındı',
      data: trackingInfo
    });
  } catch (error) {
    logger.error('Kargo takip bilgisi alma hatası:', error);
    next(error);
  }
};

/**
 * Kargo ücretlerini hesapla
 * POST /api/shipping/rates
 */
const calculateRates = async (req, res, next) => {
  try {
    const rateData = req.body;
    const rates = await shippingService.calculateRates(rateData);

    res.status(200).json({
      success: true,
      message: 'Kargo ücretleri başarıyla hesaplandı',
      data: {
        rates
      }
    });
  } catch (error) {
    logger.error('Kargo ücret hesaplama hatası:', error);
    next(error);
  }
};

/**
 * Kargo şirketlerini listele
 * GET /api/shipping/carriers
 */
const getCarriers = async (req, res, next) => {
  try {
    const carriers = await shippingService.getCarriers();

    res.status(200).json({
      success: true,
      message: 'Kargo şirketleri başarıyla listelendi',
      data: {
        carriers
      }
    });
  } catch (error) {
    logger.error('Kargo şirketleri listeleme hatası:', error);
    next(error);
  }
};

module.exports = {
  getTrackingInfo,
  calculateRates,
  getCarriers
}; 