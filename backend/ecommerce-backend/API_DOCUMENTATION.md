# 🚀 ElektroTech E-Ticaret API Dokümantasyonu

## 📋 Proje Genel Yapısı

### 🏗️ Mimari Tasarım
- **Modüler MVC Architecture** 
- **RESTful API Design**
- **JWT Authentication**
- **MongoDB ile NoSQL Database**
- **Express.js Framework**
- **Güvenlik odaklı yaklaşım**

### 📁 Klasör Yapısı
```
api/
├── config/
│   ├── database.js           # MongoDB bağlantısı
│   ├── jwt.js               # JWT konfigürasyonu
│   ├── paytr.js             # PayTR ayarları
│   └── basitkargo.js        # BasitKargo ayarları
├── controllers/
│   ├── authController.js    # Kimlik doğrulama (max 200 satır)
│   ├── userController.js    # Kullanıcı işlemleri (max 200 satır)
│   ├── productController.js # Ürün işlemleri (max 200 satır)
│   ├── cartController.js    # Sepet işlemleri (max 200 satır)
│   ├── orderController.js   # Sipariş işlemleri (max 200 satır)
│   ├── paymentController.js # Ödeme işlemleri (max 200 satır)
│   ├── reviewController.js  # Değerlendirme işlemleri (max 200 satır)
│   ├── categoryController.js# Kategori işlemleri (max 200 satır)
│   ├── couponController.js  # Kupon işlemleri (max 200 satır)
│   └── adminController.js   # Admin işlemleri (max 200 satır)
├── middleware/
│   ├── auth.js              # Kimlik doğrulama
│   ├── validation.js        # Veri doğrulama
│   ├── rateLimiter.js       # Rate limiting
│   ├── errorHandler.js      # Hata yönetimi
│   └── logger.js            # Log middleware
├── models/                  # MongoDB şemaları (7 adet mevcut)
│   ├── User.js              # ✅ Tamamlandı
│   ├── Product.js           # ✅ Tamamlandı
│   ├── Order.js             # ✅ Tamamlandı
│   ├── Cart.js              # ✅ Tamamlandı
│   ├── Review.js            # ✅ Tamamlandı
│   ├── Category.js          # ✅ Tamamlandı
│   └── Coupon.js            # ✅ Tamamlandı
├── routes/
│   ├── authRoutes.js        # Authentication routes
│   ├── userRoutes.js        # User management routes
│   ├── productRoutes.js     # Product routes
│   ├── cartRoutes.js        # Cart routes
│   ├── orderRoutes.js       # Order routes
│   ├── paymentRoutes.js     # Payment routes
│   ├── reviewRoutes.js      # Review routes
│   ├── categoryRoutes.js    # Category routes
│   ├── couponRoutes.js      # Coupon routes
│   └── adminRoutes.js       # Admin routes
├── services/
│   ├── authService.js       # Kimlik doğrulama servisi
│   ├── emailService.js      # Email gönderimi
│   ├── paymentService.js    # PayTR & Havale servisi
│   ├── shippingService.js   # BasitKargo servisi
│   ├── notificationService.js# Bildirim servisi
│   └── analyticsService.js  # Analytics servisi
├── utils/
│   ├── helpers.js           # Yardımcı fonksiyonlar
│   ├── constants.js         # Sabitler
│   ├── validators.js        # Özel validatorlar
│   └── encryption.js        # Şifreleme fonksiyonları
├── validations/
│   ├── authValidation.js    # Authentication validations
│   ├── userValidation.js    # User validations
│   ├── productValidation.js # Product validations
│   └── orderValidation.js   # Order validations
├── package.json
└── server.js               # Ana server dosyası
```

## 🔧 Ana Servisler ve Endpoint'ler

