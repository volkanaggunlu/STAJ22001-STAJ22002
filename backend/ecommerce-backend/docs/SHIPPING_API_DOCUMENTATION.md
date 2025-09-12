# 🚚 Kargo API Dokümantasyonu

## 📋 İçindekiler
1. [Genel Bilgiler](#genel-bilgiler)
2. [Kargo Seçenekleri API'si](#kargo-seçenekleri-apis)
3. [Kargo Takip API'si](#kargo-takip-apis)
4. [Admin Kargo Yönetimi API'si](#admin-kargo-yönetimi-apis)
5. [Hata Kodları](#hata-kodları)
6. [Örnek Kullanımlar](#örnek-kullanımlar)

---

## 🎯 Genel Bilgiler

### Base URL
```
https://api.example.com/api/shipping
```

### Authentication
- **Public Endpoints:** Kargo seçenekleri ve takip bilgileri
- **Private Endpoints:** Admin kargo yönetimi (Bearer Token gerekli)

### Response Format
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "timestamp": "2024-08-01T08:30:00.000Z"
}
```

---

## 🛒 Kargo Seçenekleri API'si

### 1. Kargo Seçeneklerini Getir

**Endpoint:** `GET /api/shipping/options`

**Query Parameters:**
- `orderAmount` (number, required): Sipariş tutarı
- `city` (string, optional): Şehir adı

**Response:**
```json
{
  "success": true,
  "data": {
    "options": [
      {
        "value": "standard",
        "label": "Standart Kargo",
        "description": "2-3 iş günü içinde teslimat",
        "cost": 29.90,
        "freeLimit": 500,
        "estimatedDays": "2-3 gün",
        "carrier": "aras",
        "trackingUrl": "https://www.araskargo.com.tr/tr/cargo-tracking?code={trackingNumber}",
        "isFree": false
      },
      {
        "value": "express",
        "label": "Hızlı Kargo",
        "description": "1-2 iş günü içinde teslimat",
        "cost": 49.90,
        "freeLimit": 1000,
        "estimatedDays": "1-2 gün",
        "carrier": "yurtici",
        "trackingUrl": "https://www.yurticikargo.com/tr/cargo-tracking?code={trackingNumber}",
        "isFree": false
      },
      {
        "value": "free",
        "label": "Ücretsiz Kargo",
        "description": "500 TL üzeri ücretsiz kargo",
        "cost": 0,
        "freeLimit": 500,
        "estimatedDays": "3-5 gün",
        "carrier": "mng",
        "trackingUrl": "https://www.mngkargo.com.tr/tr/cargo-tracking?code={trackingNumber}",
        "isFree": true
      }
    ]
  },
  "timestamp": "2024-08-01T08:30:00.000Z"
}
```

**Örnek Kullanım:**
```javascript
const response = await fetch('/api/shipping/options?orderAmount=750&city=İstanbul');
const data = await response.json();
console.log(data.data.options);
```

### 2. Belirli Kargo Seçeneğini Getir

**Endpoint:** `GET /api/shipping/options/:value`

**Path Parameters:**
- `value` (string, required): Kargo seçeneği değeri

**Query Parameters:**
- `orderAmount` (number, optional): Sipariş tutarı

**Response:**
```json
{
  "success": true,
  "data": {
    "option": {
      "value": "standard",
      "label": "Standart Kargo",
      "description": "2-3 iş günü içinde teslimat",
      "cost": 29.90,
      "freeLimit": 500,
      "estimatedDays": "2-3 gün",
      "carrier": "aras",
      "trackingUrl": "https://www.araskargo.com.tr/tr/cargo-tracking?code={trackingNumber}",
      "isFree": false
    }
  },
  "timestamp": "2024-08-01T08:30:00.000Z"
}
```

---

## 📦 Kargo Takip API'si

### 1. Kargo Takip Bilgisi Al

**Endpoint:** `GET /api/shipping/tracking/:trackingNumber`

**Path Parameters:**
- `trackingNumber` (string, required): Kargo takip numarası

**Response:**
```json
{
  "success": true,
  "data": {
    "trackingNumber": "TRK123456789",
    "carrier": "aras",
    "status": "in_transit",
    "estimatedDelivery": "2024-08-03T10:00:00.000Z",
    "actualDelivery": null,
    "events": [
      {
        "status": "created",
        "description": "Kargo kaydı oluşturuldu",
        "location": "İstanbul",
        "timestamp": "2024-08-01T08:30:00.000Z"
      },
      {
        "status": "picked_up",
        "description": "Kargo teslim alındı",
        "location": "İstanbul",
        "timestamp": "2024-08-01T14:00:00.000Z"
      },
      {
        "status": "in_transit",
        "description": "Kargo yolda",
        "location": "Ankara",
        "timestamp": "2024-08-02T09:00:00.000Z"
      }
    ]
  },
  "timestamp": "2024-08-01T08:30:00.000Z"
}
```

**Kargo Durumları:**
- `created`: Kargo kaydı oluşturuldu
- `picked_up`: Kargo teslim alındı
- `in_transit`: Kargo yolda
- `out_for_delivery`: Dağıtıma çıktı
- `delivered`: Teslim edildi
- `failed_delivery`: Teslimat başarısız
- `returned`: İade edildi

**Örnek Kullanım:**
```javascript
const response = await fetch('/api/shipping/tracking/TRK123456789');
const data = await response.json();
console.log(data.data.events);
```

---

## 👨‍💼 Admin Kargo Yönetimi API'si

### 1. Admin Sipariş Listesi

**Endpoint:** `GET /api/admin/orders`

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `page` (number, optional): Sayfa numarası (default: 1)
- `limit` (number, optional): Sayfa başına kayıt (default: 10)
- `status` (string, optional): Sipariş durumu filtresi
- `search` (string, optional): Arama terimi

**Response:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "_id": "6889fa33f227f17f3876ad4c",
        "orderNumber": "ORD-20250730-947400",
        "userId": {
          "_id": "686b84e52f0f3d0c364be5dd",
          "firstName": "osmanAdmin",
          "lastName": "canAdmin",
          "email": "cnosman14043@gmail.com"
        },
        "status": "confirmed",
        "totalAmount": 309.80,
        "tracking": {
          "trackingNumber": "TRK123456789",
          "carrier": "aras",
          "estimatedDelivery": "2024-08-04T08:30:37.885Z"
        },
        "createdAt": "2025-07-30T10:55:47.400Z",
        "updatedAt": "2025-08-01T08:30:37.891Z"
      }
    ],
    "total": 20,
    "page": 1,
    "totalPages": 4
  }
}
```

### 2. Admin Sipariş Detayı

**Endpoint:** `GET /api/admin/orders/:id`

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "6889fa33f227f17f3876ad4c",
    "orderNumber": "ORD-20250730-947400",
    "userId": {
      "_id": "686b84e52f0f3d0c364be5dd",
      "firstName": "osmanAdmin",
      "lastName": "canAdmin",
      "email": "cnosman14043@gmail.com"
    },
    "status": "confirmed",
    "customerType": "bireysel",
    "paymentMethod": "credit-card",
    "shippingType": "standart",
    "createdAt": "2025-07-30T10:55:47.400Z",
    "updatedAt": "2025-08-01T08:30:37.891Z",
    "items": [
      {
        "productId": "686c0a685d35c600136472f4",
        "productName": "Arduino UNO R3 Geliştirme Kartı",
        "image": "http://localhost:8080/api/uploads/products/1752669689798_po4ldcnqnb8.jpg",
        "price": 349.9,
        "originalPrice": 399.9,
        "quantity": 1,
        "sku": "ARD-UNO-R3",
        "type": "product",
        "bundledProducts": []
      }
    ],
    "shippingAddress": {
      "title": "Ev",
      "firstName": "Test",
      "lastName": "User",
      "address": "Test Adres",
      "city": "İstanbul",
      "district": "Kadıköy",
      "postalCode": "34700",
      "phone": "+905551234567"
    },
    "billingAddress": {
      "firstName": "Test",
      "lastName": "User",
      "email": "test@example.com",
      "phone": "+905551234567",
      "address": "Test Adres",
      "city": "İstanbul",
      "district": "Kadıköy",
      "postalCode": "34700"
    },
    "subtotal": 349.9,
    "shippingCost": 29.9,
    "taxAmount": 0,
    "couponDiscount": 0,
    "campaignDiscount": 70,
    "totalAmount": 309.80,
    "notes": {},
    "tracking": {
      "trackingNumber": "TRK123456789",
      "carrier": "aras",
      "trackingUrl": "https://www.araskargo.com.tr/tr/cargo-tracking?code=TRK123456789",
      "estimatedDelivery": "2024-08-04T08:30:37.885Z"
    },
    "statusHistory": [
      {
        "status": "pending",
        "date": "2025-07-30T10:55:47.394Z",
        "note": "Sipariş oluşturuldu"
      },
      {
        "status": "confirmed",
        "date": "2025-08-01T08:30:00.335Z",
        "note": "Sipariş durumu confirmed olarak güncellendi"
      }
    ],
    "adminNotes": [],
    "currency": "TRY",
    "source": "website",
    "isGift": false,
    "giftMessage": null,
    "kvkkConsent": true,
    "privacyPolicyConsent": true,
    "distanceSalesConsent": true
  }
}
```

### 3. Sipariş Durumu Güncelle

**Endpoint:** `PUT /api/admin/orders/:id/status`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "shipped",
  "note": "Kargo firmasına teslim edildi"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "6889fa33f227f17f3876ad4c",
    "orderNumber": "ORD-20250730-947400",
    "status": "shipped",
    "statusHistory": [
      {
        "status": "pending",
        "date": "2025-07-30T10:55:47.394Z",
        "note": "Sipariş oluşturuldu"
      },
      {
        "status": "confirmed",
        "date": "2025-08-01T08:30:00.335Z",
        "note": "Sipariş durumu confirmed olarak güncellendi"
      },
      {
        "status": "shipped",
        "date": "2025-08-01T08:35:00.000Z",
        "note": "Kargo firmasına teslim edildi"
      }
    ]
  }
}
```

### 4. Kargo Takip Numarası Ekle

**Endpoint:** `PUT /api/admin/orders/:id/tracking`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "trackingNumber": "TRK123456789",
  "carrier": "aras"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "6889fa33f227f17f3876ad4c",
    "orderNumber": "ORD-20250730-947400",
    "tracking": {
      "trackingNumber": "TRK123456789",
      "carrier": "aras",
      "trackingUrl": "https://www.araskargo.com.tr/tr/cargo-tracking?code=TRK123456789",
      "estimatedDelivery": "2024-08-04T08:30:37.885Z"
    },
    "updatedAt": "2025-08-01T08:30:37.891Z"
  }
}
```

---

## ❌ Hata Kodları

### Genel Hata Formatı
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Hata açıklaması"
  },
  "timestamp": "2024-08-01T08:30:00.000Z"
}
```

### Yaygın Hata Kodları

| Kod | Açıklama | HTTP Status |
|-----|----------|-------------|
| `UNAUTHORIZED` | Yetkilendirme hatası | 401 |
| `FORBIDDEN` | Erişim reddedildi | 403 |
| `NOT_FOUND` | Kayıt bulunamadı | 404 |
| `VALIDATION_ERROR` | Doğrulama hatası | 400 |
| `INTERNAL_ERROR` | Sunucu hatası | 500 |

### Örnek Hata Response'ları

**401 Unauthorized:**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Geçersiz token"
  }
}
```

**404 Not Found:**
```json
{
  "success": false,
  "error": {
    "code": "ORDER_NOT_FOUND",
    "message": "Sipariş bulunamadı"
  }
}
```

**400 Validation Error:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Takip numarası gerekli"
  }
}
```

