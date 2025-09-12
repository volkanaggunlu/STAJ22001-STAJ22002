# E-Ticaret Sistemi Ödeme Entegrasyonu Dokümantasyonu

## İçindekiler
1. [Genel Bakış](#1-genel-bakış)
2. [Sistem Gereksinimleri](#2-sistem-gereksinimleri)
3. [Kurulum](#3-kurulum)
4. [Ödeme Akışı](#4-ödeme-akışı)
5. [API Endpoints](#5-api-endpoints)
6. [Konfigürasyon](#6-konfigürasyon)
7. [Entegrasyonlar](#7-entegrasyonlar)
8. [Güvenlik](#8-güvenlik)
9. [Test Ortamı](#9-test-ortamı)
10. [Hata Yönetimi](#10-hata-yönetimi)

## 1. Genel Bakış

Bu ödeme sistemi, e-ticaret uygulamaları için geliştirilmiş kapsamlı bir çözümdür. PayTR entegrasyonu ile güvenli ödeme işlemleri sağlar ve çeşitli iş süreçlerini otomatize eder.

### Desteklenen Ödeme Yöntemleri
- Kredi Kartı (`payment_type: "card"`)
- Havale/EFT (`payment_type: "eft"`)

### Temel Özellikler
- Otomatik stok yönetimi
- Kargo entegrasyonu
- Muhasebe sistemi entegrasyonu
- Email bildirimleri
- Analitik takibi

## 2. Sistem Gereksinimleri

### Backend
- Node.js (v14 veya üzeri)
- MongoDB (v4.4 veya üzeri)
- Express.js

### Gerekli NPM Paketleri
\`\`\`json
{
  "dependencies": {
    "mongoose": "^6.0.0",
    "express": "^4.17.1",
    "crypto": "^1.0.1",
    "axios": "^0.24.0",
    "form-data": "^4.0.0"
  }
}
\`\`\`

## 3. Kurulum

### 1. Paket Kurulumu
\`\`\`bash
npm install
\`\`\`

### 2. Çevre Değişkenleri
\`environment.js\` dosyasında aşağıdaki değişkenleri ayarlayın:

\`\`\`javascript
module.exports = {
  // Temel Ayarlar
  NODE_ENV: 'production',
  PORT: 8889,
  MONGO_URI: 'mongodb://localhost:27017/ecommerce',
  
  // PayTR Entegrasyonu
  MERCHANT_ID: 'your_merchant_id',
  MERCHANT_SALT: 'your_merchant_salt',
  MERCHANT_KEY: 'your_merchant_key',
  
  // Kargo Ayarları
  FREE_SHIPPING_THRESHOLD: 500,
  SHIPPING_COST: 30,
  
  // Vergi
  KDV: 18,
  
  // API URLs
  API_BASE_URL: 'https://your-api.com/api',
  BASE_URL: 'https://your-site.com',
  
  // Kargo Entegrasyonu
  BASIT_KARGO_TOKEN: 'your_token',
  
  // StockMount
  STOCKMOUNT_API_KEY: 'your_key',
  STOCKMOUNT_API_PASSWORD: 'your_password',
  
  // Email
  GOOGLE_PURCHASE_CONFIRMATION_EMAIL: 'your_email@gmail.com',
  GOOGLE_PURCHASE_CONFIRMATION_EMAIL_APP_KEY: 'your_key',
  
  // Klaviyo
  KLAVIYO_PRIVATE_API_KEY: 'your_key',
  
  // KolayBi
  KOLAYBI_API_KEY: 'your_key'
}
\`\`\`

## 4. Ödeme Akışı

### Sipariş Oluşturma Süreci

1. **Sepet Oluşturma**
\`\`\`javascript
// Cart Model
{
  products: [{
    product: ObjectId,
    quantity: Number
  }],
  user: ObjectId,
  coupon: String
}
\`\`\`

2. **Fiyat Hesaplama**
\`\`\`javascript
cartSchema.methods.getFinalPrice = async function() {
  const products = this.products;
  let totalPrice = products.reduce((total, product) => {
    return total + (product.product.price * product.quantity);
  }, 0);
  
  if (totalPrice <= FREE_SHIPPING_THRESHOLD) {
    totalPrice += SHIPPING_COST;
  }
  
  return totalPrice;
}
\`\`\`

3. **Sipariş Oluşturma**
\`\`\`javascript
// Order Model
{
  order_no: Number,
  cart: ObjectId,
  merchant_oid: String,
  status: String,
  payment_amount: Number,
  payment_type: String,
  email: String,
  customer_details: {
    name: String,
    surname: String,
    address: String,
    city: String,
    district: String,
    country: String,
    phone: String
  }
}
\`\`\`

## 5. API Endpoints

### Sipariş İşlemleri
- `POST /api/order` - Yeni sipariş oluşturma
- `GET /api/order/:merchant_oid` - Sipariş detayları
- `PUT /api/order/status` - Sipariş durumu güncelleme

### Ödeme Bildirimleri
- `POST /api/order/paytr-notification` - PayTR ödeme bildirimi
- `POST /api/order/cargo-notification` - Kargo durumu bildirimi

## 6. Konfigürasyon

### İndirim ve Promosyon Ayarları
\`\`\`javascript
{
  FREE_SHIPPING_THRESHOLD: 500,
  FREE_ROSE_THRESHOLD: 300,
  FREE_MYSTERY_GIFT_THRESHOLD: 800,
  DISCOUNT_MID_THRESHOLD: 600,
  DISCOUNT_LAST_THRESHOLD: 1000
}
\`\`\`

### Sipariş Durumları
- `pending`: Beklemede
- `failed`: Başarısız
- `paid`: Ödenmiş
- `inShipment`: Kargoda
- `delivered`: Teslim Edilmiş
- `cancelled`: İptal Edilmiş

## 7. Entegrasyonlar

### PayTR Entegrasyonu
\`\`\`javascript
const paytr_token = merchant_oid + MERCHANT_SALT + status + total_amount;
const token = crypto.createHmac('sha256', MERCHANT_KEY)
                   .update(paytr_token)
                   .digest('base64');
\`\`\`

### Kargo Entegrasyonu (BasitKargo)
\`\`\`javascript
const createBasitKargoShipment = async (merchant_oid) => {
  const result = await axios.post('https://basitkargo.com/api/v2/order', {
    content: {
      name: order.name,
      code: order.order_no,
      items: items
    },
    client: {
      name: order.name,
      phone: order.phone,
      address: order.address
    }
  }, {
    headers: {
      Authorization: `Bearer ${BASIT_KARGO_TOKEN}`
    }
  });
}
\`\`\`

### Muhasebe Entegrasyonu (KolayBi)
\`\`\`javascript
const createKolayBiOrder = async (order) => {
  const formData = new FormData();
  formData.append('order_date', order.createdAt);
  formData.append('serial_no', order.merchant_oid);
  // ... diğer alanlar
}
\`\`\`

### Email Bildirimleri
\`\`\`javascript
const sendPurchaseConfirmationEmail = async (order) => {
  const html = `
    <h1>Sayın ${order.name},</h1>
    <p>Siparişiniz onaylandı!</p>
    <div class="order-details">
      // ... sipariş detayları
    </div>
  `;
  // Email gönderme işlemi
}
\`\`\`

## 8. Güvenlik

### Hash Doğrulama
- PayTR'dan gelen bildirimlerde hash kontrolü
- Merchant ID doğrulama
- İşlem tutarı kontrolü

### Önlemler
1. Çift ödeme kontrolü
2. Test modu kontrolü
3. IP kısıtlamaları
4. Rate limiting

## 9. Test Ortamı

### Test Modu Aktivasyonu
\`\`\`javascript
{
  TEST_MODE: 1,  // Production için 0
  NODE_ENV: 'development'
}
\`\`\`

### Test Kartları
PayTR test kartları kullanılmalıdır (PayTR dokümantasyonuna bakınız).

## 10. Hata Yönetimi

### Hata Kodları
\`\`\`javascript
const errors = {
  PAYMENT_FAILED: 'Ödeme başarısız',
  INVALID_HASH: 'Geçersiz hash',
  STOCK_ERROR: 'Stok hatası',
  SHIPPING_ERROR: 'Kargo hatası'
};
\`\`\`

### Loglama
\`\`\`javascript
logger.error('Ödeme hatası:', error);
logger.info('Sipariş başarılı:', order.merchant_oid);
logger.debug('İşlem detayları:', details);
\`\`\`

### Hata İşleme
\`\`\`javascript
try {
  // İşlem
} catch (error) {
  // Hata yönetimi
  logger.error(error);
  notifyAdmin(error);
  return next(error);
}
\`\`\`

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için LICENSE dosyasına bakınız. 