### 1. 🔐 Authentication Service (Kimlik Doğrulama)
```javascript
// Endpoint'ler:
POST   /api/auth/register          # Kullanıcı kaydı
POST   /api/auth/login             # Kullanıcı girişi
POST   /api/auth/logout            # Kullanıcı çıkışı
POST   /api/auth/refresh-token     # Token yenileme
POST   /api/auth/forgot-password   # Şifre sıfırlama talebi
POST   /api/auth/reset-password    # Şifre güncelleme
POST   /api/auth/verify-email      # Email doğrulama
POST   /api/auth/resend-verification # Email doğrulama tekrar gönder

// Özellikler:
- JWT token bazlı kimlik doğrulama
- Refresh token sistemi
- Account lockout (5 yanlış deneme)
- Email doğrulama sistemi
- Güvenli şifre sıfırlama
```

### 2. 👤 User Management Service (Kullanıcı Yönetimi)
```javascript
// Endpoint'ler:
GET    /api/users/profile          # Kullanıcı profil bilgileri
PUT    /api/users/profile          # Profil güncelleme
POST   /api/users/change-password  # Şifre değiştirme
GET    /api/users/addresses        # Kullanıcı adresleri
POST   /api/users/addresses        # Yeni adres ekleme
PUT    /api/users/addresses/:id    # Adres güncelleme
DELETE /api/users/addresses/:id    # Adres silme
PUT    /api/users/addresses/:id/default # Varsayılan adres yapma
GET    /api/users/favorites        # Favori ürünler
POST   /api/users/favorites/:productId # Favoriye ürün ekleme
DELETE /api/users/favorites/:productId # Favoriden ürün çıkarma
GET    /api/users/orders           # Kullanıcı sipariş geçmişi
GET    /api/users/statistics       # Kullanıcı istatistikleri

// Özellikler:
- Profil yönetimi (ad, soyad, telefon, doğum tarihi)
- Çoklu adres yönetimi
- Favori ürün sistemi
- Sipariş geçmişi
- Kullanıcı istatistikleri
```

### 3. 🛍️ Product Service (Ürün Yönetimi)
```javascript
// Endpoint'ler:
GET    /api/products               # Ürün listesi (filtreleme, sıralama, arama)
GET    /api/products/:id           # Ürün detay sayfası
GET    /api/products/slug/:slug    # Slug ile ürün detay
GET    /api/products/featured      # Öne çıkan ürünler
GET    /api/products/bestsellers   # Çok satan ürünler
GET    /api/products/new           # Yeni ürünler
GET    /api/products/bundles       # Paket/Set ürünler
GET    /api/products/discounted    # İndirimli ürünler
GET    /api/products/search        # Ürün arama (gelişmiş)
GET    /api/products/category/:slug # Kategori ürünleri
GET    /api/products/brand/:brand  # Marka ürünleri
GET    /api/products/:id/reviews   # Ürün yorumları
GET    /api/products/:id/related   # İlgili ürünler
POST   /api/products/:id/view      # Ürün görüntülenme sayısı artır

// Query Parameters:
?page=1&limit=20&sort=price&order=asc&category=Elektronik&brand=Arduino
&minPrice=100&maxPrice=1000&inStock=true&search=arduino&type=product

// Özellikler:
- Gelişmiş filtreleme ve arama
- Kategori, marka, fiyat filtreleri
- Stok durumu kontrolü
- Ürün türü (tekil/paket) filtreleme
- Sıralama seçenekleri
- Sayfalama (pagination)
- İlgili ürün önerileri
```

### 4. 🛒 Cart Service (Sepet Yönetimi)
```javascript
// Endpoint'ler:
GET    /api/cart                   # Sepet görüntüleme
POST   /api/cart/add               # Sepete ürün ekleme
PUT    /api/cart/update/:productId # Ürün miktarı güncelleme
DELETE /api/cart/remove/:productId # Sepetten ürün çıkarma
DELETE /api/cart/clear             # Sepeti temizleme
POST   /api/cart/merge             # Misafir sepeti kullanıcı sepeti ile birleştirme
GET    /api/cart/summary           # Sepet özeti (toplam, indirim vs.)
POST   /api/cart/validate          # Sepet doğrulama (stok kontrolü)

// Request Body Examples:
// Add to cart:
{
  "productId": "648a1b2c3d4e5f6789012345",
  "quantity": 2
}

// Update quantity:
{
  "quantity": 3
}

// Özellikler:
- Kullanıcı ve misafir sepeti desteği
- Stok kontrolü
- Otomatik toplam hesaplama
- Sepet birleştirme (misafir → kullanıcı)
- İndirim hesaplamaları
- Sepet doğrulama
```

