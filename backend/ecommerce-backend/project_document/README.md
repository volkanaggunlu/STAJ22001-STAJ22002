# E-Commerce Backend Projesi - Geliştirici Dokümantasyonu

## 🚀 Proje Genel Bakış

Bu proje, modern e-ticaret uygulamaları için geliştirilmiş, ölçeklenebilir ve güvenli bir backend sistemidir. Node.js, Express.js ve MongoDB teknolojileri kullanılarak geliştirilmiştir.

### 🛠️ Teknoloji Stack'i

- **Backend Framework**: Node.js + Express.js
- **Veritabanı**: MongoDB (Mongoose ODM)
- **Cache**: Redis
- **Kimlik Doğrulama**: JWT (JSON Web Tokens)
- **Ödeme Sistemi**: PayTR entegrasyonu
- **Email Servisi**: Nodemailer
- **Dosya Yükleme**: Multer
- **Validation**: Joi
- **Logging**: Winston
- **Test**: Jest + Supertest

### 🏗️ Mimari Yapı

Proje **MVC (Model-View-Controller)** mimarisi ve **Layered Architecture** prensipleri ile geliştirilmiştir:

```
├── Controllers (İstek/Yanıt yönetimi)
├── Services (İş mantığı)
├── Models (Veri modelleri)
├── Routes (API endpoint'leri)
├── Middleware (Güvenlik, doğrulama)
├── Utils (Yardımcı fonksiyonlar)
└── Config (Yapılandırma)
```

### 🔧 Temel Özellikler

- ✅ **Kullanıcı Yönetimi**: Kayıt, giriş, profil yönetimi
- ✅ **Ürün Yönetimi**: CRUD işlemleri, kategoriler, varyantlar
- ✅ **Sepet Sistemi**: Dinamik sepet, kupon sistemi
- ✅ **Sipariş Yönetimi**: Sipariş takibi, durum güncellemeleri
- ✅ **Ödeme Sistemi**: PayTR entegrasyonu, çoklu ödeme
- ✅ **Admin Panel**: Yönetim dashboard'u, raporlama
- ✅ **Güvenlik**: JWT, rate limiting, input validation
- ✅ **Kargo Takibi**: Teslimat yönetimi, kargo entegrasyonu

---

## 📖 Dokümantasyon Modülleri

### 🔐 Kimlik Doğrulama ve Yetkilendirme
- **[01 - Authentication (Kimlik Doğrulama)](./01-authentication.md)**
  - JWT token sistemi, login/logout, password reset
  - Middleware'ler ve güvenlik önlemleri

### 👥 Kullanıcı Yönetimi
- **[02 - User Management (Kullanıcı Yönetimi)](./02-user-management.md)**
  - Kullanıcı profil yönetimi, admin işlemleri
  - Kullanıcı rolleri ve yetkilendirme

### 📦 Ürün ve Kategori Yönetimi
- **[03 - Product Management (Ürün Yönetimi)](./03-product-management.md)**
  - Ürün CRUD işlemleri, görsel yönetimi, stok takibi
  - Ürün varyantları ve fiyatlandırma

- **[04 - Category Management (Kategori Yönetimi)](./04-category-management.md)**
  - Hiyerarşik kategori yapısı, alt kategoriler
  - Kategori bazlı filtreleme ve yönetim

### 🛒 Alışveriş ve Sipariş Süreçleri
- **[05 - Cart Management (Sepet Yönetimi)](./05-cart-management.md)**
  - Sepet işlemleri, kupon uygulaması
  - Dinamik fiyat hesaplama ve validasyon

- **[06 - Order Management (Sipariş Yönetimi)](./06-order-management.md)**
  - Sipariş yaşam döngüsü, durum takibi
  - İptal ve iade süreçleri

### 💳 Ödeme ve Mali İşlemler
- **[07 - Payment Processing (Ödeme İşlemleri)](./07-payment-processing.md)**
  - PayTR entegrasyonu, çoklu ödeme yöntemleri
  - Güvenli ödeme işleme ve doğrulama

- **[10 - Coupon System (Kupon Sistemi)](./10-coupon-system.md)**
  - İndirim kuponları, promosyon kodları
  - Kullanım kuralları ve sınırlamaları

### 🚚 Kargo ve Teslimat
- **[08 - Shipping & Tracking (Kargo ve Takip)](./08-shipping-tracking.md)**
  - Kargo yönetimi, teslimat takibi
  - Kargo şirketi entegrasyonları

### ⭐ Değerlendirme ve Geri Bildirim
- **[09 - Review System (Değerlendirme Sistemi)](./09-review-system.md)**
  - Ürün değerlendirmeleri, yıldız puanlama
  - Moderasyon ve spam koruması

### 🔍 Arama ve Keşif
- **[11 - Search System (Arama Sistemi)](./11-search-system.md)**
  - Gelişmiş ürün arama, filtreleme
  - Otomatik tamamlama ve öneriler

### 🛡️ Yönetim ve Güvenlik
- **[12 - Admin Panel (Yönetim Paneli)](./12-admin-panel.md)**
  - Yönetici dashboard'u, raporlama
  - Kullanıcı ve ürün yönetimi

- **[15 - Security Middleware (Güvenlik Katmanı)](./15-security-middleware.md)**
  - Güvenlik middleware'leri, rate limiting
  - Input validation ve güvenlik logları

### 📧 İletişim ve Bildirimler
- **[13 - Email Services (E-posta Servisleri)](./13-email-services.md)**
  - E-posta gönderimi, şablon yönetimi
  - Newsletter ve kampanya yönetimi

