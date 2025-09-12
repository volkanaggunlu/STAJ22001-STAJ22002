# 🛠️ Admin Panel API Dokümantasyonu

## 📋 Genel Bilgiler

### 🔧 Teknoloji Stack
- **Backend Framework:** Express.js + Node.js
- **Veritabanı:** MongoDB (Mongoose ODM)
- **Authentication:** JWT Token
- **File Upload:** Multer
- **Rate Limiting:** Express-rate-limit
- **Logging:** Winston

### 🔐 Kimlik Doğrulama
Tüm admin endpoint'leri `auth` ve `admin` middleware'leri gerektir:
```javascript
Headers: {
  "Authorization": "Bearer YOUR_JWT_TOKEN",
  "Content-Type": "application/json"
}
```

### 🌐 Base URL
```
Production: https://api.yourdomain.com
Development: http://localhost:3000
```

---

## 📊 1. DASHBOARD & ANALYTİCS

### Dashboard İstatistikleri
```http
GET /api/admin/dashboard?startDate=2024-01-01&endDate=2024-12-31
```

**Response Data:**
```json
{
  "success": true,
  "data": {
    "salesStats": {
      "totalSales": 125000.50,
      "totalOrders": 450,
      "averageOrderValue": 277.78
    },
    "dailySales": [
      {
        "_id": "2024-01-01",
        "sales": 1250.00,
        "orders": 5
      }
    ],
    "topProducts": [
      {
        "_id": "product_id",
        "name": "Arduino Uno R3",
        "totalQuantity": 125,
        "totalRevenue": 3750.00,
        "price": 30.00,
        "stock": { "quantity": 45 }
      }
    ],
    "userStats": {
      "totalUsers": 1250,
      "newUsers": 85,
      "activeUsers": 234
    },
    "inventoryStats": {
      "totalProducts": 150,
      "lowStockProducts": 12,
      "outOfStockProducts": 3
    },
    "orderStatusDistribution": [
      { "_id": "pending", "count": 25 },
      { "_id": "shipped", "count": 180 },
      { "_id": "delivered", "count": 200 }
    ]
  }
}
```

---

## 👥 2. KULLANICI YÖNETİMİ

### Tüm Kullanıcıları Listele
```http
GET /api/admin/users?page=1&limit=20&search=john&role=user&isActive=true
```

### Kullanıcı Detayı
```http
GET /api/admin/users/:userId
```

### Kullanıcı Oluştur
```http
POST /api/admin/users
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "123456",
  "phone": "+90 555 123 45 67",
  "birthDate": "1990-01-01",
  "gender": "male",
  "role": "user",
  "isActive": true
}
```

### Kullanıcı Güncelle
```http
PUT /api/admin/users/:userId
Content-Type: application/json

{
  "firstName": "John Updated",
  "isActive": false,
  "role": "admin"
}
```

### Kullanıcı Sil
```http
DELETE /api/admin/users/:userId
```

### Kullanıcı İstatistikleri
```http
GET /api/admin/users/:userId/stats
```

**User Model Fields:**
- `firstName`, `lastName`, `email`, `phone`
- `birthDate`, `gender`, `role` (user/admin)
- `isVerified`, `isActive`, `totalOrders`, `totalSpent`
- `addresses[]`, `favorites[]`, `lastLogin`

---

## 🛍️ 3. ÜRÜN YÖNETİMİ

### Tüm Ürünleri Listele
```http
GET /api/admin/products?page=1&limit=20&search=arduino&category=elektronik&stock=low
```

### Ürün Detayı
```http
GET /api/products/:productId
```

### Ürün Oluştur
```http
POST /api/products
Content-Type: multipart/form-data

{
  "name": "Arduino Uno R3 Original",
  "description": "Orijinal Arduino Uno R3 geliştirme kartı",
  "shortDescription": "Arduino başlangıç seti ideal",
  "price": 299.99,
  "originalPrice": 349.99,
  "category": "category_id",
  "brand": "Arduino",
  "sku": "ARD-UNO-R3-001",
  "type": "product",
  "stock": {
    "quantity": 50,
    "lowStockThreshold": 5,
    "trackStock": true
  },
  "specifications": [
    { "key": "Mikrodenetleyici", "value": "ATmega328P" },
    { "key": "İşletim Voltajı", "value": "5V" }
  ],
  "features": ["USB Bağlantı", "14 Dijital Pin", "6 Analog Giriş"],
  "seo": {
    "title": "Arduino Uno R3 - Orijinal Geliştirme Kartı",
    "description": "Arduino Uno R3 orijinal geliştirme kartı...",
    "keywords": ["arduino", "uno", "r3", "mikrodenetleyici"]
  },
  "images": [FILE_UPLOADS]
}
```