### 5. 📦 Order Service (Sipariş Yönetimi)
```javascript
// Endpoint'ler:
POST   /api/orders                 # Yeni sipariş oluşturma
GET    /api/orders                 # Kullanıcı siparişleri
GET    /api/orders/:id             # Sipariş detayı
PUT    /api/orders/:id/cancel      # Sipariş iptal etme
POST   /api/orders/:id/return      # İade talebi oluşturma
GET    /api/orders/:id/tracking    # Kargo takip bilgileri
GET    /api/orders/:id/invoice     # Fatura/makbuz
POST   /api/orders/:id/review      # Sipariş sonrası değerlendirme

// Order Status Flow:
pending → confirmed → processing → shipped → delivered
                ↓
           cancelled / returned

// Request Body (Create Order):
{
  "shippingAddressId": "648a1b2c3d4e5f6789012345",
  "billingAddressId": "648a1b2c3d4e5f6789012346",
  "paymentMethod": "paytr", // or "bank-transfer"
  "shippingMethod": "standard", // or "express", "same-day"
  "couponCode": "INDIRIM20",
  "notes": {
    "customer": "Kapıcıya teslim edilebilir"
  },
  "isGift": false,
  "giftMessage": ""
}

// Özellikler:
- Sipariş oluşturma ve yönetimi
- Sipariş durumu takibi
- İptal ve iade işlemleri
- Kargo entegrasyonu
- Fatura oluşturma
- Email bildirimleri
```

### 6. 💳 Payment Service (Ödeme Sistemi)
```javascript
// PayTR Entegrasyonu:
POST   /api/payments/paytr/init    # PayTR ödeme başlatma
POST   /api/payments/paytr/callback # PayTR geri dönüş URL'i
GET    /api/payments/paytr/status/:orderId # Ödeme durumu

// Havale/EFT Sistemi:
POST   /api/payments/bank-transfer/notify # Havale bildirimi
POST   /api/payments/bank-transfer/upload # Dekont yükleme
GET    /api/payments/bank-accounts  # Banka hesap bilgileri

// Genel:
GET    /api/payments/methods       # Ödeme yöntemleri
GET    /api/payments/:id/status    # Ödeme durumu sorgulama
POST   /api/payments/:id/refund    # İade işlemi

// PayTR Init Request:
{
  "orderId": "648a1b2c3d4e5f6789012345",
  "amount": 299.99,
  "installment": 1, // taksit sayısı
  "currency": "TRY"
}

// Bank Transfer Notify:
{
  "orderId": "648a1b2c3d4e5f6789012345",
  "amount": 299.99,
  "bankAccount": "Garanti BBVA",
  "transactionDate": "2024-01-15T10:30:00Z",
  "reference": "TRF123456789",
  "receipt": "base64_encoded_image" // dekont görseli
}

// Özellikler:
- PayTR kredi kartı ödemeleri
- 3D Secure desteği
- Taksit seçenekleri
- Havale/EFT bildirimi
- Dekont yükleme sistemi
- Otomatik ödeme doğrulama
```