---

## 💡 Örnek Kullanımlar

### 1. Kargo Seçeneklerini Getirme

```javascript
// Frontend'de kargo seçeneklerini getirme
const getShippingOptions = async (orderAmount, city) => {
  try {
    const queryParams = new URLSearchParams({
      orderAmount: orderAmount.toString(),
      ...(city && { city })
    });

    const response = await fetch(`/api/shipping/options?${queryParams}`);
    const data = await response.json();

    if (data.success) {
      return data.data.options;
    } else {
      throw new Error(data.error.message);
    }
  } catch (error) {
    console.error('Kargo seçenekleri yüklenemedi:', error);
    throw error;
  }
};

// Kullanım
const options = await getShippingOptions(750, 'İstanbul');
console.log(options);
```

### 2. Kargo Takip Bilgisi Alma

```javascript
// Kargo takip bilgisi alma
const getTrackingInfo = async (trackingNumber) => {
  try {
    const response = await fetch(`/api/shipping/tracking/${trackingNumber}`);
    const data = await response.json();

    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.error.message);
    }
  } catch (error) {
    console.error('Takip bilgisi alınamadı:', error);
    throw error;
  }
};

// Kullanım
const trackingInfo = await getTrackingInfo('TRK123456789');
console.log(trackingInfo.events);
```

