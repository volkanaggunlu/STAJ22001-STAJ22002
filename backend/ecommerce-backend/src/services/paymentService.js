const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { 
  PAYTR_CONFIG,
  generatePayTRIframe,
  verifyPayTRCallback,
  createUserBasket,
  createUserAddress,
  getPayTRErrorMessage,
  getPayTRStatusMessage,
  validatePayTRConfig
} = require('../config/paytr');
const Order = require('../models/Order');
const User = require('../models/User');
const PaymentMethod = require('../models/PaymentMethod');
const logger = require('../logger/logger');

/**
 * Payment Types
 */
const PAYMENT_TYPES = {
  CREDIT_CARD: 'credit-card',
  BANK_TRANSFER: 'bank-transfer',
  CASH_ON_DELIVERY: 'cash-on-delivery'
};

/**
 * Payment Status Types
 */
const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

/**
 * Bank Account Information
 */
const BANK_ACCOUNTS = [
  {
    id: 'ziraat',
    name: 'Ziraat Bankası',
    accountName: 'ElektroTech Elektronik Tic. Ltd. Şti.',
    accountNumber: '1234567890',
    iban: 'TR12 0001 0012 3456 7890 1234 56',
    swift: 'TCZBTR2A'
  },
  {
    id: 'garanti',
    name: 'Garanti BBVA',
    accountName: 'ElektroTech Elektronik Tic. Ltd. Şti.',
    accountNumber: '9876543210',
    iban: 'TR98 0062 0987 6543 2109 8765 43',
    swift: 'TGBATRIS'
  },
  {
    id: 'isbank',
    name: 'İş Bankası',
    accountName: 'ElektroTech Elektronik Tic. Ltd. Şti.',
    accountNumber: '1122334455',
    iban: 'TR44 0064 0112 2334 4556 7890 12',
    swift: 'ISBKTRIS'
  }
];

/**
 * Payment Service Class
 */
class PaymentService {
  constructor() {
    this.isPayTREnabled = false;
    try {
      if (validatePayTRConfig()) {
        this.isPayTREnabled = true;
        logger.info('PayTR payment service initialized successfully');
      } else {
        logger.warn('PayTR integration is disabled due to missing configuration');
      }
    } catch (error) {
      logger.warn('PayTR integration is disabled:', error.message);
    }
  }

  /**
   * Validate payment configuration
   */
  validateConfiguration() {
    if (!validatePayTRConfig()) {
      logger.error('PayTR configuration is invalid');
      throw new Error('PayTR konfigürasyonu geçersiz');
    }
  }

  /**
   * Initialize PayTR payment
   * @param {Object} orderData - Order data
   * @returns {Object} PayTR iframe data
   */
  async initializePayTRPayment(orderData) {
    try {
      const { orderId, userIp, installmentCount } = orderData;

      // Find order
      const order = await Order.findById(orderId)
        .populate('userId', 'firstName lastName email')
        .populate('items.productId', 'name price');

      if (!order) {
        throw new Error('Sipariş bulunamadı');
      }

      if (order.payment?.status !== 'pending') {
        throw new Error('Sipariş ödeme için uygun değil');
      }

      // Create user basket
      const userBasket = createUserBasket(order.items.map(item => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity
      })));

      // Create user address
      const userAddress = createUserAddress({
        firstName: order.shippingAddress.firstName,
        lastName: order.shippingAddress.lastName,
        address: order.shippingAddress.address,
        city: order.shippingAddress.city,
        district: order.shippingAddress.district,
        country: 'Türkiye',
        phone: order.shippingAddress.phone
      });

      // Generate PayTR iframe data (params + hash)
      const paytrData = generatePayTRIframe({
        orderId: order._id,
        userIp,
        email: order.userId.email,
        amount: order.totalAmount,
        userBasket,
        userAddress,
        installmentCount
      });