### Ürün Güncelle
```http
PUT /api/products/:productId
Content-Type: multipart/form-data
```

### Ürün Sil
```http
DELETE /api/products/:productId
```

### Stok Güncelle
```http
PUT /api/admin/products/:productId/stock
Content-Type: application/json

{
  "quantity": 25,
  "operation": "set" // "add", "subtract", "set"
}
```

### Toplu Ürün İşlemleri
```http
POST /api/admin/products/bulk
Content-Type: application/json

{
  "action": "updateStock", // "delete", "updatePrice", "updateStatus"
  "productIds": ["id1", "id2", "id3"],
  "data": {
    "quantity": 10,
    "operation": "add"
  }
}
```

**Product Model Fields:**
- `name`, `slug`, `description`, `shortDescription`
- `price`, `originalPrice`, `discountPercentage`
- `category`, `subCategories[]`, `brand`, `sku`
- `images[]` (url, alt, isPrimary)
- `stock` (quantity, lowStockThreshold, trackStock)
- `specifications[]`, `features[]`
- `type` (product/bundle), `bundleItems[]`
- `seo` (title, description, keywords)
- `rating`, `views`, `sales`, `isActive`, `isFeatured`

---

## 📂 4. KATEGORİ YÖNETİMİ

### Tüm Kategorileri Listele (Hiyerarşik)
```http
GET /api/categories
```

### Kategori Detayı
```http
GET /api/categories/:categoryId
```

### Kategori Oluştur
```http
POST /api/categories
Content-Type: multipart/form-data

{
  "name": "Mikrodenetleyiciler",
  "description": "Arduino, Raspberry Pi ve diğer geliştirme kartları",
  "parent": "parent_category_id", // null for root category
  "image": FILE_UPLOAD,
  "icon": "microchip",
  "seo": {
    "title": "Mikrodenetleyici Kartları",
    "description": "Arduino, Raspberry Pi geliştirme kartları",
    "keywords": ["arduino", "raspberry", "mikrodenetleyici"]
  },
  "isActive": true,
  "isVisible": true,
  "isFeatured": false,
  "showInMenu": true,
  "sortOrder": 1
}
```

### Kategori Güncelle
```http
PUT /api/categories/:categoryId
Content-Type: multipart/form-data
```

### Kategori Sil
```http
DELETE /api/categories/:categoryId
```

### Kategori Sıralaması Güncelle
```http
PUT /api/admin/categories/sort
Content-Type: application/json

{
  "categories": [
    { "id": "cat1", "sortOrder": 1 },
    { "id": "cat2", "sortOrder": 2 }
  ]
}
```

**Category Model Fields:**
- `name`, `slug`, `description`, `parent`, `children[]`
- `level`, `image`, `icon`
- `seo` (title, description, keywords)
- `isActive`, `isVisible`, `isFeatured`
- `showInMenu`, `showInFooter`, `sortOrder`
- `stats` (productCount, totalSales, viewCount)

---

## 📦 5. SİPARİŞ YÖNETİMİ

### Tüm Siparişleri Listele
```http
GET /api/admin/orders?page=1&limit=20&status=pending&search=ORD001
```

### Sipariş Detayı
```http
GET /api/orders/:orderId
```

### Sipariş Durumu Güncelle
```http
PUT /api/admin/orders/:orderId/status
Content-Type: application/json

{
  "status": "shipped", // pending, confirmed, processing, shipped, delivered, cancelled, returned
  "note": "Kargo şirketi: Aras Kargo"
}
```

### Kargo Takip Numarası Ekle
```http
POST /api/admin/orders/:orderId/tracking
Content-Type: application/json

{
  "trackingNumber": "1234567890",
  "carrier": "Aras Kargo"
}
```

### Sipariş İptali/İade
```http
POST /api/admin/orders/:orderId/cancel
Content-Type: application/json

{
  "reason": "Stok yetersizliği",
  "refundAmount": 299.99,
  "refundMethod": "bank_transfer"
}
```

