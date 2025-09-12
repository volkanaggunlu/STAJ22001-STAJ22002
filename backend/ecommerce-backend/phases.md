# 🚀 ElektroTech API Geliştirme Fazları

## 📋 Genel Bakış

Bu döküman API dokümantasyonuna göre geliştirme fazlarını, her fazda yapılacak işleri ve teknik detayları içerir.

## 🎯 Phase 1: Core Auth & User Management (1-2 hafta)

### 📊 Hedefler
- Authentication sistemini genişletmek
- User management endpoints'lerini eklemek
- Email service kurmak
- Temel validation sistemlerini eklemek

### 🔐 1.1 Authentication Sistemi Genişletme

#### Yapılacaklar:
- **JWT Config**: Refresh token desteği
- **Email Verification**: Hesap doğrulama sistemi
- **Password Reset**: Şifre sıfırlama sistemi
- **Account Lockout**: 5 yanlış denemeden sonra hesap kilitleme
- **Rate Limiting**: Login denemelerini sınırlama

#### Oluşturulacak Dosyalar:
```
src/config/jwt.js                  # JWT konfigürasyonu
src/services/authService.js        # Authentication servisi
src/validations/authValidation.js  # Auth validasyonları
src/middleware/rateLimiter.js      # Rate limiting middleware
src/utils/tokenUtils.js            # Token yardımcı fonksiyonları
```

#### Endpoints:
```
POST   /api/auth/register          # Kullanıcı kaydı ✅ (mevcut)
POST   /api/auth/login             # Kullanıcı girişi ✅ (mevcut)
POST   /api/auth/logout            # Kullanıcı çıkışı ❌
POST   /api/auth/refresh-token     # Token yenileme ❌
POST   /api/auth/forgot-password   # Şifre sıfırlama talebi ❌
POST   /api/auth/reset-password    # Şifre güncelleme ❌
POST   /api/auth/verify-email      # Email doğrulama ❌
POST   /api/auth/resend-verification # Email doğrulama tekrar gönder ❌
```

#### Teknik Detaylar:
```javascript
// JWT Token Structure
{
  "userId": "648a1b2c3d4e5f6789012345",
  "email": "user@example.com",
  "role": "user",
  "type": "access", // or "refresh"
  "iat": 1640995200,
  "exp": 1640998800
}

// Email Verification Process
1. User registers → unverified account created
2. Verification email sent with token
3. User clicks link → account verified
4. Login allowed only for verified accounts
```

### 👤 1.2 User Management Genişletme

#### Yapılacaklar:
- **Profil Yönetimi**: Kullanıcı bilgileri CRUD
- **Çoklu Adres**: Adres ekleme/düzenleme/silme
- **Favori Ürünler**: Favoriye ekleme/çıkarma
- **Sipariş Geçmişi**: Kullanıcı siparişleri
- **Kullanıcı İstatistikleri**: Harcama, sipariş sayısı

#### Oluşturulacak Dosyalar:
```
src/controllers/userController.js   # User management controller
src/routes/userRoutes.js           # User routes
src/validations/userValidation.js  # User validasyonları
src/services/userService.js        # User işlemleri servisi
```

#### Endpoints:
```
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
```

### 📧 1.3 Email Service

#### Yapılacaklar:
- **Email Template System**: HTML email şablonları
- **Email Service**: Nodemailer konfigürasyonu
- **Email Types**: Verification, Password Reset, Welcome
- **Email Queue**: Email gönderim sırası (opsiyonel)

#### Oluşturulacak Dosyalar:
```
src/services/emailService.js       # Email gönderim servisi
src/templates/email/               # Email şablonları klasörü
  ├── welcome.html                # Hoş geldin emaili
  ├── verification.html           # Email doğrulama
  ├── password-reset.html         # Şifre sıfırlama
  └── order-confirmation.html     # Sipariş onayı
```

#### Email Types:
```javascript
// Email türleri
const EMAIL_TYPES = {
  WELCOME: 'welcome',
  EMAIL_VERIFICATION: 'email_verification',
  PASSWORD_RESET: 'password_reset',
  ORDER_CONFIRMATION: 'order_confirmation'
};
```

### 🔍 1.4 Validation System

#### Yapılacaklar:
- **Joi Validation**: Tüm input'lar için validation
- **Custom Validators**: Özel validasyon kuralları
- **Error Handling**: Validation error'larını düzenli döndürme
- **Turkish Messages**: Türkçe hata mesajları

#### Oluşturulacak Dosyalar:
```
src/validations/authValidation.js  # Auth validasyonları
src/validations/userValidation.js  # User validasyonları
src/utils/validators.js            # Özel validator fonksiyonları
```

