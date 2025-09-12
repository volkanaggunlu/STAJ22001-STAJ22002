const multer = require('multer');
const { paymentService } = require('../services/paymentService');
const logger = require('../logger/logger');

// Multer configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Sadece resim dosyaları yüklenebilir'), false);
    }
  }
});

/**
 * Initialize PayTR payment
 * POST /api/payments/paytr/init
 */
const initializePayTRPayment = async (req, res, next) => {
  try {
    logger.verbose('Entering initializePayTRPayment controller');
    
    const { orderId, installmentCount } = req.body;
    const userIp = req.ip || req.connection.remoteAddress;

    const paymentData = await paymentService.initializePayTRPayment({
      orderId,
      userIp,
      installmentCount
    });

    logger.info(`PayTR payment initialized for order: ${orderId}`);

    res.status(200).json({
      success: true,
      message: 'PayTR ödeme başlatıldı',
      data: paymentData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('PayTR payment initialization failed:', error);
    next(error);
  }
};

/**
 * Handle PayTR callback
 * POST /api/payments/paytr/callback
 */
const handlePayTRCallback = async (req, res, next) => {
  try {
    logger.verbose('Entering handlePayTRCallback controller');
    
    const callbackData = req.body;
    const result = await paymentService.handlePayTRCallback(callbackData);

    if (result.success) {
      logger.info(`PayTR callback processed successfully: ${result.orderId}`);
      res.status(200).send('OK');
    } else {
      logger.error(`PayTR callback processing failed: ${result.message}`);
      res.status(400).send('ERROR');
    }
  } catch (error) {
    logger.error('PayTR callback handling failed:', error);
    res.status(500).send('ERROR');
  }
};

/**
 * Get payment status
 * GET /api/payments/paytr/status/:orderId
 */
const getPaymentStatus = async (req, res, next) => {
  try {
    logger.verbose('Entering getPaymentStatus controller');
    
    const { orderId } = req.params;
    const paymentStatus = await paymentService.getPaymentStatus(orderId);

    logger.info(`Payment status retrieved for order: ${orderId}`);

    res.status(200).json({
      success: true,
      message: 'Ödeme durumu başarıyla getirildi',
      data: paymentStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get payment status failed:', error);
    next(error);
  }
};

/**
 * Initialize bank transfer payment
 * POST /api/payments/bank-transfer/init
 */
const initializeBankTransferPayment = async (req, res, next) => {
  try {
    logger.verbose('Entering initializeBankTransferPayment controller');
    
    const { orderId } = req.body;
    const transferData = await paymentService.initializeBankTransferPayment(orderId);

    logger.info(`Bank transfer payment initialized for order: ${orderId}`);

    res.status(200).json({
      success: true,
      message: 'Havale ödemesi başlatıldı',
      data: transferData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Bank transfer payment initialization failed:', error);
    next(error);
  }
};

/**
 * Handle bank transfer notification
 * POST /api/payments/bank-transfer/notify
 */
const handleBankTransferNotification = async (req, res, next) => {
  try {
    logger.verbose('Entering handleBankTransferNotification controller');
    
    const transferData = req.body;
    const result = await paymentService.handleBankTransferNotification(transferData);

    logger.info(`Bank transfer notification processed: ${result.orderId}`);

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        orderId: result.orderId,
        orderNumber: result.orderNumber
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Bank transfer notification handling failed:', error);
    next(error);
  }
};

/**
 * Upload bank transfer receipt
 * POST /api/payments/bank-transfer/upload
 */
const uploadBankTransferReceipt = async (req, res, next) => {
  try {
    logger.verbose('Entering uploadBankTransferReceipt controller');
    
    const { orderId } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'FILE_REQUIRED',
          message: 'Dekont dosyası gerekli'
        },
        timestamp: new Date().toISOString()
      });
    }

    const result = await paymentService.uploadBankTransferReceipt(orderId, file);

    logger.info(`Bank transfer receipt uploaded for order: ${orderId}`);

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        filename: result.filename,
        uploadTime: result.uploadTime
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Bank transfer receipt upload failed:', error);
    next(error);
  }
};

/**
 * Get bank accounts
 * GET /api/payments/bank-accounts
 */
const getBankAccounts = async (req, res, next) => {
  try {
    logger.verbose('Entering getBankAccounts controller');
    
    const bankAccounts = paymentService.getBankAccounts();

    logger.info('Bank accounts retrieved successfully');

    res.status(200).json({
      success: true,
      message: 'Banka hesapları başarıyla getirildi',
      data: {
        bankAccounts
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get bank accounts failed:', error);
    next(error);
  }
};

/**
 * Get available payment methods
 * GET /api/payments/methods
 */
const getPaymentMethods = async (req, res, next) => {
  try {
    logger.verbose('Entering getPaymentMethods controller');
    const methods = await paymentService.getAvailablePaymentMethods();
    res.status(200).json({
      success: true,
      methods: methods || []
    });
  } catch (error) {
    logger.error('Get payment methods failed:', error);
    res.status(400).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: error.message
      }
    });
  }
};

/**
 * Get payment status by order ID
 * GET /api/payments/:id/status
 */
const getPaymentStatusById = async (req, res, next) => {
  try {
    logger.verbose('Entering getPaymentStatusById controller');
    
    const { id } = req.params;
    const paymentStatus = await paymentService.getPaymentStatus(id);

    logger.info(`Payment status retrieved for order: ${id}`);

    res.status(200).json({
      success: true,
      message: 'Ödeme durumu başarıyla getirildi',
      data: paymentStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get payment status by ID failed:', error);
    next(error);
  }
};

/**
 * Process refund
 * POST /api/payments/:id/refund
 */
const processRefund = async (req, res, next) => {
  try {
    logger.verbose('Entering processRefund controller');
    
    const { id } = req.params;
    const refundData = req.body;

    const result = await paymentService.processRefund(id, refundData);

    logger.info(`Refund processed for order: ${id}`);

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        refundAmount: result.refundAmount,
        refundType: result.refundType,
        processTime: result.processTime
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Process refund failed:', error);
    next(error);
  }
};

module.exports = {
  initializePayTRPayment,
  handlePayTRCallback,
  getPaymentStatus,
  initializeBankTransferPayment,
  handleBankTransferNotification,
  uploadBankTransferReceipt: [upload.single('receipt'), uploadBankTransferReceipt],
  getBankAccounts,
  getPaymentMethods,
  getPaymentStatusById,
  processRefund
}; 