### 7. 🚚 Shipping Service (Kargo Sistemi - BasitKargo)
```javascript
// Endpoint'ler:
POST   /api/shipping/create        # Kargo gönderi oluşturma
GET    /api/shipping/track/:code   # Kargo takip sorgulama
GET    /api/shipping/rates         # Kargo ücret hesaplama
PUT    /api/shipping/update/:id    # Kargo bilgisi güncelleme
GET    /api/shipping/carriers      # Kargo firmaları listesi
POST   /api/shipping/label/:id     # Kargo etiketi oluşturma

// Create Shipping Request:
{
  "orderId": "648a1b2c3d4e5f6789012345",
  "carrier": "aras", // aras, yurtici, mng, ptt
  "service": "standard", // standard, express, same-day
  "recipient": {
    "name": "Ahmet Yılmaz",
    "phone": "+905551234567",
    "address": "Kadıköy Mah. Bağdat Cad. No:123 Daire:5",
    "city": "İstanbul",
    "district": "Kadıköy",
    "postalCode": "34710"
  },
  "package": {
    "weight": 0.5, // kg
    "dimensions": {
      "length": 20, // cm
      "width": 15,
      "height": 10
    }
  }
}

// Özellikler:
- Çoklu kargo firması desteği
- Otomatik kargo etiketi oluşturma
- Gerçek zamanlı takip
- Kargo ücreti hesaplama
- SMS/Email bildirimleri
- Teslimat durumu güncellemeleri
```

### 8. ⭐ Review Service (Değerlendirme Sistemi)
```javascript
// Endpoint'ler:
GET    /api/reviews/product/:id    # Ürün yorumları
POST   /api/reviews                # Yeni yorum ekleme
PUT    /api/reviews/:id            # Yorum güncelleme
DELETE /api/reviews/:id            # Yorum silme
POST   /api/reviews/:id/helpful    # Yararlı olarak işaretleme
DELETE /api/reviews/:id/helpful    # Yararlı işaretini kaldırma
POST   /api/reviews/:id/report     # Yorum şikayet etme
POST   /api/reviews/:id/response   # Yoruma yanıt verme
GET    /api/reviews/user/:id       # Kullanıcı yorumları
GET    /api/reviews/pending        # Onay bekleyen yorumlar (admin)

// Create Review Request:
{
  "productId": "648a1b2c3d4e5f6789012345",
  "orderId": "648a1b2c3d4e5f6789012346",
  "rating": 5, // 1-5
  "title": "Mükemmel ürün!",
  "comment": "Arduino projelerim için aldım, çok memnun kaldım...",
  "pros": ["Hızlı kargo", "Kaliteli malzeme", "Uygun fiyat"],
  "cons": ["Ambalaj biraz zayıf"],
  "images": [
    {
      "url": "https://example.com/review1.jpg",
      "caption": "Ürün fotoğrafı"
    }
  ]
}

// Özellikler:
- Sadece satın alan kullanıcılar yorum yapabilir
- 5 yıldızlı değerlendirme sistemi
- Artı/eksi yönler
- Fotoğraf yükleme
- Yararlı bulma sistemi
- Şikayet sistemi
- Admin onay süreci
```

### 9. 🎫 Coupon Service (Kupon Sistemi)
```javascript
// Endpoint'ler:
POST   /api/coupons/validate       # Kupon kodu doğrulama
POST   /api/coupons/apply          # Kupon uygulama
DELETE /api/coupons/remove         # Kupon kaldırma
GET    /api/coupons/user           # Kullanıcıya özel kuponlar
GET    /api/coupons/public         # Herkese açık kuponlar

// Validate Coupon Request:
{
  "code": "INDIRIM20",
  "orderAmount": 299.99,
  "userId": "648a1b2c3d4e5f6789012345"
}

// Validate Response:
{
  "valid": true,
  "discount": {
    "type": "percentage", // or "fixed"
    "value": 20,
    "amount": 59.99,
    "maxAmount": 100
  },
  "coupon": {
    "id": "648a1b2c3d4e5f6789012347",
    "code": "INDIRIM20",
    "name": "20% İndirim Kuponu",
    "description": "Tüm ürünlerde geçerli"
  }
}

// Özellikler:
- Yüzdelik ve sabit tutar indirimleri
- Minimum sipariş tutarı kontrolü
- Maksimum indirim limiti
- Kullanım limitleri
- Tarih sınırlamaları
- Kategori/ürün/marka hedeflemesi
- Kullanıcı grup hedeflemesi
```