### 3. Admin Kargo Yönetimi

```javascript
// Admin token ile kargo takip numarası ekleme
const addTrackingNumber = async (orderId, trackingData, token) => {
  try {
    const response = await fetch(`/api/admin/orders/${orderId}/tracking`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(trackingData)
    });

    const data = await response.json();

    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.error.message);
    }
  } catch (error) {
    console.error('Kargo bilgisi eklenemedi:', error);
    throw error;
  }
};

// Kullanım
const result = await addTrackingNumber(
  '6889fa33f227f17f3876ad4c',
  {
    trackingNumber: 'TRK123456789',
    carrier: 'aras'
  },
  'admin_token_here'
);
console.log(result);
```

### 4. Sipariş Durumu Güncelleme

```javascript
// Admin token ile sipariş durumu güncelleme
const updateOrderStatus = async (orderId, status, note, token) => {
  try {
    const response = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status, note })
    });

    const data = await response.json();

    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.error.message);
    }
  } catch (error) {
    console.error('Sipariş durumu güncellenemedi:', error);
    throw error;
  }
};

// Kullanım
const result = await updateOrderStatus(
  '6889fa33f227f17f3876ad4c',
  'shipped',
  'Kargo firmasına teslim edildi',
  'admin_token_here'
);
console.log(result);
```