### Toplu Sipariş İşlemleri
```http
POST /api/admin/orders/bulk
Content-Type: application/json

{
  "action": "updateStatus",
  "orderIds": ["order1", "order2"],
  "data": {
    "status": "processing"
  }
}
```

**Order Model Fields:**
- `orderNumber`, `userId`, `items[]`
- `totalItems`, `subtotal`, `shippingCost`, `taxAmount`
- `discountAmount`, `totalAmount`, `currency`
- `status`, `statusHistory[]`
- `shippingAddress`, `billingAddress`
- `shippingMethod`, `tracking`
- `paymentMethod`, `paymentStatus`

---

## 🎫 6. KUPON YÖNETİMİ

### Tüm Kuponları Listele
```http
GET /api/admin/coupons?page=1&limit=20&type=percentage&isActive=true
```

### Kupon Oluştur
```http
POST /api/coupons
Content-Type: application/json

{
  "code": "WELCOME20",
  "name": "Hoş Geldin İndirimi",
  "description": "Yeni üyelere özel %20 indirim",
  "type": "percentage", // "percentage" or "fixed"
  "value": 20,
  "minOrderAmount": 100,
  "maxDiscountAmount": 50,
  "usageLimit": 100,
  "usageLimitPerUser": 1,
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-12-31T23:59:59.999Z",
  "applicableCategories": ["category_id1"],
  "userGroups": ["new"],
  "isActive": true,
  "isPublic": true,
  "couponType": "first-order",
  "autoApply": false
}
```

### Kupon Güncelle
```http
PUT /api/admin/coupons/:couponId
```

### Kupon Sil
```http
DELETE /api/admin/coupons/:couponId
```

### Kupon İstatistikleri
```http
GET /api/admin/coupons/:couponId/stats
```

**Coupon Model Fields:**
- `code`, `name`, `description`, `type`, `value`
- `minOrderAmount`, `maxDiscountAmount`
- `usageLimit`, `usageLimitPerUser`, `usedCount`
- `startDate`, `endDate`
- `applicableProducts[]`, `applicableCategories[]`
- `userGroups[]`, `isActive`, `couponType`
- `stats`, `usageHistory[]`

---

## ⭐ 7. DEĞERLENDİRME YÖNETİMİ

### Tüm Değerlendirmeleri Listele
```http
GET /api/admin/reviews?page=1&limit=20&rating=5&status=pending
```

### Değerlendirme Detayı
```http
GET /api/admin/reviews/:reviewId
```

### Değerlendirme Onayla/Reddet
```http
PUT /api/admin/reviews/:reviewId/status
Content-Type: application/json

{
  "status": "approved", // "approved", "rejected", "pending"
  "adminNote": "İncelendi ve onaylandı"
}
```

### Değerlendirme Sil
```http
DELETE /api/admin/reviews/:reviewId
```

### Toplu Değerlendirme İşlemleri
```http
POST /api/admin/reviews/bulk
Content-Type: application/json

{
  "action": "approve",
  "reviewIds": ["review1", "review2"]
}
```

---

## 💳 8. ÖDEME YÖNETİMİ

### Ödemeleri Listele
```http
GET /api/admin/payments?page=1&limit=20&status=completed&method=paytr
```

### Ödeme Detayı
```http
GET /api/admin/payments/:paymentId
```

### İade İşlemi
```http
POST /api/payments/:paymentId/refund
Content-Type: application/json

{
  "amount": 299.99,
  "reason": "Ürün iadesi",
  "refundMethod": "original" // "original", "bank_transfer"
}
```

### Ödeme İstatistikleri
```http
GET /api/admin/payments/stats?startDate=2024-01-01&endDate=2024-12-31
```

---

## 🚚 9. KARGO YÖNETİMİ

### Kargo Gönderilerini Listele
```http
GET /api/admin/shipping?page=1&limit=20&status=pending&carrier=aras
```

### Yeni Kargo Gönderi Oluştur
```http
POST /api/shipping/create
Content-Type: application/json

{
  "orderId": "order_id",
  "carrier": "aras",
  "serviceType": "standard",
  "recipientInfo": {
    "name": "John Doe",
    "phone": "+90 555 123 45 67",
    "address": "Adres bilgisi",
    "city": "İstanbul",
    "district": "Kadıköy"
  },
  "packageInfo": {
    "weight": 0.5,
    "dimensions": { "length": 20, "width": 15, "height": 5 },
    "content": "Elektronik ürün"
  }
}
```