### 📋 Phase 1 Çıktıları:
- ✅ Email verification sistemi
- ✅ Password reset sistemi
- ✅ Çoklu adres yönetimi
- ✅ Favori ürünler sistemi
- ✅ Kullanıcı profil yönetimi
- ✅ Rate limiting
- ✅ Email service
- ✅ Comprehensive validation

---

## 🎯 Phase 2: Payment & Shipping (1-2 hafta)

### 📊 Hedefler
- PayTR entegrasyonunu tamamlamak
- Bank transfer sistemini kurmak
- Shipping sistemini genişletmek
- Order management'ı iyileştirmek

### 💳 2.1 Payment System

#### Yapılacaklar:
- **PayTR Integration**: Iframe token generation
- **Bank Transfer**: Havale bildirimi sistemi
- **Receipt Upload**: Dekont yükleme
- **Payment Status**: Ödeme durumu sorgulama
- **Refund System**: İade işlemleri

#### Oluşturulacak Dosyalar:
```
src/config/paytr.js                # PayTR konfigürasyonu
src/services/paymentService.js     # Payment servisi
src/controllers/paymentController.js # Payment controller
src/routes/paymentRoutes.js        # Payment routes
```

#### Endpoints:
```
POST   /api/payments/paytr/init    # PayTR ödeme başlatma
POST   /api/payments/paytr/callback # PayTR geri dönüş URL'i ✅
GET    /api/payments/paytr/status/:orderId # Ödeme durumu
POST   /api/payments/bank-transfer/notify # Havale bildirimi
POST   /api/payments/bank-transfer/upload # Dekont yükleme
GET    /api/payments/bank-accounts  # Banka hesap bilgileri
GET    /api/payments/methods       # Ödeme yöntemleri
GET    /api/payments/:id/status    # Ödeme durumu sorgulama
POST   /api/payments/:id/refund    # İade işlemi
```

### 🚚 2.2 Shipping System

#### Yapılacaklar:
- **BasitKargo Integration**: Tam entegrasyon
- **Shipping Label**: Etiket oluşturma
- **Rate Calculation**: Kargo ücreti hesaplama
- **Multiple Carriers**: Çoklu kargo desteği
- **Tracking System**: Kargo takip

#### Oluşturulacak Dosyalar:
```
src/config/basitkargo.js           # BasitKargo konfigürasyonu
src/services/shippingService.js    # Shipping servisi
src/controllers/shippingController.js # Shipping controller
src/routes/shippingRoutes.js       # Shipping routes
```

#### Endpoints:
```
POST   /api/shipping/create        # Kargo gönderi oluşturma
GET    /api/shipping/track/:code   # Kargo takip sorgulama
GET    /api/shipping/rates         # Kargo ücret hesaplama
PUT    /api/shipping/update/:id    # Kargo bilgisi güncelleme
GET    /api/shipping/carriers      # Kargo firmaları listesi
POST   /api/shipping/label/:id     # Kargo etiketi oluşturma
```

### 📦 2.3 Order Management İyileştirme

#### Yapılacaklar:
- **Order Status Flow**: Sipariş durumu yönetimi
- **Automatic Updates**: Otomatik durum güncellemeleri
- **Customer Notifications**: Müşteri bildirimleri
- **Return System**: İade sistemi

#### Güncellenecek Dosyalar:
```
src/controllers/orderController.js  # Order controller genişletme
src/services/orderService.js        # Order servisi
src/models/order.js                 # Order model güncelleme
```

### 📋 Phase 2 Çıktıları:
- ✅ PayTR tam entegrasyonu
- ✅ Bank transfer sistemi
- ✅ Shipping management
- ✅ Order tracking
- ✅ Return system
- ✅ Payment refunds

---

## 🎯 Phase 3: Admin Panel (1 hafta)

### 📊 Hedefler
- Admin panel endpoints'lerini oluşturmak
- Analytics servisi kurmak
- Dashboard data endpoints'lerini eklemek
- Content management sistemini kurmak

### 👨‍💼 3.1 Admin Dashboard

#### Yapılacaklar:
- **Dashboard Analytics**: Satış, sipariş, kullanıcı istatistikleri
- **Real-time Data**: Canlı veriler
- **Charts Data**: Grafik verileri
- **KPI Metrics**: Anahtar performans göstergeleri

#### Oluşturulacak Dosyalar:
```
src/controllers/adminController.js  # Admin controller
src/routes/adminRoutes.js          # Admin routes
src/services/analyticsService.js   # Analytics servisi
src/middleware/adminAuth.js        # Admin auth middleware
```

#### Endpoints:
```
GET    /api/admin/dashboard        # Dashboard verileri ve istatistikler
GET    /api/admin/analytics/sales  # Satış analizi
GET    /api/admin/analytics/products # Ürün analizi
GET    /api/admin/analytics/users  # Kullanıcı analizi
```