---

## 🔧 Postman Koleksiyonu

### Kargo API Postman Koleksiyonu

```json
{
  "info": {
    "name": "Kargo API",
    "description": "E-ticaret kargo API endpoint'leri"
  },
  "item": [
    {
      "name": "Kargo Seçenekleri",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/api/shipping/options?orderAmount=750&city=İstanbul"
      }
    },
    {
      "name": "Kargo Takip",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/api/shipping/tracking/TRK123456789"
      }
    },
    {
      "name": "Admin Sipariş Listesi",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/api/admin/orders?page=1&limit=10",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{adminToken}}"
          }
        ]
      }
    },
    {
      "name": "Kargo Takip No Ekle",
      "request": {
        "method": "PUT",
        "url": "{{baseUrl}}/api/admin/orders/{{orderId}}/tracking",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{adminToken}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"trackingNumber\": \"TRK123456789\",\n  \"carrier\": \"aras\"\n}"
        }
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:8080"
    },
    {
      "key": "adminToken",
      "value": "your_admin_token_here"
    },
    {
      "key": "orderId",
      "value": "6889fa33f227f17f3876ad4c"
    }
  ]
}
```

---

## 📋 Özet

Bu API dokümantasyonu ile:

1. **Kargo Seçenekleri** dinamik olarak getirilebilir
2. **Kargo Takip** bilgileri gerçek zamanlı alınabilir
3. **Admin Panel** üzerinden kargo yönetimi yapılabilir
4. **Sipariş Durumları** güncellenebilir

Tüm endpoint'ler test edilmiş ve çalışır durumda. Frontend geliştirici bu dokümantasyonu kullanarak kapsamlı bir kargo entegrasyonu yapabilir.

---

**Son Güncelleme:** 1 Ağustos 2024  
**Versiyon:** 1.0  
**Hazırlayan:** Backend Geliştirici 