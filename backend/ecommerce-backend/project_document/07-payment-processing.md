# Payment Processing Modülü

## Genel Bakış

Payment Processing modülü, ödeme işlemlerini yönetir. PayTR entegrasyonu, kredi kartı ödemeleri, havale/EFT, kapıda ödeme gibi ödeme yöntemlerini destekler.

## Dosya Yapısı

```
src/
├── controllers/
│   ├── paymentController.js        # Ödeme controller
│   └── adminPaymentController.js   # Admin ödeme yönetimi
├── routes/
│   └── paymentRoutes.js           # Ödeme routes
├── services/
│   └── paymentService.js          # Ödeme business logic
├── config/
│   └── paytr.js                   # PayTR konfigürasyonu
└── validation/
    └── paymentValidation.js       # Ödeme validation schemas
```

## Payment Methods

### 🏦 Desteklenen Ödeme Yöntemleri
- **Kredi Kartı**: Visa, MasterCard, American Express
- **Banka Kartı**: Axess, Bonus, CardFinans, Maximum
- **Dijital Cüzdan**: PayPal, Google Pay, Apple Pay
- **Banka Transferi**: Havale/EFT
- **Kapıda Ödeme**: Nakit veya kart ile

## PayTR Entegrasyonu

### PayTR Konfigürasyonu
```javascript
// config/paytr.js
module.exports = {
  merchantId: process.env.PAYTR_MERCHANT_ID,
  merchantKey: process.env.PAYTR_MERCHANT_KEY,
  merchantSalt: process.env.PAYTR_MERCHANT_SALT,
  baseUrl: process.env.NODE_ENV === 'production' 
    ? 'https://www.paytr.com' 
    : 'https://www.paytr.com/odeme/guvenli',
  successUrl: `${process.env.CLIENT_URL}/payment/success`,
  failUrl: `${process.env.CLIENT_URL}/payment/failed`,
  callbackUrl: `${process.env.API_URL}/api/payments/callback`,
  timeout: 30, // dakika
  currency: 'TL',
  testMode: process.env.NODE_ENV !== 'production'
};
```

## API Endpoints

### POST `/api/payments/initiate`
Ödeme işlemini başlatır.

**Request Body:**
```json
{
  "orderId": "64f8a123456789abcdef",
  "paymentMethod": "credit_card",
  "amount": 1299.99,
  "currency": "TRY",
  "billingAddress": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+90 555 123 45 67",
    "address": "Atatürk Caddesi No:123",
    "city": "İstanbul",
    "country": "Turkey",
    "zipCode": "34000"
  },
  "cardDetails": {
    "cardNumber": "4355084355084358",
    "expiryMonth": "12",
    "expiryYear": "2025",
    "cvv": "000",
    "cardHolderName": "JOHN DOE"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentId": "payment_123456789",
    "status": "pending",
    "paymentUrl": "https://www.paytr.com/odeme/guvenli/abc123",
    "redirectRequired": true,
    "token": "payment_token_here",
    "expiresAt": "2023-10-01T11:00:00.000Z"
  }
}
```

### POST `/api/payments/callback`
PayTR callback endpoint'i (webhook).

**Request Body (PayTR):**
```json
{
  "merchant_oid": "ORDER_123",
  "status": "success",
  "total_amount": "129999",
  "hash": "paytr_hash_here",
  "failed_reason_code": null,
  "failed_reason_msg": null,
  "test_mode": "0",
  "payment_type": "card",
  "currency": "TL",
  "payment_amount": "129999"
}
```

### GET `/api/payments/:paymentId/status`
Ödeme durumunu sorgular.

**Response:**
```json
{
  "success": true,
  "data": {
    "payment": {
      "id": "payment_123456789",
      "orderId": "64f8a123456789abcdef",
      "status": "completed",
      "amount": 1299.99,
      "currency": "TRY",
      "paymentMethod": "credit_card",
      "transactionId": "TXN_987654321",
      "completedAt": "2023-10-01T10:30:00.000Z",
      "receipt": {
        "url": "https://example.com/receipts/payment_123456789.pdf",
        "number": "FT-2023-001234"
      }
    }
  }
}
```

### POST `/api/payments/:paymentId/refund` (Admin)
Ödeme iadesi yapar.

**Request Body:**
```json
{
  "amount": 649.99,
  "reason": "Ürün iadesi",
  "refundType": "partial"
}
```