### 10. 📂 Category Service (Kategori Yönetimi)
```javascript
// Endpoint'ler:
GET    /api/categories             # Tüm kategoriler (düz liste)
GET    /api/categories/tree        # Kategori ağacı (hiyerarşik)
GET    /api/categories/:slug       # Kategori detayı
GET    /api/categories/:slug/products # Kategori ürünleri
GET    /api/categories/featured    # Öne çıkan kategoriler
POST   /api/categories/:id/view    # Kategori görüntülenme artır

// Category Tree Response:
[
  {
    "id": "648a1b2c3d4e5f6789012345",
    "name": "Elektronik Komponentler",
    "slug": "elektronik-komponentler",
    "image": "https://example.com/elektronik.jpg",
    "productCount": 250,
    "children": [
      {
        "id": "648a1b2c3d4e5f6789012346",
        "name": "Mikrodenetleyiciler",
        "slug": "mikrodenetleyiciler",
        "productCount": 45,
        "children": []
      }
    ]
  }
]

// Özellikler:
- Çok seviyeli kategori yapısı
- SEO dostu URL'ler (slug)
- Kategori istatistikleri
- Özel filtreler
- Görsel ve ikon desteği
```

### 11. 👨‍💼 Admin Service (Admin Paneli)
```javascript
// Dashboard:
GET    /api/admin/dashboard        # Dashboard verileri ve istatistikler

// Order Management:
GET    /api/admin/orders           # Tüm siparişler (filtreleme, arama)
GET    /api/admin/orders/:id       # Sipariş detayı
PUT    /api/admin/orders/:id/status # Sipariş durumu güncelleme
POST   /api/admin/orders/:id/tracking # Kargo takip numarası ekleme
PUT    /api/admin/orders/:id/notes # Admin notu ekleme

// Product Management:
GET    /api/admin/products         # Tüm ürünler
POST   /api/admin/products         # Yeni ürün ekleme
PUT    /api/admin/products/:id     # Ürün güncelleme
DELETE /api/admin/products/:id     # Ürün silme
PUT    /api/admin/products/:id/stock # Stok güncelleme
PUT    /api/admin/products/:id/status # Ürün durumu güncelleme

// User Management:
GET    /api/admin/users            # Kullanıcı listesi
GET    /api/admin/users/:id        # Kullanıcı detayı
PUT    /api/admin/users/:id/status # Kullanıcı durumu (aktif/pasif)
GET    /api/admin/users/:id/orders # Kullanıcı sipariş geçmişi

// Review Management:
GET    /api/admin/reviews/pending  # Onay bekleyen yorumlar
PUT    /api/admin/reviews/:id/approve # Yorum onaylama
PUT    /api/admin/reviews/:id/reject # Yorum reddetme

// Coupon Management:
GET    /api/admin/coupons          # Kupon listesi
POST   /api/admin/coupons          # Yeni kupon oluşturma
PUT    /api/admin/coupons/:id      # Kupon güncelleme
DELETE /api/admin/coupons/:id      # Kupon silme

// Analytics:
GET    /api/admin/analytics/sales  # Satış analizi
GET    /api/admin/analytics/products # Ürün analizi
GET    /api/admin/analytics/users  # Kullanıcı analizi

// Özellikler:
- Comprehensive dashboard
- Order lifecycle management
- Inventory management
- User administration
- Content moderation
- Coupon management
- Real-time analytics
```

## 🔒 Güvenlik Özellikleri

### Authentication & Authorization
```javascript
// JWT Token Structure:
{
  "userId": "648a1b2c3d4e5f6789012345",
  "email": "user@example.com",
  "role": "user", // or "admin"
  "iat": 1640995200,
  "exp": 1640995200
}

// Security Features:
- JWT token authentication
- Refresh token rotation
- Role-based access control (RBAC)
- Account lockout after 5 failed attempts
- Password strength validation
- Email verification required
- Rate limiting per IP/user
- CORS configuration
- Input sanitization
- XSS protection
```

### API Security Middleware
```javascript
// Rate Limiting:
- 100 requests per 15 minutes per IP
- 10 login attempts per hour per IP
- 5 password reset attempts per hour per email

// Request Validation:
- All inputs validated with Joi
- SQL injection prevention
- NoSQL injection prevention
- File upload restrictions
- Request size limits
```