### 📦 3.2 Order Management

#### Endpoints:
```
GET    /api/admin/orders           # Tüm siparişler (filtreleme, arama)
GET    /api/admin/orders/:id       # Sipariş detayı
PUT    /api/admin/orders/:id/status # Sipariş durumu güncelleme
POST   /api/admin/orders/:id/tracking # Kargo takip numarası ekleme
PUT    /api/admin/orders/:id/notes # Admin notu ekleme
```

### 🛍️ 3.3 Product Management

#### Endpoints:
```
GET    /api/admin/products         # Tüm ürünler
POST   /api/admin/products         # Yeni ürün ekleme
PUT    /api/admin/products/:id     # Ürün güncelleme
DELETE /api/admin/products/:id     # Ürün silme
PUT    /api/admin/products/:id/stock # Stok güncelleme
PUT    /api/admin/products/:id/status # Ürün durumu güncelleme
```

### 📋 Phase 3 Çıktıları:
- ✅ Admin dashboard
- ✅ Order management
- ✅ Product management
- ✅ User management
- ✅ Analytics system
- ✅ Content moderation

---

## 🎯 Phase 4: Advanced Features (1 hafta)

### 📊 Hedefler
- Gelişmiş arama sistemi
- Security enhancements
- Performance optimization
- Testing

### 🔍 4.1 Advanced Search

#### Yapılacaklar:
- **Multi-criteria Search**: Çoklu kriter arama
- **Full-text Search**: Tam metin arama
- **Faceted Search**: Fasetli arama
- **Search Analytics**: Arama analitiği

#### Oluşturulacak Dosyalar:
```
src/services/searchService.js      # Arama servisi
src/controllers/searchController.js # Arama controller
```

### 🛡️ 4.2 Security Enhancements

#### Yapılacaklar:
- **Input Sanitization**: Girdi temizleme
- **XSS Protection**: XSS koruması
- **CSRF Protection**: CSRF koruması
- **Rate Limiting**: Detaylı rate limiting

#### Oluşturulacak Dosyalar:
```
src/middleware/security.js         # Security middleware
src/utils/encryption.js            # Şifreleme utilities
```

### 📋 Phase 4 Çıktıları:
- ✅ Advanced search
- ✅ Security enhancements
- ✅ Performance optimization
- ✅ Comprehensive testing

---

## 🔧 Environment Variables

### Phase 1'de Eklenecek:
```env
# JWT
JWT_SECRET=your-jwt-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRE=1h
JWT_REFRESH_EXPIRE=7d

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@elektrotech.com

# Frontend
FRONTEND_URL=http://localhost:3000
```

### Phase 2'de Eklenecek:
```env
# PayTR (mevcut olanlar genişletilecek)
PAYTR_TEST_MODE=true
PAYTR_TIMEOUT_LIMIT=30
PAYTR_MAX_INSTALLMENT=12

# BasitKargo (mevcut olanlar genişletilecek)
BASITKARGO_TEST_MODE=true
BASITKARGO_WEBHOOK_URL=your-webhook-url
```

## 📦 Package Dependencies

### Phase 1'de Eklenecek:
```json
{
  "dependencies": {
    "joi": "^17.9.2",
    "nodemailer": "^6.9.3",
    "moment": "^2.29.4",
    "uuid": "^9.0.0"
  }
}
```

### Phase 2'de Eklenecek:
```json
{
  "dependencies": {
    "multer": "^1.4.5",
    "sharp": "^0.32.0"
  }
}
```

## 🚀 Başlangıç

### 1. Model Dosyalarını Kopyalama
```bash
cp api_new_models/*.js src/models/
```

### 2. Dependencies Yükleme
```bash
npm install joi nodemailer moment uuid
```

### 3. Environment Variables
`.env` dosyasını güncelle

### 4. Phase 1 Başlatma
Phase 1'den başlayarak sırasıyla tüm fazları tamamla

## 📈 Success Metrics

### Phase 1:
- [ ] Authentication endpoints tamamlandı
- [ ] User management endpoints tamamlandı
- [ ] Email service çalışıyor
- [ ] Validation sistemi aktif

### Phase 2:
- [ ] Payment system tamamlandı
- [ ] Shipping system tamamlandı
- [ ] Order management iyileştirildi

### Phase 3:
- [ ] Admin panel tamamlandı
- [ ] Analytics system çalışıyor

### Phase 4:
- [ ] Advanced features tamamlandı
- [ ] Security enhancements aktif
- [ ] Performance optimized

Bu plan API dokümantasyonuna tam uyumlu olarak tasarlanmıştır ve her fase ardışık olarak tamamlanmalıdır. 