# 🛒 Açık Atölye E-Commerce Platform

Modern, responsive ve tam fonksiyonel e-ticaret platformu. React, TypeScript ve Next.js kullanılarak geliştirilmiştir.

## 📋 İçindekiler

1. [Proje Genel Bakış](#proje-genel-bakış)
2. [Teknolojiler](#teknolojiler)
3. [Kurulum](#kurulum)
4. [Dökümantasyon](#dökümantasyon)
5. [Özellikler](#özellikler)
6. [API](#api)
7. [Katkıda Bulunma](#katkıda-bulunma)

---

## 🏗️ Proje Genel Bakış

Açık Atölye, elektronik ürünler satan modern bir e-ticaret platformudur. Kullanıcı dostu arayüz, güvenli ödeme sistemi ve kapsamlı admin paneli ile tam fonksiyonel bir e-ticaret deneyimi sunar.

### 🎯 Ana Özellikler
- 🛒 **Sepet Yönetimi**: Zustand ile state yönetimi
- 💳 **Ödeme Sistemi**: PayTR entegrasyonu
- 👨‍💼 **Admin Paneli**: Tam fonksiyonel yönetim paneli
- 📱 **Responsive Tasarım**: Tüm cihazlarda uyumlu
- 🔐 **Güvenlik**: JWT authentication ve SSL
- 📊 **Analitik**: Detaylı satış raporları

---

## 🛠️ Teknolojiler

### Frontend
- **React 18** - Modern UI framework
- **TypeScript** - Tip güvenliği
- **Next.js 14** - Full-stack framework
- **Tailwind CSS** - Utility-first CSS
- **Zustand** - State management
- **Recharts** - Data visualization

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **JWT** - Authentication
- **PayTR** - Payment gateway

### DevOps
- **Docker** - Containerization
- **Nginx** - Web server
- **SSL/TLS** - Security
- **Git** - Version control

---

## 🚀 Kurulum

### Gereksinimler
- Node.js 18+ 
- npm veya pnpm
- MongoDB
- PayTR hesabı

### Adım 1: Projeyi Klonlayın
```bash
git clone https://github.com/your-username/ecommerce-frontend.git
cd ecommerce-frontend
```

### Adım 2: Bağımlılıkları Yükleyin
```bash
npm install
# veya
pnpm install
```

### Adım 3: Ortam Değişkenlerini Ayarlayın
```bash
cp example.env.local .env.local
```

`.env.local` dosyasını düzenleyin:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/electrotech

# Authentication
JWT_SECRET=your-jwt-secret

# PayTR Configuration
PAYTR_MERCHANT_ID=your-merchant-id
PAYTR_MERCHANT_KEY=your-merchant-key
PAYTR_MERCHANT_SALT=your-merchant-salt

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Adım 4: Geliştirme Sunucusunu Başlatın
```bash
npm run dev
# veya
pnpm dev
```

Uygulama http://localhost:3000 adresinde çalışacaktır.

---

## 📚 Dökümantasyon

Proje dökümantasyonu `project_document/` klasöründe organize edilmiştir:

### 📋 Ana İndeks
- [Dökümantasyon İndeksi](./project_document/00_DOCUMENTATION_INDEX.md) - Tüm dökümanların kategorize edilmiş listesi

### 🏗️ Proje Temelleri
- [Proje Genel Bakış](./project_document/01_PROJECT_OVERVIEW.md) - Proje hakkında detaylı bilgi
- [Mimari Yapı](./project_document/02_ARCHITECTURE.md) - Sistem mimarisi
- [Kurulum Rehberi](./project_document/03_SETUP_GUIDE.md) - Detaylı kurulum adımları

### 🔧 Geliştirme Rehberleri
- [Routing ve Navigasyon](./project_document/04_ROUTING_NAVIGATION.md)
- [Kimlik Doğrulama](./project_document/05_AUTHENTICATION.md)
- [Bileşenler ve UI](./project_document/06_COMPONENTS_UI.md)
- [API Entegrasyonu](./project_document/07_API_INTEGRATION.md)
- [Durum Yönetimi](./project_document/08_STATE_MANAGEMENT.md)
- [Formlar ve Doğrulama](./project_document/09_FORMS_VALIDATION.md)

### 💳 Ödeme Sistemi
- [Ödeme Sistemi Genel Bakış](./project_document/PAYMENT_SYSTEM_OVERVIEW.md)
- [Ödeme API Dökümantasyonu](./project_document/PAYMENT_API_DOCUMENTATION.md)
- [Kupon API Dökümantasyonu](./project_document/PAYMENT_COUPON_API.md)
- [Ödeme Test Senaryoları](./project_document/PAYMENT_TEST_SCENARIOS.md)

### 🛒 Sepet Sistemi
- [Sepet Sistemi Genel Bakış](./project_document/CART_SYSTEM_OVERVIEW.md)
- [Sepet API Dökümantasyonu](./project_document/CART_API_DOCUMENTATION.md)

### 👨‍💼 Admin Paneli
- [Admin Paneli Genel Bakış](./project_document/ADMIN_PANEL_OVERVIEW.md)
- [Admin Paneli API](./project_document/ADMIN_PANEL_API.md)
- [Sipariş Yönetimi](./project_document/ADMIN_ORDER_MANAGEMENT.md)

### 🔌 API Dökümantasyonu
- [Ana API Dökümantasyonu](./project_document/API_MAIN_DOCUMENTATION.md)
- [Yeni API Özellikleri](./project_document/API_NEW_FEATURES.md)
- [Eksik Endpoint'ler](./project_document/API_MISSING_ENDPOINTS.md)

### 🧪 Test ve Kalite
- [Test Senaryoları](./project_document/PAYMENT_TEST_SCENARIOS.md)
- [Hızlı Test Kontrol Listesi](./project_document/QUICK_TEST_CHECKLIST.md)
- [Frontend Test Dökümantasyonu](./project_document/FRONTEND_TESTING.md)

### 🔒 Güvenlik
- [HTTPS Kurulum Rehberi](./project_document/HTTPS_SETUP.md)

---

## ⭐ Özellikler

### 🛒 Kullanıcı Özellikleri
- **Ürün Kataloğu**: Kategorilere göre ürün listesi
- **Arama ve Filtreleme**: Gelişmiş ürün arama
- **Sepet Yönetimi**: Ürün ekleme/çıkarma
- **Güvenli Ödeme**: PayTR entegrasyonu
- **Sipariş Takibi**: Gerçek zamanlı durum güncellemeleri
- **Kullanıcı Profili**: Kişisel bilgi yönetimi

### 👨‍💼 Admin Özellikleri
- **Dashboard**: Gerçek zamanlı istatistikler
- **Ürün Yönetimi**: CRUD işlemleri
- **Kategori Yönetimi**: Hiyerarşik yapı
- **Sipariş Yönetimi**: Durum güncellemeleri
- **Kullanıcı Yönetimi**: Rol tabanlı erişim
- **Analitik**: Detaylı raporlar

### 🔐 Güvenlik Özellikleri
- **JWT Authentication**: Güvenli oturum yönetimi
- **Role-based Access**: Yetki tabanlı erişim
- **SSL/TLS**: Şifreli iletişim
- **Input Validation**: Güvenli veri girişi
- **CSRF Protection**: Cross-site request forgery koruması

---

## 🔌 API

### Ana Endpoint'ler
```http
# Kullanıcı İşlemleri
POST /api/auth/login
POST /api/auth/register
GET /api/auth/profile

# Ürün İşlemleri
GET /api/products
GET /api/products/{id}
GET /api/categories

# Sepet İşlemleri
GET /api/cart
POST /api/cart/add
DELETE /api/cart/remove/{id}

# Ödeme İşlemleri
POST /api/payments/paytr/init
POST /api/payments/paytr/callback
GET /api/payments/status/{orderId}

# Admin İşlemleri
GET /api/admin/dashboard/stats
GET /api/admin/products
POST /api/admin/products
PUT /api/admin/products/{id}
DELETE /api/admin/products/{id}
```

Detaylı API dökümantasyonu için [API Ana Dökümantasyonu](./project_document/API_MAIN_DOCUMENTATION.md) dosyasına bakın.

---

## 🧪 Test

### Test Senaryoları
```bash
# Unit testleri çalıştır
npm run test

# E2E testleri çalıştır
npm run test:e2e

# Test coverage raporu
npm run test:coverage
```

### Test Kontrol Listesi
- [ ] ✅ Ödeme sistemi testleri
- [ ] ✅ Sepet işlemleri testleri
- [ ] ✅ Admin paneli testleri
- [ ] ✅ API endpoint testleri
- [ ] ✅ UI/UX testleri

---

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Docker ile Deployment
```bash
docker build -t electrotech-frontend .
docker run -p 3000:3000 electrotech-frontend
```

### Environment Variables
Production ortamında aşağıdaki değişkenleri ayarlayın:
- `NODE_ENV=production`
- `MONGODB_URI`
- `JWT_SECRET`
- `PAYTR_*` değişkenleri
- `SMTP_*` değişkenleri

---

## 🤝 Katkıda Bulunma

### Geliştirme Süreci
1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

### Kod Standartları
- TypeScript strict mode kullanın
- ESLint kurallarına uyun
- Prettier ile kod formatlaması yapın
- Unit testleri yazın
- Dökümantasyonu güncelleyin

### Commit Mesajları
```
feat: yeni özellik eklendi
fix: hata düzeltildi
docs: dökümantasyon güncellendi
style: kod formatlaması
refactor: kod yeniden düzenlendi
test: test eklendi
chore: build işlemleri
```

---

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

---

## 📞 İletişim

- **Proje Sahibi**: [Your Name](mailto:your-email@example.com)
- **GitHub**: [https://github.com/your-username/ecommerce-frontend](https://github.com/your-username/ecommerce-frontend)
- **Website**: [https://electrotech.com](https://electrotech.com)

---

## 🙏 Teşekkürler

Bu projeyi mümkün kılan tüm açık kaynak topluluğuna teşekkürler:

- [React](https://reactjs.org/)
- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Zustand](https://github.com/pmndrs/zustand)
- [PayTR](https://www.paytr.com/)

---

**⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın!** 