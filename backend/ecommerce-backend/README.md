# 🛒 E-Commerce Backend API

Modern ve kapsamlı bir e-ticaret backend API'si. Node.js, Express.js ve MongoDB kullanılarak geliştirilmiştir.

## 🚀 Özellikler

### 🔐 Authentication & Authorization
- JWT tabanlı kimlik doğrulama
- Rol bazlı erişim kontrolü (Admin, User)
- Token refresh mekanizması
- Güvenli password hashing (bcrypt)

### 👥 Kullanıcı Yönetimi
- Kullanıcı kayıt/giriş işlemleri
- Profil yönetimi
- Admin kullanıcı yönetimi
- Kullanıcı istatistikleri

### 📦 Ürün Yönetimi
- Ürün CRUD işlemleri
- Kategori bazlı filtreleme
- Ürün türleri (Product, Bundle)
- Status yönetimi (Active, Inactive, Discontinued)
- Stok takibi
- Resim yükleme sistemi
- Toplu işlemler (Bulk operations)

### 📂 Kategori Yönetimi
- Hiyerarşik kategori yapısı
- Parent-child ilişkileri
- Kategori istatistikleri
- Admin kategori yönetimi

### 🛍️ Sipariş Yönetimi
- Sipariş oluşturma ve takibi
- Sipariş durumu güncelleme
- Kargo takip numarası ekleme
- Admin sipariş yönetimi

### ⭐ Değerlendirme Sistemi
- Ürün değerlendirmeleri
- Rating sistemi
- Review onay/red işlemleri
- Resimli değerlendirmeler

### 💳 Ödeme Sistemi
- PayTR entegrasyonu
- Havale ödemesi
- Dekont yükleme sistemi
- Ödeme durumu takibi
- İade işlemleri

### 📊 Admin Panel API'leri
- Dashboard istatistikleri
- Satış analitikleri
- Kategori dağılımı
- Trend hesaplamaları
- Gelişmiş filtreleme

### 📁 Dosya Yükleme
- Güvenli dosya yükleme
- Çoklu resim desteği
- Dosya türü kontrolü
- Otomatik klasör organizasyonu

## 🛠️ Teknoloji Stack

- **Backend Framework:** Node.js, Express.js
- **Database:** MongoDB, Mongoose ODM
- **Authentication:** JWT (JSON Web Tokens)
- **File Upload:** Multer
- **Password Hashing:** bcrypt
- **Validation:** Express Validator
- **Logging:** Winston
- **Environment:** dotenv

## 📋 Gereksinimler

- Node.js (v14 veya üstü)
- MongoDB (v4.4 veya üstü)
- npm veya yarn

## ⚡ Kurulum

### 1. Repository'yi klonlayın
```bash
git clone https://github.com/your-username/ecommerce-backend.git
cd ecommerce-backend
```

### 2. Bağımlılıkları yükleyin
```bash
npm install
```

### 3. Environment dosyasını oluşturun
```bash
cp .env.example .env
```

### 4. .env dosyasını düzenleyin
```env
# Database
MONGODB_URI=mongodb://localhost:27017/ecommerce

# JWT
JWT_SECRET=your_super_secret_jwt_key
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_EXPIRE=1h
JWT_REFRESH_EXPIRE=7d

# Server
PORT=3000
NODE_ENV=development

# PayTR (Opsiyonel)
PAYTR_MERCHANT_ID=your_merchant_id
PAYTR_MERCHANT_KEY=your_merchant_key
PAYTR_MERCHANT_SALT=your_merchant_salt

# Email (Opsiyonel)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

### 5. Upload klasörlerini oluşturun
```bash
mkdir -p public/uploads/{products,categories,reviews,receipts,general}
```

### 6. Sunucuyu başlatın
```bash
# Development
npm run dev

# Production
npm start
```

## 📚 API Dokümantasyonu

### 🔐 Authentication Endpoints

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/auth/register` | Kullanıcı kaydı |
| POST | `/api/auth/login` | Kullanıcı girişi |
| POST | `/api/auth/refresh` | Token yenileme |
| POST | `/api/auth/logout` | Çıkış yapma |

### 👥 User Management

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/users/profile` | Profil bilgisi |
| PUT | `/api/users/profile` | Profil güncelleme |
| PUT | `/api/users/password` | Şifre değiştirme |

### 📦 Product Endpoints

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/products` | Ürün listesi |
| GET | `/api/products/:slug` | Ürün detayı |
| GET | `/api/products/category/:slug` | Kategoriye göre ürünler |

### 🛍️ Order Endpoints

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/orders` | Sipariş oluştur |
| GET | `/api/orders` | Kullanıcı siparişleri |
| GET | `/api/orders/:id` | Sipariş detayı |

### 💳 Payment Endpoints

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/payments/paytr/init` | PayTR ödeme başlat |
| POST | `/api/payments/bank-transfer/init` | Havale ödemesi |
| POST | `/api/payments/bank-transfer/upload` | Dekont yükle |

