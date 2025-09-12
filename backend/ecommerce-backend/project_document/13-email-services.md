# Email Services Modülü

## Genel Bakış

Email Services modülü, e-posta gönderimi, şablon yönetimi, işlemsel e-postalar, haber bülteni ve e-posta kampanyalarını yönetir. Nodemailer ve çeşitli e-posta servis sağlayıcıları entegrasyonu sunar.

## Dosya Yapısı

```
src/
├── services/
│   ├── emailService.js        # Ana e-posta servisi
│   ├── templateService.js     # E-posta şablon yönetimi
│   └── campaignService.js     # E-posta kampanya yönetimi
├── templates/
│   ├── auth/                  # Kimlik doğrulama e-postaları
│   ├── order/                 # Sipariş e-postaları
│   ├── newsletter/            # Haber bülteni şablonları
│   └── notification/          # Bildirim e-postaları
├── models/
│   ├── EmailTemplate.js      # E-posta şablon modeli
│   ├── EmailCampaign.js      # E-posta kampanya modeli
│   └── EmailSubscription.js  # E-posta abonelik modeli
└── utils/
    └── emailTemplates.js     # E-posta şablon yardımcıları
```

## Email Types

### 📧 E-posta Türleri
- **Transactional**: Hesap doğrulama, şifre sıfırlama
- **Order Related**: Sipariş onayı, kargo takibi, teslimat
- **Marketing**: Promosyonlar, ürün önerileri
- **Newsletter**: Haber bülteni, blog güncellemeleri
- **Notifications**: Stok bildirimi, fiyat düşüşü
- **Support**: Destek talebi, geri bildirim

## EmailSubscription Model Schema

```javascript
// models/EmailSubscription.js
const emailSubscriptionSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Geçersiz e-posta adresi'
    }
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true
  },
  subscriptions: {
    newsletter: { type: Boolean, default: true },
    promotions: { type: Boolean, default: true },
    orderUpdates: { type: Boolean, default: true },
    productRecommendations: { type: Boolean, default: false },
    priceAlerts: { type: Boolean, default: false },
    stockNotifications: { type: Boolean, default: false }
  },
  preferences: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'weekly'
    },
    categories: [String], // İlgilenilen kategoriler
    language: { type: String, default: 'tr' },
    timezone: { type: String, default: 'Europe/Istanbul' }
  },
  status: {
    type: String,
    enum: ['active', 'unsubscribed', 'bounced', 'complained'],
    default: 'active'
  },
  metadata: {
    source: String, // 'signup', 'checkout', 'popup', 'import'
    ipAddress: String,
    userAgent: String,
    referrer: String
  },
  unsubscribeToken: {
    type: String,
    unique: true,
    default: () => require('crypto').randomBytes(32).toString('hex')
  },
  lastEmailSent: Date,
  emailsSent: { type: Number, default: 0 },
  emailsOpened: { type: Number, default: 0 },
  emailsClicked: { type: Number, default: 0 },
  subscribedAt: {
    type: Date,
    default: Date.now
  },
  unsubscribedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
emailSubscriptionSchema.index({ email: 1 });
emailSubscriptionSchema.index({ status: 1 });
emailSubscriptionSchema.index({ 'subscriptions.newsletter': 1 });
emailSubscriptionSchema.index({ unsubscribeToken: 1 });
```

## EmailTemplate Model Schema

```javascript
// models/EmailTemplate.js
const emailTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: [
      'welcome', 'email_verification', 'password_reset',
      'order_confirmation', 'order_shipped', 'order_delivered',
      'newsletter', 'promotion', 'abandoned_cart',
      'product_recommendation', 'price_alert', 'stock_notification'
    ],
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  htmlContent: {
    type: String,
    required: true
  },
  textContent: String,
  variables: [{
    name: String,
    type: { type: String, enum: ['string', 'number', 'boolean', 'object'] },
    required: { type: Boolean, default: false },
    description: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  language: {
    type: String,
    default: 'tr'
  },
  category: String,
  tags: [String],
  statistics: {
    sent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    opened: { type: Number, default: 0 },
    clicked: { type: Number, default: 0 },
    bounced: { type: Number, default: 0 },
    complained: { type: Number, default: 0 }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
emailTemplateSchema.index({ type: 1, language: 1 });
emailTemplateSchema.index({ isActive: 1 });
```

