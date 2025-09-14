# 🛒 E-Ticaret Platformu

Bu proje, modern bir **e-ticaret altyapısı** sunmak için geliştirilmiş tam kapsamlı bir uygulamadır.  
Hem **backend (Node.js/Express)** hem de **frontend (Next.js/React)** katmanlarını içerir.  

Proje, ürün yönetimi, kullanıcı yönetimi, sepet, sipariş, ödeme, kargo takibi, kupon ve inceleme sistemleri gibi temel e-ticaret fonksiyonlarını destekler.

---

## 📑 İçindekiler
- [Özellikler](#-özellikler)
- [Teknolojiler](#-teknolojiler)
- [Kurulum](#-kurulum)
- [Backend Kullanımı](#-backend-kullanımı)
- [Frontend Kullanımı](#-frontend-kullanımı)
- [Dizin Yapısı](#-dizin-yapısı)
- [API Dokümantasyonu](#-api-dokümantasyonu)
- [Katkıda Bulunma](#-katkıda-bulunma)
- [Lisans](#-lisans)

---

## ✨ Özellikler
- 👤 Kullanıcı kayıt/giriş ve yetkilendirme  
- 🛍️ Ürün ve kategori yönetimi  
- 🛒 Sepet ve sipariş yönetimi  
- 💳 Ödeme entegrasyonu  
- 🚚 Kargo ve teslimat takibi  
- 🎟️ Kupon ve indirim sistemi  
- ⭐ Ürün inceleme ve puanlama  
- 🛠️ Yönetici paneli  
- 🔎 Gelişmiş arama ve filtreleme  
- 📧 E-posta bildirimleri  
- 📊 Analitik ve raporlama  

---

## 🛠 Teknolojiler

**Backend:**
- Node.js, Express.js
- MongoDB (veya tercihe göre başka bir veritabanı)
- JWT ile kimlik doğrulama

**Frontend:**
- Next.js (React tabanlı)
- Tailwind CSS ile modern arayüz
- React Hooks ve Context API
- SSR/SSG desteği

**Diğer:**
- Postman / OpenAPI ile API dokümantasyonu
---

## ⚙️ Kurulum

### Gereksinimler
- Node.js (v16+ önerilir)
- Next.js
- npm veya yarn  
- MongoDB (lokal veya bulut)  
- (Opsiyonel) Docker  

### 1. Repoyu Klonlayın

git clone <repo-url> cd <proje-dizini>

### 2. Ortam Değişkenlerini Ayarlayın
Her iki proje için de .env dosyalarını örneklerden kopyalayın ve doldurun:

# Backend için
cd backend/ecommerce-backend
cp .env.example .env

# Frontend için
cd ../../frontend/ecommerce-frontend
cp example.env.local .env.local

### 3. Bağımlılıkları Kurun
# Backend

cd backend
npm install

# Frontend

cd frontend
npm install

### 4. Veritabanını Başlatın

MongoDB’nin çalıştığından emin olun. (Lokal veya bağlantı adresinizi .env dosyasına yazın.)

### 5. Uygulamayı Başlatın

Backend
npm run dev

Frontend
npm run dev

🔗 Backend Kullanımı
API endpointleri için API_DOCUMENTATION.md ve docs/ klasörüne bakınız.

Testler için:
Seed ve scriptler için scripts/ klasörünü inceleyin.

🎨 Frontend Kullanımı

Geliştirme sunucusu için:
npm run dev

# NOT: Port çakışması olmaması için frontend ve backend ayrı ayrı çalıştırılması önerilir.

### Dizin yapısı
## 📂 Dizin Yapısı

```text
STAJ22001-STAJ22002-Proje/
├── backend/
│   └── ecommerce-backend/
│       ├── src/
│       ├── docs/
│       ├── scripts/
│       └── ...
│
├── frontend/
│   └── ecommerce-frontend/
│       ├── app/
│       ├── components/
│       ├── lib/
│       └── ...

```


```
### 📖 API Dokümantasyonu
Tüm endpointler ve örnek istekler için:
API_DOCUMENTATION.md
openapi.yaml       


### 🤝 Katkıda Bulunma
Fork'layın ve yeni bir branch oluşturun.
Değişikliklerinizi yapın.
Testleri çalıştırın.
Pull request gönderin.
```
