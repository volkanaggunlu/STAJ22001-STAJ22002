# 🔧 Açık Atölye Admin Panel - EKSİK API ENDPOINT'LER

## 📋 Özet
Admin panel için **21 adet zorunlu API endpoint** eksik tespit edildi. Bu dokümantasyon backend geliştirici için hazırlanmıştır.

---

## 🚨 **ÖNCELİK 1: DASHBOARD ENDPOINT'LERİ**

### 1. Dashboard İstatistikleri
```
GET /api/admin/dashboard/stats
```

**Açıklama**: Admin dashboard'unun ana istatistiklerini döner

**Response Örneği**:
```json
{
  "success": true,
  "data": {
    "totalProducts": 156,
    "totalUsers": 2847,
    "totalOrders": 1234,
    "monthlySales": 124567.50,
    "pageViews": 45678,
    "averageRating": 4.8,
    "trends": {
      "products": "+12 bu ay",
      "users": "+201 bu ay", 
      "orders": "+89 bu hafta",
      "sales": "+₺15,432 bu ay",
      "pageViews": "+3,456 bu hafta",
      "rating": "+0.2"
    }
  }
}
```

**Yetki**: Admin rolü gerekli

---

## 📊 **ÖNCELİK 2: ANALİTİK ENDPOINT'LERİ**

### 2. Satış Analitikleri
```
GET /api/admin/analytics/sales?period=6m
```

**Açıklama**: Chart'lar için satış verilerini döner

**Query Parameters**:
- `period`: 1m, 3m, 6m, 1y (varsayılan: 6m)

**Response Örneği**:
```json
{
  "success": true,
  "data": {
    "salesData": [
      { "month": "Oca", "sales": 45000, "orders": 120, "customers": 89 },
      { "month": "Şub", "sales": 52000, "orders": 135, "customers": 97 },
      { "month": "Mar", "sales": 48000, "orders": 125, "customers": 91 }
    ]
  }
}
```

### 3. Kategori Dağılımı
```
GET /api/admin/analytics/categories
```

**Açıklama**: Pie chart için kategori dağılım verileri

**Response Örneği**:
```json
{
  "success": true,
  "data": {
    "distribution": [
      { "categoryName": "Arduino", "percentage": 35, "sales": 15000, "color": "#3b82f6" },
      { "categoryName": "Raspberry Pi", "percentage": 25, "sales": 10750, "color": "#ef4444" },
      { "categoryName": "Sensörler", "percentage": 20, "sales": 8600, "color": "#10b981" }
    ]
  }
}
```

---

## 👥 **ÖNCELİK 3: KULLANICI YÖNETİMİ**

### 4. Admin Kullanıcı Listesi
```
GET /api/admin/users?page=1&limit=10&search=&role=&status=
```

**Query Parameters**:
- `page`: Sayfa numarası (varsayılan: 1)
- `limit`: Sayfa başına kayıt (varsayılan: 10, max: 100)
- `search`: Kullanıcı adı/email arama
- `role`: user, admin, moderator
- `status`: active, inactive, banned

**Response Örneği**:
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user_123",
        "name": "Ahmet",
        "surname": "Yılmaz", 
        "email": "ahmet@email.com",
        "role": "user",
        "status": "active",
        "createdAt": "2024-01-15T10:30:00Z",
        "lastLogin": "2024-01-20T14:45:00Z",
        "orderCount": 5,
        "totalSpent": 1299.99
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 2847,
      "totalPages": 285
    }
  }
}
```

### 5. Kullanıcı Rol Değiştirme
```
PUT /api/admin/users/:id/role
```

**Request Body**:
```json
{
  "role": "admin"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Kullanıcı rolü başarıyla güncellendi",
  "data": {
    "userId": "user_123",
    "newRole": "admin"
  }
}
```

### 6. Kullanıcı Deaktifleştirme
```
PUT /api/admin/users/:id/deactivate
```

**Request Body**:
```json
{
  "reason": "Spam aktivite",
  "duration": "permanent"
}
```

---

## 📦 **ÖNCELİK 4: ÜRÜN YÖNETİMİ**

### 7. En Çok Satan Ürünler
```
GET /api/admin/products/top-selling?limit=5
```

**Query Parameters**:
- `limit`: Döndürülecek ürün sayısı (varsayılan: 5)

**Response Örneği**:
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "prod_123",
        "name": "Arduino UNO R3",
        "salesCount": 45,
        "revenue": 13495.55,
        "trend": "+12%",
        "image": "/uploads/arduino-uno.jpg"
      }
    ]
  }
}
```

### 8. Ürün Oluşturma
```
POST /api/admin/products
```

