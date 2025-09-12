const logger = require('../logger/logger');
const { emailService } = require('../services/emailService');
const User = require('../models/User');
const Order = require('../models/Order');

/**
 * Test e-postası gönder
 * POST /api/email/test
 */
const sendTestEmail = async (req, res, next) => {
  try {
    const { email, type = 'order_confirmation' } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_EMAIL',
          message: 'E-posta adresi gereklidir'
        }
      });
    }

    // Test kullanıcısı oluştur
    const testUser = {
      _id: 'test-user-id',
      firstName: 'Test',
      lastName: 'Kullanıcı',
      email: email
    };

    // Test siparişi oluştur
    const testOrder = {
      _id: 'test-order-id',
      orderNumber: 'TEST-123456',
      items: [
        {
          name: 'Test Ürün 1',
          quantity: 2,
          price: 100,
          totalPrice: 200
        },
        {
          name: 'Test Ürün 2',
          quantity: 1,
          price: 150,
          totalPrice: 150
        }
      ],
      totalAmount: 350,
      status: 'paid',
      createdAt: new Date()
    };

    let result;
    switch (type) {
      case 'order_confirmation':
        result = await emailService.sendOrderConfirmationEmail(testUser, testOrder);
        break;
      case 'welcome':
        result = await emailService.sendWelcomeEmail(testUser);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_EMAIL_TYPE',
            message: 'Geçersiz e-posta tipi'
          }
        });
    }

    res.json({
      success: true,
      message: 'Test e-postası başarıyla gönderildi',
      data: {
        email: email,
        type: type,
        messageId: result.messageId || 'test-message-id'
      }
    });

  } catch (error) {
    logger.error('Test email sending failed:', error);
    next(error);
  }
};

/**
 * Sipariş onay e-postası gönder
 * POST /api/email/order-confirmation
 */
const sendOrderConfirmationEmail = async (req, res, next) => {
  try {
    const { orderId, userId } = req.body;

    if (!orderId || !userId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMETERS',
          message: 'Sipariş ID ve kullanıcı ID gereklidir'
        }
      });
    }

    const user = await User.findById(userId);
    const order = await Order.findById(orderId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Kullanıcı bulunamadı'
        }
      });
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Sipariş bulunamadı'
        }
      });
    }

    const result = await emailService.sendOrderConfirmationEmail(user, order);

    res.json({
      success: true,
      message: 'Sipariş onay e-postası başarıyla gönderildi',
      data: {
        orderNumber: order.orderNumber,
        userEmail: user.email,
        messageId: result.messageId || 'sent'
      }
    });

  } catch (error) {
    logger.error('Order confirmation email sending failed:', error);
    next(error);
  }
};

/**
 * E-posta ayarlarını kontrol et
 * GET /api/email/status
 */
const getEmailStatus = async (req, res, next) => {
  try {
    const emailConfig = {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      user: process.env.EMAIL_USER,
      from: process.env.EMAIL_FROM,
      testMode: process.env.EMAIL_TEST_MODE === 'true' || process.env.NODE_ENV === 'development'
    };

    res.json({
      success: true,
      message: 'E-posta ayarları getirildi',
      data: {
        config: emailConfig,
        status: emailConfig.testMode ? 'test_mode' : 'production_mode'
      }
    });

  } catch (error) {
    logger.error('Email status check failed:', error);
    next(error);
  }
};

module.exports = {
  sendTestEmail,
  sendOrderConfirmationEmail,
  getEmailStatus
}; 