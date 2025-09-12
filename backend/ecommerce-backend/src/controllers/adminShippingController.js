const shippingService = require('../services/shippingService');
const orderService = require('../services/orderService');
const Order = require('../models/Order');
const logger = require('../logger/logger');
const { ValidationError } = require('../errors/errors');

/**
 * Sipariş için kargo gönderisi oluştur
 * POST /api/admin/orders/:orderId/shipping
 */
const createOrderShipment = async (req, res, next) => {
  try {
    logger.verbose('Entering createOrderShipment controller');
    
    const { orderId } = req.params;
    const { carrier, service, weight, dimensions, insuranceValue, specialInstructions } = req.body;

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

    // Zaten kargo kaydı varsa hata dön
    if (order.tracking && order.tracking.trackingNumber) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'SHIPMENT_ALREADY_EXISTS',
          message: 'Bu sipariş için zaten kargo gönderisi oluşturulmuş'
        }
      });
    }

    // Kargo gönderisi oluştur
    const shipmentData = {
      orderId,
      carrier,
      service: service || 'standard',
      weight,
      dimensions,
      insuranceValue: insuranceValue || 0,
      specialInstructions,
      senderInfo: {
        name: 'ElektroTech',
        address: 'Merkez Ofis Adresi', // Bu bilgiler environment'dan gelecek
        city: 'İstanbul',
        phone: '+90 212 555 0000'
      },
      receiverInfo: {
        name: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
        address: order.shippingAddress.address,
        city: order.shippingAddress.city,
        district: order.shippingAddress.district,
        postalCode: order.shippingAddress.postalCode,
        phone: order.shippingAddress.phone
      }
    };

    const shipment = await shippingService.createShipment(shipmentData);

    // Sipariş tracking bilgilerini güncelle
    await Order.findByIdAndUpdate(orderId, {
      'tracking.trackingNumber': shipment.trackingNumber,
      'tracking.carrier': carrier,
      'tracking.service': service || 'standard',
      'tracking.status': 'created',
      'tracking.estimatedDelivery': shipment.estimatedDelivery,
      'tracking.weight': weight,
      'tracking.dimensions': dimensions,
      'tracking.insuranceValue': insuranceValue || 0,
      'tracking.labelUrl': shipment.labelUrl,
      'tracking.specialInstructions': specialInstructions,
      'tracking.updatedAt': new Date(),
      'status': 'processing' // Sipariş durumunu güncelle
    });

    logger.info(`Shipping created for order: ${orderId}, tracking: ${shipment.trackingNumber}`);

    res.status(201).json({
      success: true,
      message: 'Kargo gönderisi başarıyla oluşturuldu',
      data: {
        trackingNumber: shipment.trackingNumber,
        estimatedDelivery: shipment.estimatedDelivery,
        labelUrl: shipment.labelUrl,
        cost: shipment.cost
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Create order shipment failed:', error);
    next(error);
  }
};

/**
 * Sipariş kargo bilgilerini getir
 * GET /api/admin/orders/:orderId/shipping
 */
const getOrderShipping = async (req, res, next) => {
  try {
    logger.verbose('Entering getOrderShipping controller');
    
    const { orderId } = req.params;

    const order = await Order.findById(orderId).select('tracking');
    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Sipariş bulunamadı'
        }
      });
    }

    // Eğer takip numarası varsa güncel durum bilgilerini al
    let trackingDetails = null;
    if (order.tracking && order.tracking.trackingNumber && order.tracking.carrier) {
      try {
        trackingDetails = await shippingService.trackShipment(
          order.tracking.carrier, 
          order.tracking.trackingNumber
        );
      } catch (trackingError) {
        logger.warn(`Failed to get tracking details: ${trackingError.message}`);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Sipariş kargo bilgileri getirildi',
      data: {
        shipping: order.tracking,
        trackingDetails
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get order shipping failed:', error);
    next(error);
  }
};

/**
 * Kargo şirketleri listesi
 * GET /api/admin/shipping/carriers
 */
const getCarriers = async (req, res, next) => {
  try {
    logger.verbose('Entering getCarriers controller');
    
    const carriers = await shippingService.getCarriers();

    res.status(200).json({
      success: true,
      message: 'Kargo şirketleri başarıyla getirildi',
      data: {
        carriers
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get carriers failed:', error);
    next(error);
  }
};

/**
 * Kargo takip
 * GET /api/admin/shipping/track/:carrier/:trackingNumber
 */
const trackShipment = async (req, res, next) => {
  try {
    logger.verbose('Entering trackShipment controller');
    
    const { carrier, trackingNumber } = req.params;
    const trackingInfo = await shippingService.trackShipment(carrier, trackingNumber);

    res.status(200).json({
      success: true,
      message: 'Kargo takip bilgileri getirildi',
      data: trackingInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Track shipment failed:', error);
    next(error);
  }
};

/**
 * Kargo etiketi indir
 * GET /api/admin/shipping/label/:carrier/:trackingNumber
 */
const downloadLabel = async (req, res, next) => {
  try {
    logger.verbose('Entering downloadLabel controller');
    
    const { carrier, trackingNumber } = req.params;
    const labelData = await shippingService.downloadLabel(carrier, trackingNumber);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="label-${trackingNumber}.pdf"`);
    res.send(labelData);
  } catch (error) {
    logger.error('Download label failed:', error);
    next(error);
  }
};

/**
 * Kargo ücreti hesapla
 * POST /api/admin/shipping/calculate
 */
const calculateShippingCost = async (req, res, next) => {
  try {
    logger.verbose('Entering calculateShippingCost controller');
    
    const rateData = req.body;
    const rates = await shippingService.calculateRates(rateData);

    res.status(200).json({
      success: true,
      message: 'Kargo ücretleri hesaplandı',
      data: {
        rates
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Calculate shipping cost failed:', error);
    next(error);
  }
};

/**
 * Kargo güncelle
 * PUT /api/admin/orders/:orderId/shipping/:shippingId
 */
const updateShipment = async (req, res, next) => {
  try {
    logger.verbose('Entering updateShipment controller');
    
    const { orderId } = req.params;
    const updateData = req.body;

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

    // Tracking bilgilerini güncelle
    const trackingUpdate = {};
    if (updateData.status) trackingUpdate['tracking.status'] = updateData.status;
    if (updateData.estimatedDelivery) trackingUpdate['tracking.estimatedDelivery'] = updateData.estimatedDelivery;
    if (updateData.actualDelivery) trackingUpdate['tracking.actualDelivery'] = updateData.actualDelivery;
    if (updateData.specialInstructions) trackingUpdate['tracking.specialInstructions'] = updateData.specialInstructions;
    
    trackingUpdate['tracking.updatedAt'] = new Date();

    await Order.findByIdAndUpdate(orderId, trackingUpdate);

    logger.info(`Shipment updated for order: ${orderId}`);

    res.status(200).json({
      success: true,
      message: 'Kargo bilgileri başarıyla güncellendi',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Update shipment failed:', error);
    next(error);
  }
};

module.exports = {
  createOrderShipment,
  getOrderShipping,
  updateShipment,
  getCarriers,
  trackShipment,
  downloadLabel,
  calculateShippingCost
}; 