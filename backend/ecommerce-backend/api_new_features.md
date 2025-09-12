# API Yeni Özellikler - Frontend İhtiyaçları

Bu dokümantasyon, frontend uygulamasının düzgün çalışması için backend API'ye eklenmesi gereken endpoint'leri ve özellikler içerir.

## 📋 İçindekiler

1. [Ürün Endpoint'leri](#ürün-endpointleri)
2. [Kategori Endpoint'leri](#kategori-endpointleri)
3. [Kullanıcı Favori Endpoint'leri](#kullanıcı-favori-endpointleri)
4. [Mevcut Endpoint Güncellemeleri](#mevcut-endpoint-güncellemeleri)
5. [Response Formatları](#response-formatları)

---

## 🛍️ Ürün Endpoint'leri

### 1. Öne Çıkan Ürünler
```
GET /api/products/featured
```
**Açıklama:** Ana sayfada gösterilecek öne çıkan ürünleri getirir.

**Query Parametreleri:**
- `limit` (optional): Döndürülecek ürün sayısı (varsayılan: 12)

---

### 2. En Çok Satanlar
```
GET /api/products/bestsellers
```
**Açıklama:** En çok satan ürünleri getirir.

**Query Parametreleri:**
- `limit` (optional): Döndürülecek ürün sayısı (varsayılan: 12)

---

### 3. Yeni Ürünler
```
GET /api/products/new
```
**Açıklama:** Yeni eklenen ürünleri getirir.

**Query Parametreleri:**
- `limit` (optional): Döndürülecek ürün sayısı (varsayılan: 12)

---

### 4. İndirimli Ürünler
```
GET /api/products/discounted
```
**Açıklama:** İndirimli ürünleri getirir.

**Query Parametreleri:**
- `limit` (optional): Döndürülecek ürün sayısı (varsayılan: 12)

---

### 5. Bundle/Set Ürünleri
```
GET /api/products/bundles
```
**Açıklama:** Paket/set ürünlerini getirir.

**Query Parametreleri:**
- `limit` (optional): Döndürülecek ürün sayısı (varsayılan: 12)

---

### 6. Ürün Arama
```
GET /api/products/search
```
**Açıklama:** Ürün arama işlemi yapar.

**Query Parametreleri:**
- `q` (required): Arama terimi
- `page` (optional): Sayfa numarası (varsayılan: 1)
- `limit` (optional): Sayfa başına ürün sayısı (varsayılan: 24)
- `sort` (optional): Sıralama (newest, popular, price_asc, price_desc, rating)

---

### 7. Kategoriye Göre Ürünler
```
GET /api/products/category/:slug
```
**Açıklama:** Belirtilen kategorideki ürünleri getirir.

**URL Parametreleri:**
- `slug` (required): Kategori slug'ı

**Query Parametreleri:**
- `page` (optional): Sayfa numarası (varsayılan: 1)
- `limit` (optional): Sayfa başına ürün sayısı (varsayılan: 24)
- `sort` (optional): Sıralama
- `minPrice` (optional): Minimum fiyat
- `maxPrice` (optional): Maksimum fiyat
- `brand` (optional): Marka filtresi
- `inStock` (optional): Stokta olanlar (true/false)

---

### 8. Markaya Göre Ürünler
```
GET /api/products/brand/:brand
```
**Açıklama:** Belirtilen markadaki ürünleri getirir.

**URL Parametreleri:**
- `brand` (required): Marka adı

**Query Parametreleri:**
- Kategori endpoint'i ile aynı

---

### 9. İlgili Ürünler
```
GET /api/products/:id/related
```
**Açıklama:** Belirtilen ürünle ilgili ürünleri getirir.

**URL Parametreleri:**
- `id` (required): Ürün ID'si

---

### 10. Ürün Yorumları
```
GET /api/products/:id/reviews
```
**Açıklama:** Belirtilen ürünün yorumlarını getirir.

**URL Parametreleri:**
- `id` (required): Ürün ID'si

**Query Parametreleri:**
- `page` (optional): Sayfa numarası (varsayılan: 1)
- `limit` (optional): Sayfa başına yorum sayısı (varsayılan: 10)

---

### 11. Ürün Görüntüleme Takibi
```
POST /api/products/:id/view
```
**Açıklama:** Ürün görüntülenme sayısını artırır (analytics için).

**URL Parametreleri:**
- `id` (required): Ürün ID'si

---

## 📂 Kategori Endpoint'leri

### 1. Tüm Kategoriler
```
GET /api/categories
```
**Açıklama:** Tüm kategorileri getirir.

**Query Parametreleri:**
- `tree` (optional): Hiyerarşik yapıda getir (true/false)
- `level` (optional): Belirli seviyedeki kategoriler (0, 1, 2...)
- `parent` (optional): Alt kategorileri getirmek için parent ID

---

### 2. Kategori Detayı (ID ile)
```
GET /api/categories/:id
```
**Açıklama:** Belirtilen ID'deki kategoriyi getirir.

**URL Parametreleri:**
- `id` (required): Kategori ID'si

---

### 3. Kategori Detayı (Slug ile)
```
GET /api/categories/slug/:slug
```
**Açıklama:** Belirtilen slug'daki kategoriyi getirir.

**URL Parametreleri:**
- `slug` (required): Kategori slug'ı

---

## ❤️ Kullanıcı Favori Endpoint'leri

### 1. Kullanıcının Favorileri
```
GET /api/users/favorites
```
**Açıklama:** Giriş yapmış kullanıcının favori ürünlerini getirir.

**Headers:**
- `Authorization: Bearer <token>` (required)

---

### 2. Favorilere Ekleme
```
POST /api/users/favorites/:productId
```
**Açıklama:** Ürünü kullanıcının favorilerine ekler.

**URL Parametreleri:**
- `productId` (required): Ürün ID'si

**Headers:**
- `Authorization: Bearer <token>` (required)

---

### 3. Favorilerden Çıkarma
```
DELETE /api/users/favorites/:productId
```
**Açıklama:** Ürünü kullanıcının favorilerinden çıkarır.

**URL Parametreleri:**
- `productId` (required): Ürün ID'si

**Headers:**
- `Authorization: Bearer <token>` (required)

---

## 🔄 Mevcut Endpoint Güncellemeleri

### Mevcut `GET /api/products` Endpoint'i

Bu endpoint aşağıdaki query parametrelerini desteklemelidir:

```javascript
{
  // Sayfalama
  page: 1,           // Sayfa numarası
  limit: 24,         // Sayfa başına ürün sayısı
  
  // Sıralama
  sort: 'newest',    // newest, popular, price_asc, price_desc, rating
  
  // Filtreler
  category: 'slug',  // Kategori slug'ı
  brand: 'Arduino',  // Marka adı
  search: 'arduino', // Arama terimi
  minPrice: 50,      // Minimum fiyat
  maxPrice: 500,     // Maksimum fiyat
  inStock: true,     // Stokta olanlar (true/false)
  
  // Özel Filtreler
  featured: true,    // Öne çıkan ürünler
  bestseller: true,  // En çok satanlar
  new: true,         // Yeni ürünler
  discounted: true,  // İndirimli ürünler
  type: 'bundle',    // Ürün tipi (product/bundle)
  
  // Slug bazlı arama (tek ürün için)
  slug: 'arduino-uno-r3' // Ürün slug'ı
}
```

---

## 📝 Response Formatları

### Ürün Listesi Response
```javascript
{
  "success": true,
  "message": "Ürünler başarıyla getirildi",
  "data": {
    "products": [
      {
        "id": "507f1f77bcf86cd799439011",
        "name": "Arduino Uno R3",
        "slug": "arduino-uno-r3",
        "description": "Popüler Arduino geliştirme kartı",
        "shortDescription": "En popüler Arduino kartı",
        "price": 299.99,
        "originalPrice": 349.99,
        "discountPercentage": 14,
        "category": {
          "id": "507f1f77bcf86cd799439012",
          "name": "Geliştirme Kitleri",
          "slug": "gelistirme-kitleri"
        },
        "brand": "Arduino",
        "sku": "ARD-UNO-R3-001",
        "type": "product",
        "images": [
          {
            "url": "/images/arduino-uno.jpg",
            "alt": "Arduino Uno R3",
            "isPrimary": true
          }
        ],
        "stock": {
          "quantity": 25,
          "lowStockThreshold": 5,
          "trackStock": true
        },
        "rating": {
          "average": 4.8,
          "count": 127,
          "distribution": {
            "five": 89,
            "four": 28,
            "three": 7,
            "two": 2,
            "one": 1
          }
        },
        "status": "active",
        "isNew": false,
        "isBestseller": true,
        "isFeatured": true,
        "createdAt": "2024-01-15T10:00:00Z",
        "updatedAt": "2024-01-20T14:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 24,
      "total": 156,
      "totalPages": 7
    },
    "filters": {
      "categories": [
        {
          "id": "507f1f77bcf86cd799439012",
          "name": "Geliştirme Kitleri",
          "slug": "gelistirme-kitleri",
          "productCount": 89
        }
      ],
      "brands": ["Arduino", "Raspberry Pi", "ESP32"],
      "priceRange": { 
        "min": 0, 
        "max": 1000 
      }
    }
  },
  "timestamp": "2024-01-23T10:00:00Z"
}
```

### Tek Ürün Response
```javascript
{
  "success": true,
  "message": "Ürün başarıyla getirildi",
  "data": {
    "product": {
      // Yukarıdaki ürün objesi ile aynı format
      // + ek detaylar (specifications, features, vs.)
    }
  },
  "timestamp": "2024-01-23T10:00:00Z"
}
```

### Kategori Listesi Response
```javascript
{
  "success": true,
  "message": "Kategoriler başarıyla getirildi",
  "data": {
    "categories": [
      {
        "id": "507f1f77bcf86cd799439012",
        "name": "Geliştirme Kitleri",
        "slug": "gelistirme-kitleri",
        "description": "Arduino, Raspberry Pi ve öğrenme kitleri",
        "level": 0,
        "isActive": true,
        "productCount": 89,
        "image": {
          "url": "/images/categories/kits.jpg",
          "alt": "Geliştirme Kitleri"
        }
      }
    ]
  },
  "timestamp": "2024-01-23T10:00:00Z"
}
```

### Favori Listesi Response
```javascript
{
  "success": true,
  "message": "Favoriler başarıyla getirildi",
  "data": {
    "products": [
      // Ürün objelerinin listesi
    ]
  },
  "timestamp": "2024-01-23T10:00:00Z"
}
```

### Hata Response
```javascript
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Ürün bulunamadı"
  },
  "timestamp": "2024-01-23T10:00:00Z"
}
```

---

## 🚀 Öncelik Sırası

Frontend'in çalışması için aşağıdaki sırayla endpoint'lerin eklenmesi önerilir:

1. **Yüksek Öncelik:**
   - `GET /api/products/featured`
   - `GET /api/products/bestsellers`
   - `GET /api/products/new`
   - `GET /api/products` (mevcut endpoint'e filtre desteği)

2. **Orta Öncelik:**
   - `GET /api/categories`
   - `GET /api/categories/slug/:slug`
   - `GET /api/products/category/:slug`

3. **Düşük Öncelik:**
   - `GET /api/products/bundles`
   - `GET /api/products/discounted`
   - `GET /api/users/favorites` ve ilgili endpoint'ler
   - `GET /api/products/:id/related`
   - `POST /api/products/:id/view`

---

## 📋 Notlar

- Tüm endpoint'ler mevcut API yapısına uygun olarak geliştirilmelidir
- Authentication gerektiren endpoint'ler JWT token kontrolü yapmalıdır
- Rate limiting uygulanmalıdır
- Response formatları tutarlı olmalıdır
- Hata durumları uygun HTTP status kodları ile döndürülmelidir
- Pagination büyük veri setleri için uygulanmalıdır 