**Response:**
```json
{
  "success": true,
  "message": "İade başarıyla işlendi",
  "data": {
    "refund": {
      "id": "refund_123456789",
      "paymentId": "payment_123456789",
      "amount": 649.99,
      "status": "processed",
      "reason": "Ürün iadesi",
      "processedAt": "2023-10-01T14:00:00.000Z"
    }
  }
}
```

### GET `/api/payments/methods`
Kullanılabilir ödeme yöntemlerini listeler.

**Response:**
```json
{
  "success": true,
  "data": {
    "methods": [
      {
        "id": "credit_card",
        "name": "Kredi Kartı",
        "description": "Visa, MasterCard, American Express",
        "icon": "credit-card",
        "enabled": true,
        "fees": {
          "percentage": 2.5,
          "fixed": 0
        }
      },
      {
        "id": "bank_transfer",
        "name": "Havale/EFT",
        "description": "Banka hesabına havale",
        "icon": "bank",
        "enabled": true,
        "fees": {
          "percentage": 0,
          "fixed": 5
        }
      },
      {
        "id": "cash_on_delivery",
        "name": "Kapıda Ödeme",
        "description": "Teslimat sırasında ödeme",
        "icon": "cash",
        "enabled": true,
        "fees": {
          "percentage": 0,
          "fixed": 9.99
        }
      }
    ]
  }
}
```

## Payment Service Fonksiyonları

### `initiatePayment(orderData, paymentData)`
Ödeme işlemini başlatır.

### `processPayment(paymentId, paymentDetails)`
Ödeme işlemini gerçekleştirir.

### `verifyPayment(paymentId, hash)`
PayTR callback'ini doğrular.

### `refundPayment(paymentId, amount, reason)`
Ödeme iadesi yapar.

### `generatePaymentHash(data)`
PayTR için güvenlik hash'i oluşturur.

### `validateCardDetails(cardData)`
Kredi kartı bilgilerini doğrular.

## PayTR Integration Service

```javascript
// services/paymentService.js
const crypto = require('crypto');
const axios = require('axios');
const paytrConfig = require('../config/paytr');

class PayTRService {
  // Ödeme isteği oluştur
  async createPaymentRequest(orderData) {
    const {
      orderId,
      amount,
      currency,
      userEmail,
      userName,
      userAddress,
      userPhone,
      basketItems
    } = orderData;

    // PayTR için gerekli parametreler
    const paymentData = {
      merchant_id: paytrConfig.merchantId,
      user_ip: orderData.userIp,
      merchant_oid: orderId,
      email: userEmail,
      payment_amount: Math.round(amount * 100), // Kuruş cinsinden
      currency: paytrConfig.currency,
      test_mode: paytrConfig.testMode ? '1' : '0',
      non_3d: '0', // 3D Secure aktif
      merchant_ok_url: paytrConfig.successUrl,
      merchant_fail_url: paytrConfig.failUrl,
      user_name: userName,
      user_address: userAddress,
      user_phone: userPhone,
      user_basket: this.formatBasket(basketItems),
      debug_on: paytrConfig.testMode ? '1' : '0',
      client_lang: 'tr',
      timeout_limit: paytrConfig.timeout
    };

    // Hash oluştur
    paymentData.paytr_token = this.generateHash(paymentData);

    try {
      const response = await axios.post(
        'https://www.paytr.com/odeme/api/get-token',
        new URLSearchParams(paymentData),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      if (response.data.status === 'success') {
        return {
          success: true,
          token: response.data.token,
          paymentUrl: `https://www.paytr.com/odeme/guvenli/${response.data.token}`
        };
      } else {
        throw new Error(response.data.reason);
      }
    } catch (error) {
      throw new Error(`PayTR ödeme oluşturulamadı: ${error.message}`);
    }
  }

  // PayTR callback doğrula
  verifyCallback(postData) {
    const {
      merchant_oid,
      status,
      total_amount,
      hash
    } = postData;

    // Hash doğrula
    const hashString = `${merchant_oid}${paytrConfig.merchantSalt}${status}${total_amount}`;
    const expectedHash = crypto
      .createHmac('sha256', paytrConfig.merchantKey)
      .update(hashString)
      .digest('base64');

    return hash === expectedHash;
  }

  // PayTR hash oluştur
  generateHash(data) {
    const hashString = [
      data.merchant_id,
      data.user_ip,
      data.merchant_oid,
      data.email,
      data.payment_amount,
      data.user_basket,
      data.non_3d,
      paytrConfig.merchantSalt
    ].join('');

    return crypto
      .createHmac('sha256', paytrConfig.merchantKey)
      .update(hashString)
      .digest('base64');
  }

  // Sepet formatla
  formatBasket(items) {
    return items.map(item => [
      item.name.substring(0, 50), // Maksimum 50 karakter
      Math.round(item.price * 100), // Kuruş
      item.quantity
    ]);
  }

  // İade işlemi
  async processRefund(paymentId, amount, reason) {
    const refundData = {
      merchant_id: paytrConfig.merchantId,
      merchant_oid: paymentId,
      return_amount: Math.round(amount * 100),
      return_reason: reason
    };

    // İade hash'i oluştur
    const hashString = `${refundData.merchant_id}${refundData.merchant_oid}${refundData.return_amount}${paytrConfig.merchantSalt}`;
    refundData.hash = crypto
      .createHmac('sha256', paytrConfig.merchantKey)
      .update(hashString)
      .digest('base64');

    try {
      const response = await axios.post(
        'https://www.paytr.com/odeme/iade',
        new URLSearchParams(refundData),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      return {
        success: response.data.status === 'success',
        message: response.data.err_msg || 'İade başarılı'
      };
    } catch (error) {
      throw new Error(`İade işlemi başarısız: ${error.message}`);
    }
  }
}
```

## Validation Schemas

### Payment Initiation Validation
```javascript
const initiatePaymentSchema = Joi.object({
  orderId: Joi.string().hex().length(24).required(),
  paymentMethod: Joi.string().valid(
    'credit_card', 
    'bank_transfer', 
    'cash_on_delivery'
  ).required(),
  amount: Joi.number().min(1).max(999999).required(),
  currency: Joi.string().valid('TRY', 'USD', 'EUR').default('TRY'),
  billingAddress: Joi.object({
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^\+90\s\d{3}\s\d{3}\s\d{2}\s\d{2}$/).required(),
    address: Joi.string().min(10).max(200).required(),
    city: Joi.string().min(2).max(50).required(),
    country: Joi.string().min(2).max(50).required(),
    zipCode: Joi.string().pattern(/^\d{5}$/).required()
  }).required(),
  cardDetails: Joi.when('paymentMethod', {
    is: 'credit_card',
    then: Joi.object({
      cardNumber: Joi.string().creditCard().required(),
      expiryMonth: Joi.string().pattern(/^(0[1-9]|1[0-2])$/).required(),
      expiryYear: Joi.string().pattern(/^20\d{2}$/).required(),
      cvv: Joi.string().pattern(/^\d{3,4}$/).required(),
      cardHolderName: Joi.string().min(3).max(50).required()
    }).required(),
    otherwise: Joi.forbidden()
  })
});
```

### Refund Validation
```javascript
const refundSchema = Joi.object({
  amount: Joi.number().min(0.01).required(),
  reason: Joi.string().min(5).max(200).required(),
  refundType: Joi.string().valid('full', 'partial').required()
});
```

## Frontend Entegrasyonu

### Payment Hook (React)
```javascript
import { useState } from 'react';

export const usePayment = () => {
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);

  const initiatePayment = async (paymentData) => {
    setLoading(true);
    try {
      const response = await api.post('/payments/initiate', paymentData);
      
      if (response.data.data.redirectRequired) {
        // PayTR ödeme sayfasına yönlendir
        window.location.href = response.data.data.paymentUrl;
      }
      
      return response.data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async (paymentId) => {
    try {
      const response = await api.get(`/payments/${paymentId}/status`);
      setPaymentStatus(response.data.data.payment.status);
      return response.data.data.payment;
    } catch (error) {
      throw error;
    }
  };

  return {
    loading,
    paymentStatus,
    initiatePayment,
    checkPaymentStatus
  };
};
```

### Credit Card Form Component
```javascript
import React, { useState } from 'react';
import { usePayment } from '../hooks/usePayment';

const CreditCardForm = ({ orderId, amount, onSuccess, onError }) => {
  const { initiatePayment, loading } = usePayment();
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardHolderName: '',
    billingAddress: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      country: 'Turkey',
      zipCode: ''
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const paymentData = {
        orderId,
        paymentMethod: 'credit_card',
        amount,
        currency: 'TRY',
        cardDetails: {
          cardNumber: formData.cardNumber.replace(/\s/g, ''),
          expiryMonth: formData.expiryMonth,
          expiryYear: formData.expiryYear,
          cvv: formData.cvv,
          cardHolderName: formData.cardHolderName.toUpperCase()
        },
        billingAddress: formData.billingAddress
      };

      const result = await initiatePayment(paymentData);
      onSuccess(result);
    } catch (error) {
      onError(error.response?.data?.error?.message || 'Ödeme başlatılamadı');
    }
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="credit-card-form">
      <h3>Kredi Kartı Bilgileri</h3>
      
      <div className="form-group">
        <label>Kart Numarası</label>
        <input
          type="text"
          value={formData.cardNumber}
          onChange={(e) => setFormData({
            ...formData,
            cardNumber: formatCardNumber(e.target.value)
          })}
          placeholder="1234 5678 9012 3456"
          maxLength="19"
          required
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Son Kullanma</label>
          <div className="expiry-inputs">
            <select
              value={formData.expiryMonth}
              onChange={(e) => setFormData({
                ...formData,
                expiryMonth: e.target.value
              })}
              required
            >
              <option value="">Ay</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                  {String(i + 1).padStart(2, '0')}
                </option>
              ))}
            </select>
            <select
              value={formData.expiryYear}
              onChange={(e) => setFormData({
                ...formData,
                expiryYear: e.target.value
              })}
              required
            >
              <option value="">Yıl</option>
              {Array.from({ length: 10 }, (_, i) => (
                <option key={2024 + i} value={String(2024 + i)}>
                  {2024 + i}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>CVV</label>
          <input
            type="text"
            value={formData.cvv}
            onChange={(e) => setFormData({
              ...formData,
              cvv: e.target.value.replace(/\D/g, '').substring(0, 4)
            })}
            placeholder="123"
            maxLength="4"
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label>Kart Sahibi</label>
        <input
          type="text"
          value={formData.cardHolderName}
          onChange={(e) => setFormData({
            ...formData,
            cardHolderName: e.target.value.toUpperCase()
          })}
          placeholder="JOHN DOE"
          required
        />
      </div>

      <div className="payment-summary">
        <div className="amount">
          Ödenecek Tutar: ₺{amount.toLocaleString('tr-TR')}
        </div>
      </div>

      <button 
        type="submit" 
        className="pay-button"
        disabled={loading}
      >
        {loading ? 'İşleniyor...' : 'Ödemeyi Tamamla'}
      </button>
    </form>
  );
};
```

## Security Measures

### 🔒 Güvenlik Önlemleri
1. **PCI DSS Compliance**: Kart bilgileri asla saklanmaz
2. **3D Secure**: Tüm kart ödemelerinde 3D Secure zorunlu
3. **SSL/TLS**: Tüm veri transferi şifreli
4. **Hash Verification**: PayTR callback'leri hash ile doğrulanır
5. **Rate Limiting**: Ödeme endpoint'leri rate limit'li
6. **Fraud Detection**: Şüpheli işlem tespiti

### Error Handling

```javascript
// Ödeme hataları
const PAYMENT_ERRORS = {
  INVALID_CARD: 'Geçersiz kart bilgileri',
  INSUFFICIENT_FUNDS: 'Yetersiz bakiye',
  EXPIRED_CARD: 'Kartın süresi dolmuş',
  BLOCKED_CARD: 'Kart bloke edilmiş',
  INVALID_CVV: 'Geçersiz CVV',
  PAYMENT_DECLINED: 'Ödeme reddedildi',
  CONNECTION_ERROR: 'Bağlantı hatası',
  TIMEOUT: 'İşlem zaman aşımı'
};
```

## Test Örnekleri

```javascript
describe('Payment Processing', () => {
  test('should initiate payment successfully', async () => {
    const paymentData = {
      orderId: orderId,
      paymentMethod: 'credit_card',
      amount: 100,
      cardDetails: testCardData,
      billingAddress: testBillingData
    };

    const response = await request(app)
      .post('/api/payments/initiate')
      .send(paymentData);

    expect(response.status).toBe(200);
    expect(response.body.data.paymentUrl).toBeDefined();
  });

  test('should verify PayTR callback', async () => {
    const callbackData = {
      merchant_oid: 'ORDER_123',
      status: 'success',
      total_amount: '10000',
      hash: 'valid_hash_here'
    };

    const response = await request(app)
      .post('/api/payments/callback')
      .send(callbackData);

    expect(response.status).toBe(200);
  });
});
```

---

**Son Güncelleme**: `{new Date().toLocaleDateString('tr-TR')}` 