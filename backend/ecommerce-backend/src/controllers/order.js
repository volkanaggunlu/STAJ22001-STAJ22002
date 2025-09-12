const logger = require('../logger/logger');
const { ValidationError } = require('../errors/errors');
const orderService = require('../services/orderService');
const shippingService = require('../services/shippingService');
const { orderValidationSchema } = require('../validations/orderValidation');
const { validate } = require('../middleware/validate');
const Order = require('../models/Order');
const Invoice = require('../models/Invoice');
const fs = require('fs');

const createOrder = async (req, res, next) => {
  logger.verbose('Entering createOrder controller');
  try {
    const userId = req.user.id;
    const order = await orderService.createOrder(req.body, userId);
    logger.info(`New order created successfully. order._id: ${order._id}`);
    res.status(201).json({ 
      success: true, 
      message: 'Sipariş başarıyla oluşturuldu',
      data: { order: order.toJSON() }
    });
  } catch (error) {
    next(error);
  }
};

const receivePaytrNotification = async (req, res, next) => {
  logger.verbose('Entering receivePaytrNotification controller');
  try {
    await orderService.handlePaytrNotification(req.body);
    res.send('OK');
  } catch (error) {
    next(error);
  }
};

const receiveBasitKargoNotification = async (req, res, next) => {
  logger.verbose('Entering receiveBasitKargoNotification controller');
  try {
    await shippingService.handleBasitKargoNotification(req.body);
    res.send('OK');
  } catch (error) {
    next(error);
  }
};

const getPagedOrders = async (req, res, next) => {
  logger.verbose('Entering getPagedOrders controller');
  try {
    const result = await orderService.getPagedOrders(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  logger.verbose('Entering updateOrderStatus controller');
  try {
    const order = await orderService.updateOrderStatus(req.params.id, req.body.status);
    res.json({ order });
  } catch (error) {
    next(error);
  }
};

const getOrderByMerchantOid = async (req, res, next) => {
  logger.verbose('Entering getOrderByMerchantOid controller');
  try {
    const order = await orderService.getOrderByMerchantOid(req.params.merchant_oid);
    res.json({ order });
  } catch (error) {
    next(error);
  }
};

const getOrdersByDate = async (req, res, next) => {
  logger.verbose('Entering getOrdersByDate controller');
  try {
    const { startDate, endDate } = req.query;
    const orders = await orderService.getOrdersByDate(startDate, endDate);
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

const repeatOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;
    const oldOrder = await Order.findOne({ _id: orderId, userId });
    if (!oldOrder) {
      return res.status(404).json({ success: false, message: 'Tekrar edilecek sipariş bulunamadı.' });
    }
    // Yeni sipariş için ürünleri ve adresleri kopyala
    const newOrder = new Order({
      userId,
      items: oldOrder.items,
      totalItems: oldOrder.totalItems,
      subtotal: oldOrder.subtotal,
      shippingCost: oldOrder.shippingCost,
      taxAmount: oldOrder.taxAmount,
      discountAmount: oldOrder.discountAmount,
      totalAmount: oldOrder.totalAmount,
      currency: oldOrder.currency,
      status: 'pending',
      shippingAddress: oldOrder.shippingAddress,
      billingAddress: oldOrder.billingAddress,
      shippingMethod: oldOrder.shippingMethod,
      shippingTime: oldOrder.shippingTime,
      notes: oldOrder.notes,
      isGift: oldOrder.isGift,
      giftMessage: oldOrder.giftMessage,
      source: 'website',
      // Diğer gerekli alanlar eklenebilir
    });
    await newOrder.save();
    res.status(201).json({ success: true, message: 'Tekrar sipariş oluşturuldu.', order: newOrder });
  } catch (error) {
    next(error);
  }
};

const downloadInvoice = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;
    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Fatura bulunamadı.' });
    }
    const invoice = await Invoice.findOne({ orderId: order._id }).sort({ createdAt: -1 });
    if (!invoice || !invoice.pdfPath) {
      return res.status(404).json({ success: false, message: 'Fatura PDF hazır değil.' });
    }
    if (!fs.existsSync(invoice.pdfPath)) {
      return res.status(404).json({ success: false, message: 'Fatura dosyası bulunamadı.' });
    }
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="fatura_${order.orderNumber}.pdf"`
    });
    const stream = fs.createReadStream(invoice.pdfPath);
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  logger.verbose('Entering getOrderById controller');
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await Order.findOne({
      _id: orderId,
      userId: userId
    }).populate('userId', 'email firstName lastName');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Sipariş bulunamadı'
        }
      });
    }

    // Sipariş detaylarını formatla
    const formattedOrder = {
      _id: order._id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      status: order.status,
      customerType: order.customerType,
      paymentMethod: order.payment?.method || 'Belirtilmemiş',
      shippingType: order.shippingType || 'Standart Kargo',
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items.map(item => ({
        productId: item.productId,
        productName: item.name,
        image: item.image || '', // Ürün resmi URL'i
        price: item.price,
        originalPrice: item.originalPrice || item.price, // Orijinal fiyat (indirim öncesi)
        quantity: item.quantity,
        sku: item.sku || '', // Ürün SKU kodu
        type: item.type || 'product', // Ürün tipi
        bundledProducts: item.bundleItems || []
      })),
      shippingAddress: order.shippingAddress,
      invoiceAddress: order.billingAddress,
      subtotal: order.subtotal,
      shippingCost: order.shippingCost,
      couponDiscount: order.coupon?.discountAmount || 0,
      campaignDiscount: order.campaign?.discountAmount || 0,
      totalAmount: order.totalAmount,
      notes: order.notes,
      trackingNumber: order.tracking?.trackingNumber || null
    };

    res.json({
      success: true,
      order: formattedOrder
    });

  } catch (error) {
    logger.error('Get order by ID failed:', error);
    next(error);
  }
};

module.exports = {
  createOrder: [validate(orderValidationSchema), createOrder],
  receivePaytrNotification,
  receiveBasitKargoNotification,
  getPagedOrders,
  updateOrderStatus,
  getOrderByMerchantOid,
  getOrdersByDate,
  repeatOrder,
  downloadInvoice,
  getOrderById
};