      // --- YENİ: PayTR API'ye gerçek istek at ---
      const paytrApiUrl = `${PAYTR_CONFIG.apiUrl}/get-token`;
      let paytrResponse;
      
      // Test modunda simüle et
      if (PAYTR_CONFIG.testMode) {
        logger.info('PayTR test modu aktif - API çağrısı simüle ediliyor');
        paytrResponse = {
          data: {
            status: 'success',
            token: 'test_token_' + Date.now(),
            reason: 'Test modu'
          }
        };
      } else {
        try {
          paytrResponse = await axios.post(paytrApiUrl, paytrData.iframeData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            timeout: 10000
          });
        } catch (err) {
          logger.error('PayTR API isteği başarısız:', err.response?.data || err.message);
          throw new Error('PayTR API bağlantı hatası: ' + (err.response?.data?.reason || err.message));
        }
      }

      if (!paytrResponse.data || paytrResponse.data.status !== 'success') {
        logger.error('PayTR API hata:', paytrResponse.data);
        throw new Error('PayTR API hata: ' + (paytrResponse.data?.reason || 'Bilinmeyen hata'));
      }

      // Update order with PayTR data
      await Order.findByIdAndUpdate(orderId, {
        'payment.method': PAYMENT_TYPES.CREDIT_CARD,
        'payment.status': PAYMENT_STATUS.PROCESSING,
        'payment.transactionId': paytrData.merchantOid,
        'payment.paymentDate': new Date()
      });

      logger.info(`PayTR payment initialized for order: ${orderId}`);

      return {
        iframeToken: paytrResponse.data.token,
        iframeUrl: paytrData.iframeUrl,
        merchantOid: paytrData.merchantOid,
        amount: order.totalAmount,
        currency: 'TL'
      };
    } catch (error) {
      logger.error('PayTR payment initialization failed:', error);
      throw error;
    }
  }

  /**
   * Handle PayTR callback
   * @param {Object} callbackData - PayTR callback data
   * @returns {Object} Callback result
   */
  async handlePayTRCallback(callbackData) {
    try {
      const { merchant_oid, status, total_amount, hash } = callbackData;

      // Verify callback hash (test modunda bypass et)
      let isValidHash = true;
      if (!PAYTR_CONFIG.testMode) {
        isValidHash = verifyPayTRCallback({
          merchantOid: merchant_oid,
          status,
          totalAmount: total_amount,
          hash,
          merchantSalt: PAYTR_CONFIG.merchantSalt
        });
      }

      if (!isValidHash) {
        logger.error(`PayTR callback hash verification failed: ${merchant_oid}`);
        return { success: false, message: 'Geçersiz callback hash' };
      }

      // Find order by merchant_oid (transactionId)
      const order = await Order.findOne({
        'payment.transactionId': merchant_oid
      });

      if (!order) {
        logger.error(`Order not found for PayTR callback: ${merchant_oid}`);
        return { success: false, message: 'Sipariş bulunamadı' };
      }

      // Update order status based on PayTR status
      let newPaymentStatus = 'failed';
      let newOrderStatus = 'cancelled';

      if (status === 'success') {
        newPaymentStatus = 'completed';
        newOrderStatus = 'confirmed';
      } else if (status === 'failed') {
        newPaymentStatus = 'failed';
        newOrderStatus = 'cancelled';
      } else if (status === 'waiting') {
        newPaymentStatus = 'processing';
        newOrderStatus = 'pending';
      }

      // Update order
      await Order.findByIdAndUpdate(order._id, {
        'payment.status': newPaymentStatus,
        status: newOrderStatus,
        'payment.paymentDate': new Date()
      });

      logger.info(`PayTR callback processed for order: ${order._id}, Status: ${status}`);

      return { 
        success: true, 
        message: 'Callback işlendi',
        orderId: order._id,
        status: newPaymentStatus
      };
    } catch (error) {
      logger.error('PayTR callback handling failed:', error);
      return { success: false, message: 'Callback işleme hatası' };
    }
  }

  /**
   * Get payment status
   * @param {string} orderId - Order ID
   * @returns {Object} Payment status
   */
  async getPaymentStatus(orderId) {
    try {
      const order = await Order.findById(orderId)
        .select('payment totalAmount');

      if (!order) {
        throw new Error('Sipariş bulunamadı');
      }

      const paymentInfo = {
        orderId: order._id,
        paymentStatus: order.payment?.status,
        paymentMethod: order.payment?.method,
        totalAmount: order.totalAmount,
        paymentDetails: order.payment?.transactionDetails
      };

      // Add human-readable status message
      if (order.payment?.method === PAYMENT_TYPES.CREDIT_CARD && order.payment?.transactionDetails?.paytrStatus) {
        paymentInfo.statusMessage = getPayTRStatusMessage(order.payment.transactionDetails.paytrStatus);
      }

      logger.info(`Payment status retrieved for order: ${orderId}`);
      return paymentInfo;
    } catch (error) {
      logger.error('Get payment status failed:', error);
      throw error;
    }
  }

  /**
   * Initialize bank transfer payment
   * @param {string} orderId - Order ID
   * @returns {Object} Bank transfer data
   */
  async initializeBankTransferPayment(orderId) {
    try {
      const order = await Order.findById(orderId);

      if (!order) {
        throw new Error('Sipariş bulunamadı');
      }

      if (order.payment?.status !== PAYMENT_STATUS.PENDING) {
        throw new Error('Sipariş ödeme için uygun değil');
      }

      // Update order payment method
      await Order.findByIdAndUpdate(orderId, {
        'payment.method': PAYMENT_TYPES.BANK_TRANSFER,
        'payment.status': PAYMENT_STATUS.PROCESSING,
        'payment.transactionDetails.bankTransferRequestTime': new Date()
      });

      logger.info(`Bank transfer payment initialized for order: ${orderId}`);

      return {
        orderId: order._id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        bankAccounts: BANK_ACCOUNTS,
        instructions: {
          tr: 'Lütfen havale/EFT yaparken açıklama kısmına sipariş numaranızı yazınız. Ödeme onaylandıktan sonra siparişiniz hazırlanmaya başlayacaktır.',
          en: 'Please write your order number in the description field when making the transfer. Your order will be prepared after payment confirmation.'
        }
      };
    } catch (error) {
      logger.error('Bank transfer payment initialization failed:', error);
      throw error;
    }
  }

  /**
   * Handle bank transfer notification
   * @param {Object} transferData - Transfer notification data
   * @returns {Object} Notification result
   */
  async handleBankTransferNotification(transferData) {
    try {
      const { 
        orderId, 
        orderNumber, 
        transferAmount, 
        transferDate, 
        senderName, 
        senderIban, 
        description,
        bankAccount
      } = transferData;

      // Find order
      let order;
      if (orderId) {
        order = await Order.findById(orderId);
      } else if (orderNumber) {
        order = await Order.findOne({ orderNumber });
      }

      if (!order) {
        throw new Error('Sipariş bulunamadı');
      }

      if (order.payment?.method !== PAYMENT_TYPES.BANK_TRANSFER) {
        throw new Error('Sipariş havale ödemesi için uygun değil');
      }

      // Update order with transfer details
      await Order.findByIdAndUpdate(order._id, {
        'payment.status': PAYMENT_STATUS.PROCESSING,
        'payment.transactionDetails.bankTransferAmount': transferAmount,
        'payment.transactionDetails.bankTransferDate': transferDate,
        'payment.transactionDetails.bankTransferSender': senderName,
        'payment.transactionDetails.bankTransferIban': senderIban,
        'payment.transactionDetails.bankTransferDescription': description,
        'payment.transactionDetails.bankTransferAccount': bankAccount,
        'payment.transactionDetails.bankTransferNotificationTime': new Date()
      });

      logger.info(`Bank transfer notification received for order: ${order._id}`);

      return {
        success: true,
        message: 'Havale bildirimi alındı',
        orderId: order._id,
        orderNumber: order.orderNumber
      };
    } catch (error) {
      logger.error('Bank transfer notification handling failed:', error);
      throw error;
    }
  }

  /**
   * Upload bank transfer receipt
   * @param {string} orderId - Order ID
   * @param {Object} file - Uploaded file
   * @returns {Object} Upload result
   */
  async uploadBankTransferReceipt(orderId, file) {
    try {
      const order = await Order.findById(orderId);

      if (!order) {
        throw new Error('Sipariş bulunamadı');
      }

      if (order.payment?.method !== PAYMENT_TYPES.BANK_TRANSFER) {
        throw new Error('Sipariş havale ödemesi için uygun değil');
      }

      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'uploads', 'receipts');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Generate unique filename
      const filename = `receipt_${orderId}_${Date.now()}_${file.originalname}`;
      const filepath = path.join(uploadsDir, filename);

      // Save file
      fs.writeFileSync(filepath, file.buffer);

      // Update order with receipt info
      await Order.findByIdAndUpdate(orderId, {
        'payment.transactionDetails.bankTransferReceipt': filename,
        'payment.transactionDetails.bankTransferReceiptPath': filepath,
        'payment.transactionDetails.bankTransferReceiptUploadTime': new Date()
      });

      logger.info(`Bank transfer receipt uploaded for order: ${orderId}`);

      return {
        success: true,
        message: 'Dekont başarıyla yüklendi',
        filename,
        uploadTime: new Date()
      };
    } catch (error) {
      logger.error('Bank transfer receipt upload failed:', error);
      throw error;
    }
  }

  /**
   * Process refund
   * @param {string} orderId - Order ID
   * @param {Object} refundData - Refund data
   * @returns {Object} Refund result
   */
  async processRefund(orderId, refundData) {
    try {
      const { refundAmount, refundReason, refundType = 'full' } = refundData;

      const order = await Order.findById(orderId);

      if (!order) {
        throw new Error('Sipariş bulunamadı');
      }

      if (order.payment?.status !== PAYMENT_STATUS.COMPLETED) {
        throw new Error('Sipariş iade için uygun değil');
      }

      // Validate refund amount
      if (refundAmount > order.totalAmount) {
        throw new Error('İade tutarı sipariş tutarından büyük olamaz');
      }

      // Model enumlarında partial_refunded yok; detay bilgilerini transactionDetails altında tutuyoruz
      const newPaymentStatus = PAYMENT_STATUS.REFUNDED;

      await Order.findByIdAndUpdate(orderId, {
        'payment.status': newPaymentStatus,
        'payment.refundAmount': refundAmount,
        'payment.refundDate': new Date(),
        'payment.transactionDetails.refundReason': refundReason,
        'payment.transactionDetails.refundType': refundType,
        'payment.transactionDetails.refundProcessTime': new Date()
      });

      logger.info(`Refund processed for order: ${orderId}, Amount: ${refundAmount}`);

      return {
        success: true,
        message: 'İade işlemi tamamlandı',
        refundAmount,
        refundType,
        processTime: new Date()
      };
    } catch (error) {
      logger.error('Refund processing failed:', error);
      throw error;
    }
  }

  /**
   * Get available payment methods
   * @returns {Array} Payment methods
   */
  async getAvailablePaymentMethods() {
    const methods = await PaymentMethod.find({ isActive: true }).sort({ order: 1 });
    return methods;
  }

  /**
   * Get bank accounts
   * @returns {Array} Bank accounts
   */
  getBankAccounts() {
    return BANK_ACCOUNTS;
  }
}

// Create and export singleton instance
const paymentService = new PaymentService();

module.exports = {
  paymentService,
  PAYMENT_TYPES,
  PAYMENT_STATUS
}; 