## 💳 Ödeme Sistemi Detayları

### PayTR Configuration
```javascript
const paytrConfig = {
  merchant_id: process.env.PAYTR_MERCHANT_ID,
  merchant_key: process.env.PAYTR_MERCHANT_KEY,
  merchant_salt: process.env.PAYTR_MERCHANT_SALT,
  test_mode: process.env.NODE_ENV !== 'production',
  currency: 'TRY',
  timeout_limit: 30, // minutes
  max_installment: 12
};

// Payment Flow:
1. Frontend calls /api/payments/paytr/init
2. Backend creates PayTR iframe token
3. User completes payment on PayTR
4. PayTR sends callback to /api/payments/paytr/callback
5. Backend verifies payment and updates order
6. User redirected to success/error page
```

### Bank Transfer System
```javascript
// Bank Account Information:
const bankAccounts = [
  {
    bankName: "Garanti BBVA",
    accountNumber: "1234567890",
    iban: "TR123456789012345678901234",
    accountHolder: "ElektroTech Ticaret A.Ş."
  },
  {
    bankName: "İş Bankası",
    accountNumber: "0987654321",
    iban: "TR987654321098765432109876",
    accountHolder: "ElektroTech Ticaret A.Ş."
  }
];

// Transfer Notification Flow:
1. User initiates bank transfer
2. System provides bank account details
3. User makes transfer and uploads receipt
4. Admin reviews and approves payment
5. Order status updated automatically
6. User receives confirmation email
```

## 🚚 BasitKargo Entegrasyonu

### Configuration
```javascript
const basitkargoConfig = {
  api_key: process.env.BASITKARGO_API_KEY,
  username: process.env.BASITKARGO_USERNAME,
  password: process.env.BASITKARGO_PASSWORD,
  test_mode: process.env.NODE_ENV !== 'production',
  webhook_url: `${process.env.API_URL}/api/shipping/webhook`
};

// Supported Carriers:
- Aras Kargo
- Yurtiçi Kargo
- MNG Kargo
- PTT Kargo
```

### Shipping Flow
```javascript
// Automatic Shipping Process:
1. Order confirmed and payment received
2. Create shipping label via BasitKargo API
3. Print shipping label (admin panel)
4. Update order with tracking number
5. Send tracking info to customer
6. Monitor delivery status via webhooks
7. Update order status automatically
8. Send delivery confirmation to customer
```

## 📊 Database İlişkileri ve Örnekler

### User -> Order İlişkisi
```javascript
// User has many Orders
const userOrders = await User.findById(userId).populate('orders');

// Order belongs to User
const orderWithUser = await Order.findById(orderId).populate('userId');
```

### Product -> Review İlişkisi
```javascript
// Product has many Reviews
const productReviews = await Product.findById(productId).populate('reviews');

// Review belongs to Product and User
const reviewWithDetails = await Review.findById(reviewId)
  .populate('userId')
  .populate('productId');
```

### Order -> Payment İlişkisi
```javascript
// Order has payment information embedded
const orderWithPayment = await Order.findById(orderId);
console.log(orderWithPayment.payment.status); // 'completed'
```

## 🛠️ Teknoloji Stack

### Core Dependencies
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.5.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.0",
    "joi": "^17.9.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "express-rate-limit": "^6.8.1",
    "multer": "^1.4.5",
    "nodemailer": "^6.9.3",
    "moment": "^2.29.4",
    "uuid": "^9.0.0",
    "crypto": "^1.0.1",
    "axios": "^1.4.0"
  }
}
```

### Development Dependencies
```json
{
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.6.1",
    "supertest": "^6.3.3",
    "eslint": "^8.45.0",
    "prettier": "^3.0.0"
  }
}
```

## 📝 Kod Yazım Standartları

### File Structure Standards
```javascript
// Controller Example (max 200 lines):
const SomeController = {
  // Each method max 30-40 lines
  methodOne: async (req, res, next) => {
    try {
      // Implementation
    } catch (error) {
      next(error);
    }
  }
};