## Email Service Implementation

```javascript
// services/emailService.js
const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');
const config = require('../config/environment');
const logger = require('../logger/logger');

class EmailService {
  constructor() {
    this.transporter = this.createTransporter();
    this.templates = new Map();
    this.loadTemplates();
  }

  createTransporter() {
    const transportConfig = {
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_PORT === 465,
      auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateLimit: 14, // 14 emails per second max
      connectionTimeout: 60000,
      greetingTimeout: 30000,
      socketTimeout: 60000
    };

    const transporter = nodemailer.createTransporter(transportConfig);

    // Verify connection
    transporter.verify((error, success) => {
      if (error) {
        logger.error('Email service connection failed:', error);
      } else {
        logger.info('Email service is ready');
      }
    });

    return transporter;
  }

  async loadTemplates() {
    try {
      const templateDir = path.join(__dirname, '../templates');
      const categories = await fs.readdir(templateDir);

      for (const category of categories) {
        const categoryPath = path.join(templateDir, category);
        const stat = await fs.stat(categoryPath);
        
        if (stat.isDirectory()) {
          const files = await fs.readdir(categoryPath);
          
          for (const file of files) {
            if (file.endsWith('.hbs') || file.endsWith('.html')) {
              const templateName = `${category}/${file.replace(/\.(hbs|html)$/, '')}`;
              const templatePath = path.join(categoryPath, file);
              const content = await fs.readFile(templatePath, 'utf-8');
              
              this.templates.set(templateName, handlebars.compile(content));
            }
          }
        }
      }
      
      logger.info(`Loaded ${this.templates.size} email templates`);
    } catch (error) {
      logger.error('Failed to load email templates:', error);
    }
  }

  async sendEmail(options) {
    try {
      const {
        to,
        subject,
        template,
        templateData = {},
        from = config.FROM_EMAIL,
        replyTo,
        attachments = [],
        priority = 'normal'
      } = options;

      let htmlContent, textContent;

      if (template) {
        // Template kullanarak içerik oluştur
        const compiledTemplate = this.templates.get(template);
        if (!compiledTemplate) {
          throw new Error(`Email template not found: ${template}`);
        }
        
        htmlContent = compiledTemplate(templateData);
        textContent = this.generateTextContent(htmlContent);
      } else {
        htmlContent = options.html;
        textContent = options.text;
      }

      const mailOptions = {
        from: `${config.FROM_NAME} <${from}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html: htmlContent,
        text: textContent,
        replyTo,
        attachments,
        priority,
        headers: {
          'X-Mailer': 'E-Commerce Platform',
          'X-Priority': priority === 'high' ? '1' : '3'
        }
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logger.info('Email sent successfully:', {
        messageId: result.messageId,
        to: mailOptions.to,
        subject
      });

      return {
        success: true,
        messageId: result.messageId,
        response: result.response
      };
    } catch (error) {
      logger.error('Email send failed:', error);
      throw new Error(`Email send failed: ${error.message}`);
    }
  }

  async sendBulkEmails(emails) {
    const results = [];
    const batchSize = 10;
    
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      const batchPromises = batch.map(email => 
        this.sendEmail(email).catch(error => ({
          success: false,
          error: error.message,
          email: email.to
        }))
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Rate limiting - wait between batches
      if (i + batchSize < emails.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }

  generateTextContent(html) {
    // Simple HTML to text conversion
    return html
      .replace(/<style[^>]*>.*?<\/style>/gis, '')
      .replace(/<script[^>]*>.*?<\/script>/gis, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Predefined email methods
  async sendWelcomeEmail(user) {
    return this.sendEmail({
      to: user.email,
      subject: 'Hoş Geldiniz! Hesabınız Oluşturuldu',
      template: 'auth/welcome',
      templateData: {
        userName: user.name,
        loginUrl: `${config.CLIENT_URL}/login`,
        supportEmail: config.FROM_EMAIL
      }
    });
  }

  async sendEmailVerification(user, verificationToken) {
    const verificationUrl = `${config.CLIENT_URL}/verify-email?token=${verificationToken}`;
    
    return this.sendEmail({
      to: user.email,
      subject: 'E-posta Adresinizi Doğrulayın',
      template: 'auth/email-verification',
      templateData: {
        userName: user.name,
        verificationUrl,
        expiresIn: '24 saat'
      }
    });
  }

  async sendPasswordReset(user, resetToken) {
    const resetUrl = `${config.CLIENT_URL}/reset-password?token=${resetToken}`;
    
    return this.sendEmail({
      to: user.email,
      subject: 'Şifre Sıfırlama Talebi',
      template: 'auth/password-reset',
      templateData: {
        userName: user.name,
        resetUrl,
        expiresIn: '1 saat'
      }
    });
  }

  async sendOrderConfirmation(order) {
    return this.sendEmail({
      to: order.user.email,
      subject: `Siparişiniz Onaylandı - ${order.orderNumber}`,
      template: 'order/confirmation',
      templateData: {
        userName: order.user.name,
        orderNumber: order.orderNumber,
        orderDate: order.createdAt,
        items: order.items,
        pricing: order.pricing,
        shippingAddress: order.shippingAddress,
        estimatedDelivery: order.shipping.estimatedDelivery,
        trackingUrl: `${config.CLIENT_URL}/orders/${order.orderNumber}/track`
      }
    });
  }

  async sendOrderShipped(order, trackingInfo) {
    return this.sendEmail({
      to: order.user.email,
      subject: `Siparişiniz Kargoya Verildi - ${order.orderNumber}`,
      template: 'order/shipped',
      templateData: {
        userName: order.user.name,
        orderNumber: order.orderNumber,
        trackingNumber: trackingInfo.trackingNumber,
        carrier: trackingInfo.carrier,
        estimatedDelivery: trackingInfo.estimatedDelivery,
        trackingUrl: `${config.CLIENT_URL}/orders/${order.orderNumber}/track`
      }
    });
  }

  async sendOrderDelivered(order) {
    return this.sendEmail({
      to: order.user.email,
      subject: `Siparişiniz Teslim Edildi - ${order.orderNumber}`,
      template: 'order/delivered',
      templateData: {
        userName: order.user.name,
        orderNumber: order.orderNumber,
        deliveryDate: order.shipping.deliveredAt,
        reviewUrl: `${config.CLIENT_URL}/orders/${order.orderNumber}/review`
      }
    });
  }

  async sendAbandonedCartReminder(user, cartItems) {
    return this.sendEmail({
      to: user.email,
      subject: 'Sepetinizde Ürünler Bekliyor',
      template: 'marketing/abandoned-cart',
      templateData: {
        userName: user.name,
        cartItems,
        cartUrl: `${config.CLIENT_URL}/cart`,
        checkoutUrl: `${config.CLIENT_URL}/checkout`
      }
    });
  }

  async sendPriceAlert(user, product, newPrice, oldPrice) {
    return this.sendEmail({
      to: user.email,
      subject: `Fiyat Düştü: ${product.name}`,
      template: 'notification/price-alert',
      templateData: {
        userName: user.name,
        productName: product.name,
        productImage: product.images[0]?.url,
        newPrice,
        oldPrice,
        discount: oldPrice - newPrice,
        discountPercentage: Math.round(((oldPrice - newPrice) / oldPrice) * 100),
        productUrl: `${config.CLIENT_URL}/products/${product.slug}`
      }
    });
  }

  async sendStockNotification(user, product) {
    return this.sendEmail({
      to: user.email,
      subject: `Tekrar Stokta: ${product.name}`,
      template: 'notification/stock-alert',
      templateData: {
        userName: user.name,
        productName: product.name,
        productImage: product.images[0]?.url,
        productPrice: product.discountPrice || product.price,
        productUrl: `${config.CLIENT_URL}/products/${product.slug}`
      }
    });
  }

  async sendNewsletter(subscribers, newsletterData) {
    const emails = subscribers.map(subscriber => ({
      to: subscriber.email,
      subject: newsletterData.subject,
      template: 'newsletter/weekly',
      templateData: {
        userName: subscriber.user?.name || 'Değerli Müşterimiz',
        ...newsletterData,
        unsubscribeUrl: `${config.CLIENT_URL}/unsubscribe?token=${subscriber.unsubscribeToken}`
      }
    }));

    return this.sendBulkEmails(emails);
  }
}

module.exports = new EmailService();
```

## Email Template Examples

### Welcome Email Template
```html
<!-- templates/auth/welcome.hbs -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hoş Geldiniz</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #007bff; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px 20px; }
        .button { 
            display: inline-block; 
            background: #007bff; 
            color: white; 
            padding: 12px 30px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0;
        }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>E-Commerce Mağazamıza Hoş Geldiniz!</h1>
        </div>
        
        <div class="content">
            <h2>Merhaba {{userName}}!</h2>
            
            <p>Hesabınız başarıyla oluşturuldu. Artık binlerce ürün arasından alışveriş yapabilir, özel indirimlerden yararlanabilir ve siparişlerinizi takip edebilirsiniz.</p>
            
            <h3>Neler Yapabilirsiniz?</h3>
            <ul>
                <li>✅ Geniş ürün kategorilerinde alışveriş</li>
                <li>✅ Özel indirimler ve kampanyalar</li>
                <li>✅ Hızlı ve güvenli ödeme</li>
                <li>✅ Siparişlerinizi takip etme</li>
                <li>✅ Ürün değerlendirmeleri</li>
            </ul>
            
            <div style="text-align: center;">
                <a href="{{loginUrl}}" class="button">Alışverişe Başla</a>
            </div>
            
            <p>Herhangi bir sorunuz varsa <a href="mailto:{{supportEmail}}">{{supportEmail}}</a> adresinden bize ulaşabilirsiniz.</p>
            
            <p>İyi alışverişler dileriz!</p>
        </div>
        
        <div class="footer">
            <p>Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıtlamayın.</p>
        </div>
    </div>
</body>
</html>
```

### Order Confirmation Template
```html
<!-- templates/order/confirmation.hbs -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sipariş Onayı</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #28a745; color: white; padding: 20px; text-align: center; }
        .order-details { background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .item { border-bottom: 1px solid #dee2e6; padding: 10px 0; }
        .item:last-child { border-bottom: none; }
        .total { background: #007bff; color: white; padding: 15px; text-align: center; font-size: 18px; font-weight: bold; }
        .button { 
            display: inline-block; 
            background: #007bff; 
            color: white; 
            padding: 12px 30px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Siparişiniz Onaylandı!</h1>
            <p>Sipariş No: <strong>{{orderNumber}}</strong></p>
        </div>
        
        <div class="content">
            <h2>Merhaba {{userName}}!</h2>
            
            <p>{{orderDate}} tarihinde verdiğiniz sipariş onaylanmış ve hazırlanmaya başlanmıştır.</p>
            
            <div class="order-details">
                <h3>Sipariş Detayları</h3>
                {{#each items}}
                <div class="item">
                    <strong>{{name}}</strong><br>
                    Miktar: {{quantity}} | Fiyat: ₺{{price}}
                    {{#if variant}}
                    <br><small>{{variant.name}}: {{variant.value}}</small>
                    {{/if}}
                </div>
                {{/each}}
                
                <div style="margin-top: 20px;">
                    <p><strong>Teslimat Adresi:</strong><br>
                    {{shippingAddress.firstName}} {{shippingAddress.lastName}}<br>
                    {{shippingAddress.address}}<br>
                    {{shippingAddress.city}}, {{shippingAddress.zipCode}}</p>
                    
                    <p><strong>Tahmini Teslimat:</strong> {{estimatedDelivery}}</p>
                </div>
            </div>
            
            <div class="total">
                Toplam: ₺{{pricing.total}}
            </div>
            
            <div style="text-align: center;">
                <a href="{{trackingUrl}}" class="button">Siparişimi Takip Et</a>
            </div>
            
            <p>Siparişinizle ilgili güncellemeleri e-posta ve SMS ile alacaksınız.</p>
        </div>
    </div>
</body>
</html>
```

## Email Subscription Management

### API Endpoints

#### POST `/api/email/subscribe`
E-posta aboneliği oluşturur.

**Request Body:**
```json
{
  "email": "user@example.com",
  "subscriptions": {
    "newsletter": true,
    "promotions": true,
    "orderUpdates": true
  },
  "preferences": {
    "frequency": "weekly",
    "categories": ["electronics", "clothing"]
  }
}
```

#### PUT `/api/email/preferences`
E-posta tercihlerini günceller.

#### GET `/api/email/unsubscribe/:token`
Abonelikten çıkar.

#### POST `/api/admin/email/campaign` (Admin)
E-posta kampanyası oluşturur.

**Request Body:**
```json
{
  "name": "Black Friday 2023",
  "subject": "🔥 Black Friday İndirimleri Başladı!",
  "template": "newsletter/promotion",
  "targetAudience": {
    "subscriptions": ["newsletter", "promotions"],
    "userGroups": ["active_customers"],
    "categories": ["electronics"]
  },
  "templateData": {
    "campaignTitle": "Black Friday İndirimleri",
    "products": [
      {
        "name": "iPhone 15 Pro",
        "price": 54999,
        "discountPrice": 49999,
        "image": "https://example.com/iphone15.jpg"
      }
    ]
  },
  "scheduledAt": "2023-11-24T00:00:00.000Z"
}
```

## Email Campaign Service

```javascript
// services/campaignService.js
const EmailSubscription = require('../models/EmailSubscription');
const EmailTemplate = require('../models/EmailTemplate');
const emailService = require('./emailService');

class CampaignService {
  async createCampaign(campaignData) {
    try {
      // Hedef kitleyi belirle
      const subscribers = await this.getTargetAudience(campaignData.targetAudience);
      
      if (subscribers.length === 0) {
        throw new Error('Hedef kitle bulunamadı');
      }

      // Campaign data hazırla
      const campaign = {
        ...campaignData,
        subscriberCount: subscribers.length,
        status: campaignData.scheduledAt ? 'scheduled' : 'draft',
        createdAt: new Date()
      };

      // Eğer hemen gönderilecekse
      if (!campaignData.scheduledAt) {
        const results = await this.sendCampaign(campaign, subscribers);
        campaign.status = 'sent';
        campaign.sentAt = new Date();
        campaign.results = results;
      }

      return campaign;
    } catch (error) {
      throw new Error(`Campaign creation failed: ${error.message}`);
    }
  }

  async getTargetAudience(criteria) {
    const query = { status: 'active' };

    // Abonelik türü filtresi
    if (criteria.subscriptions) {
      criteria.subscriptions.forEach(sub => {
        query[`subscriptions.${sub}`] = true;
      });
    }

    // Kullanıcı grubu filtresi
    if (criteria.userGroups) {
      // Bu kısım kullanıcı segmentasyonuna göre özelleştirilebilir
      if (criteria.userGroups.includes('new_users')) {
        query.subscribedAt = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
      }
    }

    // Kategori tercihi filtresi
    if (criteria.categories) {
      query['preferences.categories'] = { $in: criteria.categories };
    }

    return await EmailSubscription.find(query).populate('user');
  }

  async sendCampaign(campaign, subscribers) {
    const results = {
      total: subscribers.length,
      sent: 0,
      failed: 0,
      errors: []
    };

    // Batch olarak gönder
    const batchSize = 50;
    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);
      
      const emails = batch.map(subscriber => ({
        to: subscriber.email,
        subject: campaign.subject,
        template: campaign.template,
        templateData: {
          userName: subscriber.user?.name || 'Değerli Müşterimiz',
          ...campaign.templateData,
          unsubscribeUrl: `${process.env.CLIENT_URL}/unsubscribe?token=${subscriber.unsubscribeToken}`
        }
      }));

      try {
        const batchResults = await emailService.sendBulkEmails(emails);
        
        batchResults.forEach(result => {
          if (result.success) {
            results.sent++;
          } else {
            results.failed++;
            results.errors.push(result.error);
          }
        });

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        results.failed += batch.length;
        results.errors.push(error.message);
      }
    }

    return results;
  }

  async getUnsubscribePreferences(token) {
    const subscription = await EmailSubscription.findOne({ 
      unsubscribeToken: token,
      status: 'active'
    });

    if (!subscription) {
      throw new Error('Geçersiz abonelik token\'ı');
    }

    return subscription;
  }

  async updateUnsubscribePreferences(token, preferences) {
    const subscription = await EmailSubscription.findOne({ 
      unsubscribeToken: token 
    });

    if (!subscription) {
      throw new Error('Geçersiz abonelik token\'ı');
    }

    // Tüm abonelikler kapatıldıysa durumu güncelle
    const hasAnySubscription = Object.values(preferences.subscriptions).some(Boolean);
    
    if (!hasAnySubscription) {
      subscription.status = 'unsubscribed';
      subscription.unsubscribedAt = new Date();
    } else {
      subscription.status = 'active';
      subscription.unsubscribedAt = undefined;
    }

    subscription.subscriptions = preferences.subscriptions;
    subscription.preferences = { ...subscription.preferences, ...preferences.preferences };
    subscription.updatedAt = new Date();

    await subscription.save();
    return subscription;
  }

  async getCampaignAnalytics(campaignId, dateRange) {
    // Bu kısım gerçek bir campaign tracking sistemi gerektirir
    // Şimdilik basit istatistikler döndürüyoruz
    
    return {
      sent: 1250,
      delivered: 1187,
      opened: 456,
      clicked: 89,
      bounced: 23,
      complained: 5,
      unsubscribed: 12,
      openRate: 38.4,
      clickRate: 19.5,
      unsubscribeRate: 0.96
    };
  }
}

module.exports = new CampaignService();
```

## Frontend Integration

### Newsletter Subscription Hook
```javascript
import { useState } from 'react';

export const useEmailSubscription = () => {
  const [loading, setLoading] = useState(false);

  const subscribe = async (subscriptionData) => {
    setLoading(true);
    try {
      const response = await api.post('/email/subscribe', subscriptionData);
      return response.data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (preferences) => {
    setLoading(true);
    try {
      const response = await api.put('/email/preferences', preferences);
      return response.data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async (token, preferences) => {
    try {
      const response = await api.post(`/email/unsubscribe/${token}`, preferences);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  return {
    loading,
    subscribe,
    updatePreferences,
    unsubscribe
  };
};
```

### Newsletter Subscription Component
```javascript
import React, { useState } from 'react';
import { useEmailSubscription } from '../hooks/useEmailSubscription';

const NewsletterSubscription = () => {
  const { subscribe, loading } = useEmailSubscription();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) return;

    try {
      await subscribe({
        email,
        subscriptions: {
          newsletter: true,
          promotions: true,
          orderUpdates: false
        },
        preferences: {
          frequency: 'weekly'
        }
      });
      
      setSubscribed(true);
      setEmail('');
    } catch (error) {
      alert('Abonelik işlemi başarısız: ' + error.message);
    }
  };

  if (subscribed) {
    return (
      <div className="newsletter-success">
        <h3>✅ Başarılı!</h3>
        <p>E-posta listemize kaydoldunuz. En güncel kampanya ve duyurularımızdan haberdar olacaksınız.</p>
      </div>
    );
  }

  return (
    <div className="newsletter-subscription">
      <h3>📧 Kampanyalarımızdan Haberdar Olun</h3>
      <p>En güncel indirimler ve yeniliklerden ilk siz haberdar olun!</p>
      
      <form onSubmit={handleSubmit} className="subscription-form">
        <div className="input-group">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-posta adresinizi girin"
            required
            disabled={loading}
          />
          <button 
            type="submit" 
            disabled={loading || !email}
            className="subscribe-btn"
          >
            {loading ? 'Kaydediliyor...' : 'Abone Ol'}
          </button>
        </div>
      </form>
      
      <p className="privacy-note">
        <small>
          Abone olarak <a href="/privacy">Gizlilik Politikamızı</a> kabul etmiş olursunuz. 
          İstediğiniz zaman abonelikten çıkabilirsiniz.
        </small>
      </p>
    </div>
  );
};
```

## Email Analytics

### Email Analytics Service
```javascript
// services/emailAnalytics.js
class EmailAnalytics {
  async getEmailStats(dateRange) {
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);

    // Bu veriler gerçek email tracking sisteminden gelmelidir
    return {
      sent: 15420,
      delivered: 14876,
      opened: 7234,
      clicked: 1456,
      bounced: 234,
      complained: 12,
      unsubscribed: 89,
      
      rates: {
        deliveryRate: 96.47,
        openRate: 48.64,
        clickRate: 20.13,
        bounceRate: 1.57,
        complaintRate: 0.08,
        unsubscribeRate: 0.60
      },
      
      topPerformingEmails: [
        {
          template: 'Black Friday Campaign',
          sent: 2500,
          openRate: 65.2,
          clickRate: 25.8
        }
      ]
    };
  }

  async getSubscriberGrowth(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await EmailSubscription.aggregate([
      {
        $match: {
          subscribedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$subscribedAt' },
            month: { $month: '$subscribedAt' },
            day: { $dayOfMonth: '$subscribedAt' }
          },
          newSubscribers: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);
  }
}
```

## Test Examples

```javascript
describe('Email Services', () => {
  test('should send welcome email', async () => {
    const user = {
      email: 'test@example.com',
      name: 'Test User'
    };

    const result = await emailService.sendWelcomeEmail(user);
    
    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
  });

  test('should create email subscription', async () => {
    const subscriptionData = {
      email: 'subscriber@example.com',
      subscriptions: {
        newsletter: true,
        promotions: false
      }
    };

    const response = await request(app)
      .post('/api/email/subscribe')
      .send(subscriptionData);

    expect(response.status).toBe(201);
    expect(response.body.data.subscription.email).toBe(subscriptionData.email);
  });

  test('should unsubscribe user', async () => {
    const subscription = await EmailSubscription.findOne();
    
    const response = await request(app)
      .get(`/api/email/unsubscribe/${subscription.unsubscribeToken}`);

    expect(response.status).toBe(200);
    
    const updatedSubscription = await EmailSubscription.findById(subscription._id);
    expect(updatedSubscription.status).toBe('unsubscribed');
  });
});
```

---

**Son Güncelleme**: `{new Date().toLocaleDateString('tr-TR')}` 