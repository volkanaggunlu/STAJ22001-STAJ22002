const Track = require('../models/Track');
const Order = require('../models/Order');
const logger = require('../logger/logger');

/**
 * Yeni kargo takip kaydı oluştur
 * POST /api/track
 */
const createTrack = async (req, res, next) => {
  try {
    const { orderId, trackingNumber, carrier, estimatedDelivery } = req.body;

    // Sipariş kontrolü
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Sipariş bulunamadı'
        }
      });
    }

    // Kargo takip kaydı oluştur
    const track = await Track.create({
      order: orderId,
      trackingNumber,
      carrier,
      estimatedDelivery,
      events: [{
        status: 'created',
        description: 'Kargo kaydı oluşturuldu'
      }]
    });

    // Siparişin durumunu güncelle
    await Order.findByIdAndUpdate(orderId, {
      status: 'shipping',
      shippingDetails: {
        carrier,
        trackingNumber
      }
    });

    logger.info(`Kargo takip kaydı oluşturuldu: ${trackingNumber}`);

    res.status(201).json({
      success: true,
      message: 'Kargo takip kaydı oluşturuldu',
      data: track
    });
  } catch (error) {
    logger.error('Kargo takip kaydı oluşturma hatası:', error);
    next(error);
  }
};

/**
 * Kargo durumunu güncelle
 * PUT /api/track/:id
 */
const updateTrackStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, location, description } = req.body;

    const track = await Track.findById(id);
    if (!track) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TRACK_NOT_FOUND',
          message: 'Kargo takip kaydı bulunamadı'
        }
      });
    }

    // Yeni event ekle
    await track.addEvent({
      status,
      location,
      description
    });

    // Sipariş durumunu güncelle
    if (status === 'delivered') {
      await Order.findByIdAndUpdate(track.order, {
        status: 'delivered',
        deliveryDate: new Date()
      });
    }

    logger.info(`Kargo durumu güncellendi: ${track.trackingNumber} - ${status}`);

    res.status(200).json({
      success: true,
      message: 'Kargo durumu güncellendi',
      data: track
    });
  } catch (error) {
    logger.error('Kargo durumu güncelleme hatası:', error);
    next(error);
  }
};

/**
 * Kargo takip bilgilerini getir
 * GET /api/track/:id
 */
const getTrackInfo = async (req, res, next) => {
  try {
    const { id } = req.params;

    const track = await Track.findById(id)
      .populate('order', 'orderNumber status');

    if (!track) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TRACK_NOT_FOUND',
          message: 'Kargo takip kaydı bulunamadı'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: track
    });
  } catch (error) {
    logger.error('Kargo takip bilgisi getirme hatası:', error);
    next(error);
  }
};

/**
 * Kargo takip numarasıyla bilgileri getir
 * GET /api/track/number/:trackingNumber
 */
const getTrackByNumber = async (req, res, next) => {
  try {
    const { trackingNumber } = req.params;

    const track = await Track.findOne({ trackingNumber })
      .populate('order', 'orderNumber status');

    if (!track) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TRACK_NOT_FOUND',
          message: 'Kargo takip kaydı bulunamadı'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: track
    });
  } catch (error) {
    logger.error('Kargo takip numarası ile bilgi getirme hatası:', error);
    next(error);
  }
};

/**
 * Siparişe ait kargo takip bilgilerini getir
 * GET /api/track/order/:orderId
 */
const getTrackByOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const track = await Track.findOne({ order: orderId })
      .populate('order', 'orderNumber status');

    if (!track) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TRACK_NOT_FOUND',
          message: 'Kargo takip kaydı bulunamadı'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: track
    });
  } catch (error) {
    logger.error('Sipariş ID ile kargo takip bilgisi getirme hatası:', error);
    next(error);
  }
};

module.exports = {
  createTrack,
  updateTrackStatus,
  getTrackInfo,
  getTrackByNumber,
  getTrackByOrder
}; 