// Service Example (max 200 lines):
class SomeService {
  // Each method focused on single responsibility
  async methodOne() {
    // Implementation
  }
}
```

### Error Handling Standards
```javascript
// Custom Error Classes:
class ApiError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
  }
}

// Error Response Format:
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Geçersiz veri girişi",
    "details": [
      {
        "field": "email",
        "message": "Geçerli bir email adresi giriniz"
      }
    ]
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Success Response Standards
```javascript
// Success Response Format:
{
  "success": true,
  "data": {
    // Actual data
  },
  "message": "İşlem başarıyla tamamlandı",
  "pagination": { // If applicable
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  },
  "meta": { // Additional metadata if needed
    "processingTime": "245ms",
    "version": "1.0.0"
  }
}
```

## 🧪 Testing Strategy

### Test Categories
```javascript
// Unit Tests (70% coverage target):
- Individual function testing
- Service method testing
- Utility function testing

// Integration Tests (20% coverage target):
- API endpoint testing
- Database operation testing
- External service integration testing

// E2E Tests (10% coverage target):
- Complete user workflows
- Payment process testing
- Order lifecycle testing
```

### Test File Structure
```
tests/
├── unit/
│   ├── services/
│   ├── utils/
│   └── controllers/
├── integration/
│   ├── api/
│   └── database/
└── e2e/
    ├── auth.test.js
    ├── orders.test.js
    └── payments.test.js
```

## 🚀 Deployment & Environment

### Environment Variables
```env
# Database
MONGODB_URI=mongodb://localhost:27017/elektrotech
MONGODB_TEST_URI=mongodb://localhost:27017/elektrotech_test

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_EXPIRE=1h
JWT_REFRESH_EXPIRE=7d

# PayTR
PAYTR_MERCHANT_ID=your-paytr-merchant-id
PAYTR_MERCHANT_KEY=your-paytr-merchant-key
PAYTR_MERCHANT_SALT=your-paytr-merchant-salt

# BasitKargo
BASITKARGO_API_KEY=your-basitkargo-api-key
BASITKARGO_USERNAME=your-username
BASITKARGO_PASSWORD=your-password

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# App
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3001

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880 # 5MB
```

### Production Deployment
```yaml
# docker-compose.yml example:
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    depends_on:
      - mongodb
      - redis
  
  mongodb:
    image: mongo:5.0
    volumes:
      - mongodb_data:/data/db
  
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  mongodb_data:
  redis_data:
```

## 📈 Performance Optimization

### Database Optimization
- Proper indexing on frequently queried fields
- Query optimization with aggregation pipelines
- Connection pooling
- Data pagination for large datasets

### API Optimization
- Response compression (gzip)
- Caching frequently accessed data
- Rate limiting to prevent abuse
- Request/response logging for monitoring

### Security Best Practices
- Input validation and sanitization
- SQL/NoSQL injection prevention
- XSS protection
- CSRF protection
- Secure headers with Helmet.js
- Environment variable protection

## 🎯 Proje Başlangıç Adımları

### 1. Proje Kurulumu
```bash
# Proje klasörü oluştur
mkdir elektrotech-api
cd elektrotech-api

# Package.json oluştur
npm init -y

# Gerekli paketleri yükle
npm install express mongoose bcryptjs jsonwebtoken joi cors helmet express-rate-limit multer nodemailer moment uuid axios

# Development paketleri
npm install --save-dev nodemon jest supertest eslint prettier
```

### 2. Klasör Yapısını Oluştur
```bash
mkdir -p config controllers middleware models routes services utils validations
```

### 3. Environment Dosyası
```bash
touch .env
touch .env.example
touch .gitignore
```

### 4. Ana Server Dosyası (server.js)
- Express app configuration
- Database connection
- Middleware setup
- Route mounting
- Error handling
- Server start

Bu dokümantasyon ElektroTech e-ticaret API'sinin tam yapısını ve gereksinimlerini detaylandırır. Her dosya maksimum 200 satır olacak şekilde modüler olarak tasarlanmıştır ve profesyonel kod yazım tekniklerini kullanır. 