### 📊 Analitik ve Raporlama
- **[14 - Analytics System (Analitik Sistemi)](./14-analytics-system.md)**
  - Kullanıcı davranışı analizi, satış raporları
  - Real-time dashboard ve metrikler

### ⚙️ Yapılandırma ve Altyapı
- **[16 - Database Config (Veritabanı Yapılandırması)](./16-database-config.md)**
  - MongoDB ve Redis konfigürasyonu
  - Logging, health check ve monitoring

---

## 🚀 Hızlı Başlangıç

### 1. Projeyi Klonlayın
```bash
git clone <repository-url>
cd ecommerce-backend
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install
```

### 3. Environment Değişkenlerini Ayarlayın
```bash
cp .env.example .env
# .env dosyasını düzenleyin
```

### 4. Veritabanını Başlatın
```bash
# MongoDB ve Redis'in çalıştığından emin olun
npm run db:seed  # Örnek veri yükle
```

### 5. Sunucuyu Başlatın
```bash
# Development
npm run dev

# Production
npm start
```

### 6. API Testleri
```bash
npm test
```

---

## 📋 API Endpoint'leri

### Kimlik Doğrulama
- `POST /api/auth/register` - Kullanıcı kaydı
- `POST /api/auth/login` - Giriş yapma
- `POST /api/auth/logout` - Çıkış yapma
- `POST /api/auth/refresh` - Token yenileme

### Ürünler
- `GET /api/products` - Ürün listesi
- `GET /api/products/:id` - Ürün detayı
- `POST /api/products` - Ürün oluşturma (Admin)
- `PUT /api/products/:id` - Ürün güncelleme (Admin)

### Sepet
- `GET /api/cart` - Sepet görüntüleme
- `POST /api/cart/add` - Sepete ürün ekleme
- `PUT /api/cart/update` - Sepet güncelleme
- `DELETE /api/cart/remove` - Sepetten ürün çıkarma

### Siparişler
- `GET /api/orders` - Sipariş listesi
- `POST /api/orders` - Sipariş oluşturma
- `GET /api/orders/:id` - Sipariş detayı
- `PATCH /api/orders/:id/status` - Sipariş durumu güncelleme

### Admin
- `GET /api/admin/dashboard` - Admin dashboard
- `GET /api/admin/analytics` - Analitik veriler
- `GET /api/admin/users` - Kullanıcı yönetimi

---

## 🔧 Geliştirici Rehberi

### Yeni Özellik Ekleme
1. **Model Oluşturma**: `src/models/` klasöründe Mongoose modeli
2. **Service Yazma**: `src/services/` klasöründe iş mantığı
3. **Controller Ekleme**: `src/controllers/` klasöründe request handling
4. **Route Tanımlama**: `src/routes/` klasöründe endpoint'ler
5. **Validation Ekleme**: `src/validation/` klasöründe Joi şemaları
6. **Test Yazma**: `src/tests/` klasöründe unit/integration testler

### Kod Standartları
- **ESLint** konfigürasyonuna uyun
- **Async/await** kullanın, Promise.then() kullanmayın
- **Error handling** her endpoint'te olmalı
- **Validation** tüm input'lar için zorunlu
- **Logging** önemli işlemler için gerekli

### Veritabanı İşlemleri
- **Mongoose ODM** kullanın
- **Index'leri** unutmayın (performans için)
- **Populate** işlemlerini optimize edin
- **Transaction** kullanın (gerektiğinde)

---

## 🧪 Test Stratejisi

### Unit Testler
- Service fonksiyonları
- Utility fonksiyonları
- Model validasyonları

### Integration Testler
- API endpoint'leri
- Database işlemleri
- Authentication flow

### Test Komutları
```bash
npm test                    # Tüm testler
npm run test:unit          # Sadece unit testler
npm run test:integration   # Sadece integration testler
npm run test:coverage      # Coverage raporu
```

---

## 📈 Performans Optimizasyonu

### Veritabanı
- **Indexing**: Sık kullanılan alanlarda index
- **Aggregation**: Karmaşık sorgular için
- **Pagination**: Büyük veri setleri için
- **Caching**: Redis ile cache mekanizması

### API
- **Rate Limiting**: Kötüye kullanımı önleme
- **Compression**: Response boyutunu küçültme
- **CDN**: Statik dosyalar için
- **Load Balancing**: Yüksek trafik için

---

## 🔒 Güvenlik

### Kimlik Doğrulama
- JWT token'lar
- Bcrypt ile şifre hashleme
- Rate limiting login işlemleri
- Token blacklisting

### Input Validation
- Joi ile request validation
- XSS koruması
- SQL injection koruması
- CSRF koruması

### Monitoring
- Security log'ları
- Şüpheli aktivite tespit
- Admin bildirimleri
- Audit trail

---

## 📞 Destek ve İletişim

### Dokümantasyon Güncellemeleri
Bu dokümantasyon düzenli olarak güncellenmektedir. Yeni özellikler eklendiğinde ilgili modül dokümantasyonları da güncellenecektir.

### Geliştirici Notları
- **Frontend Geliştiriciler**: API endpoint'leri ve response formatları
- **Backend Geliştiriciler**: Servis katmanı ve business logic
- **DevOps**: Deployment ve scaling rehberleri
- **QA**: Test senaryoları ve validation kuralları

### Cursor AI Entegrasyonu
Bu dokümantasyon Cursor AI ile uyumlu olacak şekilde tasarlanmıştır. Her modül, AI asistan tarafından proje geliştirme sürecinde referans olarak kullanılabilir.

---

**Son Güncelleme**: `{new Date().toLocaleDateString('tr-TR')}`
**Sürüm**: v1.0.0
**Dil**: Türkçe 