**Request Body**:
```json
{
  "name": "Arduino UNO R4",
  "description": "Yeni nesil Arduino",
  "price": 299.99,
  "costPrice": 180.00,
  "categoryId": "cat_123",
  "brandId": "brand_456",
  "sku": "ARD-UNO-R4",
  "stock": 50,
  "images": ["/uploads/arduino-r4-1.jpg"],
  "specifications": {
    "processor": "ARM Cortex-M4",
    "memory": "256KB"
  },
  "tags": ["arduino", "microcontroller"],
  "status": "active",
  "featured": false,
  "seoTitle": "Arduino UNO R4 - Açık Atölye",
  "seoDescription": "Arduino UNO R4 microcontroller board"
}
```

### 9. Ürün Güncelleme
```
PUT /api/admin/products/:id
```

**Request Body**: Yukarıdaki ile aynı format

### 10. Ürün Status Değiştirme ⭐ YENİ
```
PUT /api/admin/products/:id/status
```

**Açıklama**: Ürün durumunu değiştirir (active, inactive, discontinued)

**Request Body**:
```json
{
  "status": "active"
}
```

**Geçerli Status Değerleri**:
- `active`: Aktif ürün (satışta)
- `inactive`: Pasif ürün (geçici olarak satışta değil)
- `discontinued`: Üretimi durmuş ürün

**Response**:
```json
{
  "success": true,
  "message": "Ürün durumu başarıyla güncellendi",
  "data": {
    "productId": "prod_123",
    "oldStatus": "inactive",
    "newStatus": "active"
  }
}
```

**Önemli Not**: 
- Product model'inde `status` field'ı kullanılıyor, `isActive` değil
- Query'lerde aktif ürünler için: `status: { $ne: 'discontinued' }` 
- Discontinued ürünler soft delete sayılır

### 11. Ürün Silme
```
DELETE /api/admin/products/:id
```

**Response**:
```json
{
  "success": true,
  "message": "Ürün başarıyla silindi"
}
```

---

## 📋 **ÖNCELİK 5: SİPARİŞ YÖNETİMİ**

### 12. Son Siparişler (Dashboard için)
```
GET /api/admin/orders?limit=5&sort=createdAt:desc
```

**Response Örneği**:
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "ord_123",
        "customerName": "Ahmet Yılmaz",
        "customerEmail": "ahmet@email.com",
        "totalAmount": 299.99,
        "status": "completed",
        "createdAt": "2024-01-15T10:30:00Z",
        "items": [
          {
            "productName": "Arduino UNO R3",
            "quantity": 1,
            "price": 299.99
          }
        ]
      }
    ]
  }
}
```

### 13. Kargo Takip Numarası Ekleme
```
PUT /api/admin/orders/:id/tracking
```

**Request Body**:
```json
{
  "trackingNumber": "YK123456789TR",
  "carrier": "Yurtiçi Kargo",
  "trackingUrl": "https://www.yurtici.com.tr/tr/takip"
}
```

---

## 🗂️ **ÖNCELİK 6: KATEGORİ YÖNETİMİ**

### 14. Admin Kategori Listesi
```
GET /api/admin/categories
```

**Response Örneği**:
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "cat_123",
        "name": "Arduino",
        "slug": "arduino",
        "parentId": null,
        "description": "Arduino ürünleri",
        "image": "/uploads/arduino-category.jpg",
        "productCount": 45,
        "status": "active",
        "sortOrder": 1,
        "seoTitle": "Arduino Ürünleri",
        "children": [
          {
            "id": "cat_124",
            "name": "Arduino Kartları",
            "productCount": 23
          }
        ]
      }
    ]
  }
}
```

### 15. Kategori Oluşturma
```
POST /api/admin/categories
```

**Request Body**:
```json
{
  "name": "ESP32",
  "slug": "esp32",
  "parentId": "cat_123",
  "description": "ESP32 modülleri ve kartları",
  "image": "/uploads/esp32-category.jpg",
  "seoTitle": "ESP32 Ürünleri - Açık Atölye",
  "seoDescription": "ESP32 WiFi ve Bluetooth modülleri",
  "status": "active",
  "sortOrder": 5
}
```

### 16. Kategori Güncelleme
```
PUT /api/admin/categories/:id
```

### 17. Kategori Silme (Soft Delete)
```
DELETE /api/admin/categories/:id
```

---

## ⭐ **ÖNCELİK 7: YORUM YÖNETİMİ**

### 18. Admin Yorum Listesi
```
GET /api/admin/reviews?page=1&limit=10&status=pending
```

**Query Parameters**:
- `status`: pending, approved, rejected
- `productId`: Belirli ürün yorumları
- `rating`: 1-5 arası puan filtresi

**Response Örneği**:
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": "rev_123",
        "productId": "prod_456",
        "productName": "Arduino UNO R3",
        "userId": "user_789",
        "userName": "Ahmet Yılmaz",
        "rating": 5,
        "title": "Mükemmel ürün",
        "comment": "Çok kaliteli, hızlı kargo",
        "status": "pending",
        "createdAt": "2024-01-15T10:30:00Z",
        "images": ["/uploads/review-1.jpg"]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 234
    }
  }
}
```

### 19. Yorum Onaylama
```
PUT /api/admin/reviews/:id/approve
```

### 20. Yorum Reddetme
```
PUT /api/admin/reviews/:id/reject
```

**Request Body**:
```json
{
  "reason": "Uygunsuz içerik"
}
```

---

## 💳 **ÖNCELİK 8: ÖDEME YÖNETİMİ**

### 21. Admin Ödeme Listesi
```
GET /api/admin/payments?page=1&limit=10&status=&method=
```

**Query Parameters**:
- `status`: pending, completed, failed, refunded
- `method`: paytr, bank_transfer
- `dateFrom`, `dateTo`: Tarih aralığı

**Response Örneği**:
```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "id": "pay_123",
        "orderId": "ord_456", 
        "amount": 299.99,
        "method": "bank_transfer",
        "status": "pending",
        "customerName": "Ahmet Yılmaz",
        "createdAt": "2024-01-15T10:30:00Z",
        "bankTransferDetails": {
          "senderName": "Ahmet Yılmaz",
          "amount": 299.99,
          "receiptImage": "/uploads/receipt-123.jpg"
        }
      }
    ]
  }
}
```

### 22. Havale/EFT Onaylama
```
PUT /api/admin/payments/:id/approve
```

**Request Body**:
```json
{
  "approvedAmount": 299.99,
  "note": "Dekont kontrol edildi, onaylandı"
}
```

---

## 📤 **ÖNCELİK 9: DOSYA YÜKLEME**

### 23. Ürün Resmi Yükleme
```
POST /api/admin/upload/product-images
```

**Content-Type**: `multipart/form-data`

**Form Fields**:
- `images`: File[] (multiple files)
- `productId`: String (opsiyonel)

**Response Örneği**:
```json
{
  "success": true,
  "data": {
    "uploadedFiles": [
      {
        "originalName": "arduino-uno.jpg",
        "filename": "prod_123_1642234567_arduino-uno.jpg",
        "url": "/uploads/products/prod_123_1642234567_arduino-uno.jpg",
        "size": 245760,
        "mimetype": "image/jpeg"
      }
    ]
  }
}
```

---

## 🔐 **OTORITE VE GÜVENLİK**

### Header Requirements
Tüm admin endpoint'leri için:
```
Authorization: Bearer {admin_jwt_token}
Content-Type: application/json
```

### Yetki Kontrolü
- Sadece `role: 'admin'` olan kullanıcılar erişebilir
- Invalid token durumunda `401 Unauthorized`
- Yetkisiz erişimde `403 Forbidden`

### Rate Limiting
- Admin endpoint'leri için: 100 request/15 dakika
- Upload endpoint'leri için: 20 request/dakika

---

## 🚀 **IMPLEMENTATION NOTES**

### Öncelik Sırası
1. **Dashboard + Analytics** (En kritik - UI çalışabilir olması için)
2. **Kullanıcı Yönetimi** (Admin panel temel işlevsellik)
3. **Ürün Yönetimi** (CRUD operations)
4. **Sipariş Takibi** (Business kritik)
5. **Kategori, Yorum, Ödeme** (İkincil özellikler)

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Geçersiz veri gönderildi",
    "details": {
      "name": ["Ürün adı zorunludur"],
      "price": ["Fiyat 0'dan büyük olmalıdır"]
    }
  }
}
```

### Pagination Standard
```json
{
  "page": 1,
  "limit": 10,
  "total": 2847,
  "totalPages": 285,
  "hasNext": true,
  "hasPrev": false
}
```

### Product Status Handling ⭐ ÖNEMLİ
```javascript
// Aktif ürünleri getirmek için
const activeProducts = await Product.find({ 
  status: { $ne: 'discontinued' } 
});

// Status değerleri
const PRODUCT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive', 
  DISCONTINUED: 'discontinued'
};
```

---

## 📝 **TODO for Backend Developer**

1. ✅ Bu endpoint'leri Route Handler pattern ile implement edin
2. ✅ Database schema'larını kontrol edin (users, products, orders, etc.)
3. ✅ Admin middleware için JWT token validation ekleyin
4. ✅ File upload için multer veya benzeri konfigüre edin
5. ✅ Error handling middleware ekleyin
6. ✅ API rate limiting implementasyonu
7. ✅ Validation schema'ları (Joi, Zod vs.)
8. ✅ Database migration'lar varsa çalıştırın
9. ⭐ **YENİ**: Product model'de status field'ının doğru kullanımını kontrol et

---

**Son Güncelleme**: 15 Ocak 2024  
**Durum**: Backend geliştirici için hazır 🚀  
**Yeni Eklenen**: Ürün Status değiştirme endpoint'i eklendi 