## 🛡️ Admin Panel API'leri

### 📊 Dashboard & Analytics

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/admin/dashboard/stats` | Dashboard istatistikleri |
| GET | `/api/admin/analytics/sales` | Satış analitikleri |
| GET | `/api/admin/analytics/categories` | Kategori dağılımı |

### 👥 User Management

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/admin/users` | Tüm kullanıcılar |
| POST | `/api/admin/users` | Kullanıcı oluştur |
| PUT | `/api/admin/users/:id` | Kullanıcı güncelle |
| DELETE | `/api/admin/users/:id` | Kullanıcı sil |
| PUT | `/api/admin/users/:id/status` | Durum değiştir |

### 📦 Product Management

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/admin/products` | Tüm ürünler |
| POST | `/api/admin/products` | Ürün oluştur |
| PUT | `/api/admin/products/:id` | Ürün güncelle |
| DELETE | `/api/admin/products/:id` | Ürün sil |
| PUT | `/api/admin/products/:id/status` | Durum değiştir |
| POST | `/api/admin/products/bulk` | Toplu işlemler |

### 📂 Category Management

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/admin/categories` | Tüm kategoriler |
| POST | `/api/admin/categories` | Kategori oluştur |
| PUT | `/api/admin/categories/:id` | Kategori güncelle |
| DELETE | `/api/admin/categories/:id` | Kategori sil |

### 🛍️ Order Management

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/admin/orders` | Tüm siparişler |
| PUT | `/api/admin/orders/:id/status` | Sipariş durumu |
| PUT | `/api/admin/orders/:id/tracking` | Kargo takip |

### ⭐ Review Management

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/admin/reviews` | Tüm değerlendirmeler |
| PUT | `/api/admin/reviews/:id/approve` | Onayla |
| PUT | `/api/admin/reviews/:id/reject` | Reddet |
| DELETE | `/api/admin/reviews/:id` | Sil |

### 💳 Payment Management

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/admin/payments` | Tüm ödemeler |
| PUT | `/api/admin/payments/:id/approve` | Havale onayla |
| PUT | `/api/admin/payments/:id/reject` | Havale reddet |

### 📁 File Upload

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/admin/upload/product-images` | Ürün resimleri |
| POST | `/api/admin/upload/category-image` | Kategori resmi |
| POST | `/api/admin/upload/review-images` | Değerlendirme resimleri |
| DELETE | `/api/admin/upload/file` | Dosya sil |

## 🗄️ Database Modelleri

### User Model
- Kullanıcı bilgileri
- Rol yönetimi (user, admin)
- Profil resmi
- Adres bilgileri

### Product Model
- Ürün detayları
- Kategori ilişkisi
- Stok bilgileri
- Resim galeri
- Bundle/Set desteği
- SEO alanları

### Category Model
- Hiyerarşik yapı
- Parent-child ilişkiler
- İstatistikler

### Order Model
- Sipariş bilgileri
- Ürün listesi
- Ödeme durumu
- Kargo bilgileri

### Review Model
- Ürün değerlendirmeleri
- Rating sistemi
- Resim desteği

## 🔒 Güvenlik

- JWT tabanlı kimlik doğrulama
- Bcrypt ile şifre hashleme
- Rol bazlı erişim kontrolü
- File upload güvenliği
- Request validation
- CORS koruması

## 📁 Proje Yapısı

```
ecommerce-backend/
├── src/
│   ├── controllers/        # Controller'lar
│   ├── models/            # MongoDB modelleri
│   ├── routes/            # API route'ları
│   ├── middleware/        # Custom middleware'ler
│   ├── services/          # Business logic
│   ├── utils/             # Yardımcı fonksiyonlar
│   └── logger/            # Winston logger
├── public/
│   └── uploads/           # Yüklenen dosyalar
├── logs/                  # Log dosyaları
├── .env                   # Environment variables
├── .gitignore
├── package.json
└── README.md
```

## 🧪 Test

```bash
# Test çalıştır
npm test

# Coverage raporu
npm run test:coverage
```

## 📝 Geliştirme Notları

### Admin Panel Özellikleri ✅
- [x] Dashboard istatistikleri
- [x] Kullanıcı yönetimi
- [x] Ürün yönetimi (CRUD, bulk operations)
- [x] Kategori yönetimi (hiyerarşik)
- [x] Sipariş yönetimi
- [x] Değerlendirme yönetimi
- [x] Ödeme yönetimi
- [x] Dosya yükleme sistemi
- [x] Analitik raporlar

### Frontend Entegrasyon Notları
- Authentication token'ları `localStorage`'da saklanmalı
- API isteklerinde `Authorization: Bearer <token>` header'ı kullanılmalı
- Error handling için global interceptor önerilir
- File upload için `multipart/form-data` kullanılmalı

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 👨‍💻 Geliştirici

**Osman** - [GitHub](https://github.com/your-username)

---

⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın!