const crypto = require('crypto');
const logger = require('../logger/logger');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Coupon = require('../models/Coupon');
const Product = require('../models/Product');
const User = require('../models/User');
const mongoose = require('mongoose');
const { ValidationError } = require('../errors/errors');
const { MERCHANT_KEY, MERCHANT_SALT, NODE_ENV, FREE_SHIPPING_LIMIT, STANDARD_SHIPPING_COST } = require('../config/environment');
const shippingService = require('./shippingService');
const { emailService } = require('./emailService');
const campaignService = require('./campaignService');
const invoiceService = require('./invoiceService');

class OrderService {
  /**
   * Yeni sipariş oluşturur
   */
  async createOrder(orderData, userId) {
    const { 
      customerType, shippingAddress, invoiceAddress, billingAddress, items, 
      paymentMethod, couponCode, campaign, notes, shippingType,
      kvkkConsent, privacyPolicyConsent, distanceSalesConsent
    } = orderData;

    // Firma için fatura adresini shipping yerine invoiceAddress || billingAddress'ten çözümle
    const resolvedInvoiceAddress = customerType === 'firma'
      ? (invoiceAddress || billingAddress)
      : (billingAddress || shippingAddress);

    // Firma ise fatura adresi zorunlu ve companyName, taxNumber kontrolü
    if (customerType === 'firma') {
      if (!resolvedInvoiceAddress || !resolvedInvoiceAddress.companyName || !resolvedInvoiceAddress.taxNumber) {
        throw new ValidationError('Firma siparişlerinde şirket adı ve vergi numarası zorunludur.');
      }
    }

    // Ürünleri kontrol et ve toplam hesapla
    let subtotal = 0;
    let totalItems = 0;
    const orderItems = [];

    for (const item of items) {
      let product = null;
      if (mongoose.Types.ObjectId.isValid(item.productId)) {
        product = await Product.findById(item.productId);
      }
      if (!product) {
        // SKU üzerinden dene
        const sku = item.sku || item.productId;
        product = await Product.findOne({ sku: sku });
      }
      if (!product) {
        throw new ValidationError(`Ürün bulunamadı: ${item.productId}`);
      }

      if (product.stock.quantity < item.quantity) {
        throw new ValidationError(`${product.name} için yeterli stok yok. Mevcut: ${product.stock.quantity}`);
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;
      totalItems += item.quantity;

      orderItems.push({
        productId: product._id,
        name: product.name,
        image: product.images[0]?.url || '',
        price: product.price,
        originalPrice: product.originalPrice,
        quantity: item.quantity,
        sku: product.sku,
        type: product.type,
        bundleItems: product.type === 'bundle' ? product.bundleItems || [] : undefined
      });
    }

    // Kupon/kampanya
    let couponData = null;
    let discountAmount = 0;
    if (couponCode) {
      const couponDoc = await Coupon.findOne({ code: couponCode });
      if (!couponDoc) {
        throw new ValidationError('Kupon kodu geçerli değil veya bulunamadı.');
      }
      
      const canUseResult = couponDoc.canUse(userId, subtotal);
      if (!canUseResult.valid) {
        throw new ValidationError(`Kupon kodu kullanılamaz: ${canUseResult.reason}`);
      }
      
      discountAmount = couponDoc.calculateDiscount(subtotal);
      couponData = {
        code: couponDoc.code,
        discountType: couponDoc.type,
        discountValue: couponDoc.value,
        discountAmount: discountAmount
      };
    }

    let campaignData = null;
    if (campaign) {
      const validId = campaign.id && mongoose.Types.ObjectId.isValid(campaign.id) ? campaign.id : undefined;
      campaignData = {
        ...(validId ? { id: validId } : {}),
        name: campaign.name,
        type: campaign.type,
        discountType: campaign.discountType,
        discountValue: campaign.discountValue,
        discountAmount: campaign.discountAmount
      };
      if (typeof campaign.discountAmount === 'number') {
        discountAmount = campaign.discountAmount;
      }
    } else if (!couponCode) {
      // Frontend'den kampanya gelmemişse ve kupon da yoksa otomatik kampanya kontrol et
      const autoCampaign = await campaignService.applyAutoCampaigns(userId, subtotal, items);
      if (autoCampaign) {
        campaignData = {
          id: autoCampaign.id,
          name: autoCampaign.name,
          type: autoCampaign.type,
          discountType: autoCampaign.discount.type,
          discountValue: autoCampaign.discount.value,
          discountAmount: autoCampaign.discountAmount
        };
        discountAmount = autoCampaign.discountAmount;
      }
    }

    // Kargo ücreti hesaplama - YENİ MANTIK (200₺ üzeri ücretsiz, altında 25₺)
    const freeShippingLimit = FREE_SHIPPING_LIMIT || 200;
    const standardShippingCost = STANDARD_SHIPPING_COST || 25;
    const shippingCost = subtotal >= freeShippingLimit ? 0 : standardShippingCost;
    
    logger.info(`Shipping calculation: subtotal=${subtotal}, limit=${freeShippingLimit}, cost=${shippingCost}`);

    // Toplam tutar hesaplama
    const totalAmount = subtotal + shippingCost - discountAmount;

    // Yeni sipariş oluştur (orderNumber model pre-save ile üretilecek)
    const order = new Order({
      userId,
      items: orderItems,
      totalItems,
      subtotal,
      shippingCost,
      discountAmount,
      totalAmount,
      currency: 'TRY',
      status: 'pending',
      shippingAddress,
      billingAddress: resolvedInvoiceAddress || shippingAddress,
      shippingMethod: 'standard',
      shippingType: shippingType || 'standart',
      payment: {
        method: paymentMethod,
        status: 'pending'
      },
      coupon: couponData,
      campaign: campaignData,
      notes,
      kvkkConsent,
      privacyPolicyConsent,
      distanceSalesConsent,
      customerType
    });

    // Benzersiz orderNumber için retry
    let attempt = 0;
    while (true) {
      try {
        await order.save();
        break;
      } catch (err) {
        const isDup = err && err.code === 11000 && String(err.message || '').includes('orderNumber');
        if (isDup && attempt < 3) {
          attempt += 1;
          order.orderNumber = order.generateOrderNumber();
          continue;
        }
        throw err;
      }
    }

    // Sipariş onay e-postası gönder
    try {
      const user = await User.findById(userId);
      if (user) {
        await emailService.sendOrderConfirmationEmail(user, order);
        logger.info(`Order confirmation email sent for order: ${order.orderNumber}`);
      }
    } catch (emailError) {
      logger.error(`Failed to send order confirmation email for order: ${order.orderNumber}`, emailError);
      // E-posta gönderimi başarısız olsa bile sipariş oluşturma işlemi devam eder
    }

    // Fatura taslağı oluştur
    try {
      await this.ensureInvoiceDraft(order._id, userId);
    } catch (invErr) {
      logger.warn(`Invoice draft creation failed for order: ${order.orderNumber} - ${invErr.message}`);
    }

    logger.info(`Order created: ${order.orderNumber} for user: ${userId}`);
    return order;
  }

  async ensureInvoiceDraft(orderId, userId) {
    try {
      await invoiceService.createInitial(orderId, { userId });
    } catch (e) {
      throw e;
    }
  }

  /**
   * PayTR bildirimini işler
   */
  async handlePaytrNotification(callbackData) {
    // Hash doğrulama
    const paytr_token = callbackData.merchant_oid + MERCHANT_SALT + callbackData.status + callbackData.total_amount;
    const token = crypto.createHmac('sha256', MERCHANT_KEY).update(paytr_token).digest('base64');

    if (callbackData.test_mode && NODE_ENV === 'production') {
      logger.info('PayTR test mode notification received.');
      return true;
    }

    if (token !== callbackData.hash) {
      throw new ValidationError(`Invalid hash: ${token} - ${callbackData.hash}`);
    }

    if (callbackData.status === 'success') {
      return await this.handleSuccessfulPayment(callbackData);
    } else if (callbackData.status === 'failed') {
      return await this.handleFailedPayment(callbackData);
    } else {
      throw new ValidationError(`Invalid status: ${callbackData.status}`);
    }
  }

  /**
   * Başarılı ödemeyi işler
   */
  async handleSuccessfulPayment(callbackData) {
    const order = await Order.findOneAndUpdate(
      { 'payment.transactionId': callbackData.merchant_oid },
      {
        status: 'confirmed',
        'payment.status': 'completed',
        'payment.paymentDate': new Date(),
        'payment.transactionDetails': {
          paytrStatus: callbackData.status,
          paytrAmount: callbackData.total_amount,
          paytrHash: callbackData.hash,
          paytrCallbackTime: new Date()
        }
      },
      { new: true }
    ).populate('userId');

    if (!order) {
      throw new ValidationError(`Order with transactionId ${callbackData.merchant_oid} does not exist`);
    }

    // Ödeme onay e-postası gönder
    try {
      if (order.userId) {
        await emailService.sendOrderConfirmationEmail(order.userId, order);
        logger.info(`Payment confirmation email sent for order: ${order.orderNumber}`);
      }
    } catch (emailError) {
      logger.error(`Failed to send payment confirmation email for order: ${order.orderNumber}`, emailError);
      // E-posta gönderimi başarısız olsa bile ödeme işlemi devam eder
    }

    // Stok güncelleme
    await this.decreaseStock(order);

    // Kampanya kullanımını kaydet
    if (order.campaign && order.campaign.id) {
      try {
        await campaignService.useCampaign(order.campaign.id, order.userId, order._id, order.subtotal);
        logger.info(`Campaign usage recorded: ${order.campaign.name} for order: ${order.orderNumber}`);
      } catch (campaignError) {
        logger.error(`Failed to record campaign usage for order: ${order.orderNumber}`, campaignError);
        // Kampanya kaydı başarısız olsa bile sipariş işlemi devam eder
      }
    }

    return order;
  }

  /**
   * Başarısız ödemeyi işler
   */
  async handleFailedPayment(callbackData) {
    const order = await Order.findOneAndUpdate(
      { 'payment.transactionId': callbackData.merchant_oid },
      {
        status: 'cancelled',
        'payment.status': 'failed',
        'payment.transactionDetails.failedReason': callbackData.failed_reason_message ?? null
      },
      { new: true }
    );

    if (!order) {
      throw new ValidationError(`Order with merchant_oid ${callbackData.merchant_oid} does not exist`);
    }

    return order;
  }

  /**
   * Stok miktarını azaltır
   */
  async decreaseStock(order) {
    try {
      for (const item of order.items) {
        const product = await Product.findById(item.productId);
        if (product && product.stock.trackStock) {
          const oldStock = product.stock.quantity;
          product.stock.quantity = Math.max(product.stock.quantity - item.quantity, 0);
          
          logger.info(`Product ${product.name} stock decreased from ${oldStock} to ${product.stock.quantity}`);
          await product.save();
        }
      }
    } catch (error) {
      logger.error('Failed to decrease stock:', error);
      // Stok güncelleme başarısız olsa bile sipariş işlemi devam eder
    }
  }

  /**
   * Sahte stok miktarını azaltır (eski fonksiyon - geriye uyumluluk için)
   */
  async decreaseFakeStock(order) {
    const _order = await Order.findById(order._id).populate({
      path: 'cart',
      populate: {
        path: 'products.product',
        model: 'Product'
      }
    });

    const products = await Product.find({
      _id: { $in: _order.cart.products.map(p => p.product) }
    });

    for (const product of products) {
      if (product.fakeStock) {
        const oldFakeStock = product.fakeStock;
        const quantity = _order.cart.products.find(
          p => p.product._id.toString() === product._id.toString()
        ).quantity;

        product.fakeStock = Math.max(product.fakeStock - quantity, 2);
        
        logger.verbose(`Product with _id ${product._id} fakeStock decreased from ${oldFakeStock} to ${product.fakeStock}`);
        await product.save();
      }
    }
  }

  /**
   * Sayfalanmış siparişleri getirir
   */
  async getPagedOrders(query) {
    const { page = 1, limit = 10, status, startDate, endDate } = query;

    const filter = {};
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('userId', 'firstName lastName email')
      .populate('items.productId', 'name price images');

    const total = await Order.countDocuments(filter);

    return {
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Sipariş durumunu günceller
   */
  async updateOrderStatus(orderId, status) {
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    ).populate({
      path: 'cart',
      populate: {
        path: 'products.product',
        model: 'Product'
      }
    });

    if (!order) {
      throw new ValidationError(`Order with id ${orderId} does not exist`);
    }

    // EFT ödemesi onaylandığında
    if (order.payment_type === 'eft' && status === 'paid' && order.status === 'pending') {
      if (NODE_ENV === "production" || process.env.TEST_MODE === '1') {
        await shippingService.onSetToPaid(order);
      }
      await this.decreaseFakeStock(order);
      await Cart.findByIdAndUpdate(order.cart, { bought: true });
    }

    // Sipariş teslim edildiğinde
    if (status === 'delivered' && !order.sentToStockMount && !order.sentToKolayBi) {
      await shippingService.onSetToDelivered(order);
    }

    return order;
  }

  /**
   * Merchant OID ile sipariş getirir
   */
  async getOrderByMerchantOid(merchantOid) {
    const order = await Order.findOne({ merchant_oid: merchantOid }).populate({
      path: 'cart',
      populate: {
        path: 'products.product',
        model: 'Product'
      }
    });

    if (!order) {
      throw new ValidationError(`Order with merchant_oid ${merchantOid} does not exist`);
    }

    return order;
  }

  /**
   * Belirli tarih aralığındaki siparişleri getirir
   */
  async getOrdersByDate(startDate, endDate) {
    // Helper function to adjust to Turkey's timezone (UTC+3)
    const toTurkeyTime = (date) => {
      if (!date) return null;
      // Create a UTC date from the input
      const utcDate = new Date(date);
      // Adjust hours for Turkey (UTC+3)
      return new Date(utcDate.getTime() + 3 * 60 * 60 * 1000);
    };

    // Parse and adjust dates
    let start = startDate ? toTurkeyTime(startDate) : null;
    let end = endDate ? toTurkeyTime(endDate) : null;

    if ((startDate && isNaN(start.getTime())) || (endDate && isNaN(end.getTime()))) {
      throw new ValidationError('Invalid date format. Please use YYYY-MM-DD.');
    }

    let query = {
      status: { $in: ['confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'] }
    };

    if (start || end) {
      query.createdAt = {};

      if (start && end) {
        if (start.toDateString() === end.toDateString()) {
          // Same day
          query.createdAt.$gte = new Date(start.setHours(0, 0, 0, 0));
          query.createdAt.$lt = new Date(start.getTime() + 24 * 60 * 60 * 1000);
        } else {
          // Different days
          query.createdAt.$gte = new Date(start.setHours(0, 0, 0, 0));
          query.createdAt.$lt = new Date(end.setHours(24, 0, 0, 0));
        }
      } else if (start) {
        // Only startDate is provided
        query.createdAt.$gte = new Date(start.setHours(0, 0, 0, 0));
      } else if (end) {
        // Only endDate is provided
        query.createdAt.$lte = new Date(end.setHours(23, 59, 59, 999));
      }
    }

    const orders = await Order.find(query).populate({
      path: 'cart',
      populate: {
        path: 'products.product',
        model: 'Product'
      }
    });

    // Adjust createdAt dates to Turkey time before sending to frontend
    const adjustedOrders = orders.map(order => ({
      ...order.toObject(),
      createdAt: new Date(order.createdAt.getTime() + 3 * 60 * 60 * 1000) // Adjust to Turkey time
    }));

    logger.verbose(`Got ${orders.length} orders between ${startDate} and ${endDate}`);
    return adjustedOrders;
  }
}

module.exports = new OrderService(); 