### Kargo Etiketi Oluştur
```http
POST /api/shipping/label/:shipmentId
```

### Kargo Durumu Güncelle
```http
PUT /api/track/:trackId
Content-Type: application/json

{
  "status": "in_transit",
  "location": "İstanbul Merkez",
  "description": "Kargo yolda"
}
```

---

## 📈 10. RAPORLAR VE ANALYTİK

### Satış Raporu
```http
GET /api/admin/reports/sales?startDate=2024-01-01&endDate=2024-12-31&groupBy=day
```

### Ürün Performans Raporu
```http
GET /api/admin/reports/products?limit=20&sortBy=sales&period=30days
```

### Müşteri Analiz Raporu
```http
GET /api/admin/reports/customers?type=new&startDate=2024-01-01
```

### Stok Raporu
```http
GET /api/admin/reports/inventory?status=low_stock&category=elektronik
```

### Kategoriler İçin Analitik
```http
GET /api/admin/reports/categories?metric=sales&period=month
```

---

## 🔧 11. SİSTEM YÖNETİMİ

### Sistem Ayarları
```http
GET /api/admin/settings
PUT /api/admin/settings
```

### Cache Yönetimi
```http
POST /api/admin/cache/clear
GET /api/admin/cache/stats
```

### Log Görüntüleme
```http
GET /api/admin/logs?level=error&date=2024-01-01&page=1
```

### Backup İşlemleri
```http
POST /api/admin/backup/create
GET /api/admin/backup/list
POST /api/admin/backup/restore/:backupId
```

---

## 📱 12. RESPONSIVE DESIGN İÇİN ENDPOINT'LER

### Dashboard Widget'ları (Mobile)
```http
GET /api/admin/dashboard/widgets?widgets=sales,orders,users
```

### Hızlı İstatistikler
```http
GET /api/admin/quick-stats
```

### Son Aktiviteler
```http
GET /api/admin/recent-activities?limit=10
```

---

## 🚨 13. ERROR HANDLING

### Standard Error Response
```json
{
  "success": false,
  "error": "Kullanıcı bulunamadı",
  "code": "USER_NOT_FOUND",
  "details": {
    "field": "userId",
    "value": "invalid_id"
  }
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden (Admin access required)
- `404` - Not Found
- `409` - Conflict (Duplicate data)
- `422` - Validation Error
- `500` - Internal Server Error

---

## 🔐 14. GÜVENLİK

### Rate Limiting
- Admin endpoint'leri: 100 request/15 min
- Upload endpoint'leri: 10 request/5 min

### Input Validation
- Tüm input'lar Joi ile validate edilir
- File upload'lar kontrol edilir (tip, boyut)
- SQL Injection ve XSS koruması

### Authorization
- JWT token gerekli
- Admin rolü kontrolü
- Resource ownership kontrolü

---

## 🧪 15. TEST ENDPOINT'LERİ

### Health Check
```http
GET /api/health
```

### Database Connection Test
```http
GET /api/admin/test/db
```

### Email Service Test
```http
POST /api/admin/test/email
Content-Type: application/json

{
  "to": "test@example.com",
  "subject": "Test Email"
}
```

---

## 📝 NOTLAR

1. **Pagination:** Tüm listeleme endpoint'leri pagination destekler
2. **Search:** Çoğu endpoint arama parametresi kabul eder
3. **Filtering:** Status, tarih aralığı, kategori gibi filtreler mevcuttur
4. **File Upload:** Ürün ve kategori resimlerinde Multer kullanılır
5. **Real-time:** WebSocket desteği admin dashboard için eklenebilir
6. **Export:** Excel/PDF export endpoint'leri eklenebilir
7. **Bulk Operations:** Toplu işlemler performans için önemlidir
8. **Caching:** Redis kullanarak response'lar cache'lenebilir

Bu dokümantasyon admin panel frontend geliştirmeniz için gerekli tüm endpoint'leri ve veri yapılarını içermektedir. Her endpoint için gerekli authentication ve validation kuralları mevcuttur. 