const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const logger = require('../logger/logger');

/**
 * Email Types
 */
const EMAIL_TYPES = {
  WELCOME: 'welcome',
  EMAIL_VERIFICATION: 'email_verification',
  PASSWORD_RESET: 'password_reset',
  ORDER_CONFIRMATION: 'order_confirmation',
  SHIPPING_NOTIFICATION: 'shipping_notification',
  PAYMENT_CONFIRMATION: 'payment_confirmation'
};

/**
 * Email Service Class
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * Initialize Email Transporter
   */
  initializeTransporter() {
    try {
      // Test modunda e-posta gönderimi simüle et
      if (process.env.NODE_ENV === 'development' || process.env.EMAIL_TEST_MODE === 'true') {
        this.transporter = {
          sendMail: async (options) => {
            logger.info('TEST MODE: Email would be sent:', {
              to: options.to,
              subject: options.subject,
              html: options.html ? 'HTML content present' : 'No HTML',
              text: options.text ? 'Text content present' : 'No text'
            });
            return { messageId: 'test-message-id' };
          }
        };
        logger.info('Email service initialized in TEST MODE');
      } else {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      logger.info('Email service initialized successfully');
      }
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
      throw new Error('Email service initialization failed');
    }
  }

  /**
   * Send Email
   * @param {Object} options - Email options
   * @returns {Promise} Email send result
   */
  async sendEmail(options) {
    try {
      const { to, subject, html, text, attachments } = options;

      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to,
        subject,
        html,
        text,
        attachments
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${to}: ${subject}`);
      return result;
    } catch (error) {
      logger.error('Failed to send email:', error);
      throw new Error('Email sending failed');
    }
  }

  /**
   * Send Welcome Email
   * @param {Object} user - User object
   * @returns {Promise} Email send result
   */
  async sendWelcomeEmail(user) {
    try {
      const subject = 'ElektroTech\'e Hoş Geldiniz! 🎉';
      const html = this.generateWelcomeEmailHTML(user);
      const text = this.generateWelcomeEmailText(user);

      return await this.sendEmail({
        to: user.email,
        subject,
        html,
        text
      });
    } catch (error) {
      logger.error('Failed to send welcome email:', error);
      throw error;
    }
  }

  /**
   * Send Email Verification
   * @param {Object} user - User object
   * @param {string} verificationToken - Verification token
   * @returns {Promise} Email send result
   */
  async sendEmailVerification(user, verificationToken) {
    try {
      const subject = 'Email Adresinizi Doğrulayın - ElektroTech';
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
      const html = this.generateVerificationEmailHTML(user, verificationUrl);
      const text = this.generateVerificationEmailText(user, verificationUrl);

      return await this.sendEmail({
        to: user.email,
        subject,
        html,
        text
      });
    } catch (error) {
      logger.error('Failed to send email verification:', error);
      throw error;
    }
  }

  /**
   * Send Password Reset Email
   * @param {Object} user - User object
   * @param {string} resetToken - Password reset token
   * @returns {Promise} Email send result
   */
  async sendPasswordResetEmail(user, resetToken) {
    try {
      const subject = 'Şifre Sıfırlama - ElektroTech';
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      const html = this.generatePasswordResetEmailHTML(user, resetUrl);
      const text = this.generatePasswordResetEmailText(user, resetUrl);

      return await this.sendEmail({
        to: user.email,
        subject,
        html,
        text
      });
    } catch (error) {
      logger.error('Failed to send password reset email:', error);
      throw error;
    }
  }

  /**
   * Send Order Confirmation Email
   * @param {Object} user - User object
   * @param {Object} order - Order object
   * @returns {Promise} Email send result
   */
  async sendOrderConfirmationEmail(user, order) {
    try {
      const subject = `Sipariş Onayı - #${order.orderNumber} - ElektroTech`;
      const html = this.generateOrderConfirmationEmailHTML(user, order);
      const text = this.generateOrderConfirmationEmailText(user, order);

      return await this.sendEmail({
        to: user.email,
        subject,
        html,
        text
      });
    } catch (error) {
      logger.error('Failed to send order confirmation email:', error);
      throw error;
    }
  }

  /**
   * Generate Welcome Email HTML
   * @param {Object} user - User object
   * @returns {string} HTML content
   */
  generateWelcomeEmailHTML(user) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Hoş Geldiniz - ElektroTech</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; background: #007bff; color: white; padding: 20px; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .btn { display: inline-block; padding: 12px 30px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>ElektroTech'e Hoş Geldiniz!</h1>
          </div>
          <div class="content">
            <h2>Merhaba ${user.firstName}!</h2>
            <p>ElektroTech ailesine katıldığınız için teşekkür ederiz. Hesabınız başarıyla oluşturuldu.</p>
            <p>Elektronik dünyasının en kaliteli ürünleri artık parmaklarınızın ucunda!</p>
            <p>
              <a href="${process.env.FRONTEND_URL}/products" class="btn">Alışverişe Başla</a>
            </p>
            <p>İyi alışverişler dileriz!</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 ElektroTech. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate Welcome Email Text
   * @param {Object} user - User object
   * @returns {string} Text content
   */
  generateWelcomeEmailText(user) {
    return `
      Merhaba ${user.firstName},
      
      ElektroTech ailesine katıldığınız için teşekkür ederiz!
      
      Hesabınız başarıyla oluşturuldu ve artık alışverişe başlayabilirsiniz.
      
      Elektronik dünyasının en kaliteli ürünleri için: ${process.env.FRONTEND_URL}/products
      
      İyi alışverişler dileriz!
      
      ElektroTech Ekibi
    `;
  }

  /**
   * Generate Email Verification HTML
   * @param {Object} user - User object
   * @param {string} verificationUrl - Verification URL
   * @returns {string} HTML content
   */
  generateVerificationEmailHTML(user, verificationUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Doğrulama - ElektroTech</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; background: #28a745; color: white; padding: 20px; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .btn { display: inline-block; padding: 12px 30px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Email Adresinizi Doğrulayın</h1>
          </div>
          <div class="content">
            <h2>Merhaba ${user.firstName}!</h2>
            <p>ElektroTech hesabınızı aktifleştirmek için email adresinizi doğrulamanız gerekmektedir.</p>
            <p>Aşağıdaki butona tıklayarak email adresinizi doğrulayabilirsiniz:</p>
            <p style="text-align: center;">
              <a href="${verificationUrl}" class="btn">Email Adresimi Doğrula</a>
            </p>
            <div class="warning">
              <strong>Önemli:</strong> Bu link 24 saat süreyle geçerlidir. Süre dolduğunda yeni bir doğrulama linki talep edebilirsiniz.
            </div>
            <p>Eğer bu işlemi siz yapmadıysanız, bu emaili dikkate almayınız.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 ElektroTech. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate Email Verification Text
   * @param {Object} user - User object
   * @param {string} verificationUrl - Verification URL
   * @returns {string} Text content
   */
  generateVerificationEmailText(user, verificationUrl) {
    return `
      Merhaba ${user.firstName},
      
      ElektroTech hesabınızı aktifleştirmek için email adresinizi doğrulamanız gerekmektedir.
      
      Aşağıdaki linki tarayıcınızda açarak email adresinizi doğrulayabilirsiniz:
      ${verificationUrl}
      
      Bu link 24 saat süreyle geçerlidir.
      
      Eğer bu işlemi siz yapmadıysanız, bu emaili dikkate almayınız.
      
      ElektroTech Ekibi
    `;
  }

  /**
   * Generate Password Reset Email HTML
   * @param {Object} user - User object
   * @param {string} resetUrl - Reset URL
   * @returns {string} HTML content
   */
  generatePasswordResetEmailHTML(user, resetUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Şifre Sıfırlama - ElektroTech</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; background: #dc3545; color: white; padding: 20px; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .btn { display: inline-block; padding: 12px 30px; background: #dc3545; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .warning { background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Şifre Sıfırlama</h1>
          </div>
          <div class="content">
            <h2>Merhaba ${user.firstName}!</h2>
            <p>ElektroTech hesabınız için şifre sıfırlama talebinde bulundunuz.</p>
            <p>Aşağıdaki butona tıklayarak yeni şifrenizi belirleyebilirsiniz:</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="btn">Şifremi Sıfırla</a>
            </p>
            <div class="warning">
              <strong>Önemli:</strong> Bu link 1 saat süreyle geçerlidir. Güvenlik nedeniyle link kısa sürelidir.
            </div>
            <p>Eğer bu işlemi siz yapmadıysanız, bu emaili dikkate almayınız ve şifrenizi değiştirmeyin.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 ElektroTech. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate Password Reset Email Text
   * @param {Object} user - User object
   * @param {string} resetUrl - Reset URL
   * @returns {string} Text content
   */
  generatePasswordResetEmailText(user, resetUrl) {
    return `
      Merhaba ${user.firstName},
      
      ElektroTech hesabınız için şifre sıfırlama talebinde bulundunuz.
      
      Aşağıdaki linki tarayıcınızda açarak yeni şifrenizi belirleyebilirsiniz:
      ${resetUrl}
      
      Bu link 1 saat süreyle geçerlidir.
      
      Eğer bu işlemi siz yapmadıysanız, bu emaili dikkate almayınız.
      
      ElektroTech Ekibi
    `;
  }

  /**
   * Generate Order Confirmation Email HTML
   * @param {Object} user - User object
   * @param {Object} order - Order object
   * @returns {string} HTML content
   */
  generateOrderConfirmationEmailHTML(user, order) {
    const itemsHTML = order.items.map(item => `
      <tr>
        <td>${item.name}</td>
        <td>${item.quantity}</td>
        <td>${item.price} TL</td>
        <td>${item.totalPrice} TL</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sipariş Onayı - ElektroTech</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; background: #007bff; color: white; padding: 20px; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .order-info { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
          .order-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          .order-table th, .order-table td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          .order-table th { background: #f8f9fa; font-weight: bold; }
          .total { font-size: 18px; font-weight: bold; color: #007bff; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Sipariş Onayı</h1>
          </div>
          <div class="content">
            <h2>Merhaba ${user.firstName}!</h2>
            <p>Siparişiniz başarıyla alındı ve işleme konuldu.</p>
            
            <div class="order-info">
              <h3>Sipariş Detayları</h3>
              <p><strong>Sipariş No:</strong> #${order.orderNumber}</p>
              <p><strong>Sipariş Tarihi:</strong> ${new Date(order.createdAt).toLocaleDateString('tr-TR')}</p>
              <p><strong>Sipariş Durumu:</strong> ${order.status}</p>
              
              <table class="order-table">
                <thead>
                  <tr>
                    <th>Ürün</th>
                    <th>Adet</th>
                    <th>Fiyat</th>
                    <th>Toplam</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHTML}
                </tbody>
              </table>
              
              <p class="total">Toplam: ${order.totalAmount} TL</p>
            </div>
            
            <p>Siparişinizin durumunu hesabınızdan takip edebilirsiniz.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 ElektroTech. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate Order Confirmation Email Text
   * @param {Object} user - User object
   * @param {Object} order - Order object
   * @returns {string} Text content
   */
  generateOrderConfirmationEmailText(user, order) {
    const itemsText = order.items.map(item => 
      `${item.name} - ${item.quantity} adet - ${item.price} TL - Toplam: ${item.totalPrice} TL`
    ).join('\n');

    return `
      Merhaba ${user.firstName},
      
      Siparişiniz başarıyla alındı ve işleme konuldu.
      
      Sipariş Detayları:
      Sipariş No: #${order.orderNumber}
      Sipariş Tarihi: ${new Date(order.createdAt).toLocaleDateString('tr-TR')}
      Sipariş Durumu: ${order.status}
      
      Ürünler:
      ${itemsText}
      
      Toplam: ${order.totalAmount} TL
      
      Siparişinizin durumunu hesabınızdan takip edebilirsiniz.
      
      ElektroTech Ekibi
    `;
  }
}

// Create and export singleton instance
const emailService = new EmailService();

module.exports = {
  emailService,
  EMAIL_TYPES
}; 