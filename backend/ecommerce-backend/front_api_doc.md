# ElektroTech E-Ticaret API Dokümantasyonu

## İçindekiler
1. [Genel Bilgiler](#genel-bilgiler)
2. [Kimlik Doğrulama](#kimlik-doğrulama)
3. [Kullanıcı İşlemleri](#kullanıcı-işlemleri)
4. [Ürün İşlemleri](#ürün-işlemleri)
5. [Kategori İşlemleri](#kategori-işlemleri)
6. [Sipariş İşlemleri](#sipariş-işlemleri)
7. [Ödeme İşlemleri](#ödeme-işlemleri)

## Genel Bilgiler

### Base URL
```
http://localhost:3000/api
```

### İstek Formatı
Tüm istekler JSON formatında yapılmalıdır.

### Response Formatı
```json
{
  "success": true|false,
  "message": "İşlem açıklaması",
  "data": {
    // İşlem verileri
  },
  "timestamp": "2024-03-15T10:30:00.000Z"
}
```

### Hata Kodları
| Kod | Açıklama |
|-----|-----------|
| 400 | Geçersiz İstek |
| 401 | Yetkisiz Erişim |
| 403 | Erişim Reddedildi |
| 404 | Bulunamadı |
| 429 | Çok Fazla İstek |
| 500 | Sunucu Hatası |

## Kimlik Doğrulama

### Token Yönetimi

API, JWT tabanlı kimlik doğrulama kullanır. İki tür token vardır:
- **Access Token**: 1 saat geçerli
- **Refresh Token**: 7 gün geçerli

#### Headers
```
Authorization: Bearer <access_token>
Refresh-Token: <refresh_token>
```

Sistem otomatik token yenileme özelliğine sahiptir:
- Access token süresi dolmadan 5 dakika önce otomatik yenilenir
- Yeni tokenlar response header'larında gönderilir:
  - `New-Access-Token`
  - `New-Refresh-Token`

### Kayıt Ol
```http
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "güvenli_şifre",
  "name": "Ad",
  "surname": "Soyad",
  "phone": "+905551234567"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Kullanıcı başarıyla kaydedildi. Email doğrulama linki gönderildi.",
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "Ad",
      "surname": "Soyad"
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token"
    }
  }
}
```

### Giriş Yap
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "güvenli_şifre"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Başarıyla giriş yapıldı",
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "Ad",
      "surname": "Soyad"
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token"
    }
  }
}
```

### Çıkış Yap
```http
POST /auth/logout
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Başarıyla çıkış yapıldı"
}
```

### Token Yenileme
```http
POST /auth/refresh-token
```

**Request Body:**
```json
{
  "refreshToken": "jwt_refresh_token"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token başarıyla yenilendi",
  "data": {
    "tokens": {
      "accessToken": "new_jwt_access_token",
      "refreshToken": "new_jwt_refresh_token"
    }
  }
}
```

## Kullanıcı İşlemleri

### Profil Bilgilerini Al
```http
GET /users/profile
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Profil başarıyla getirildi",
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "Ad",
      "surname": "Soyad",
      "phone": "+905551234567",
      "addresses": [],
      "favorites": []
    }
  }
}
```

### Profil Güncelle
```http
PUT /users/profile
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "Yeni Ad",
  "surname": "Yeni Soyad",
  "phone": "+905551234567"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profil başarıyla güncellendi",
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "Yeni Ad",
      "surname": "Yeni Soyad",
      "phone": "+905551234567"
    }
  }
}
```

### Şifre Değiştir
```http
POST /users/change-password
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "currentPassword": "mevcut_şifre",
  "newPassword": "yeni_şifre"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Şifre başarıyla değiştirildi"
}
```

## Ürün İşlemleri

### Ürün Listesi
```http
GET /products
```

**Query Parameters:**
```
page: Sayfa numarası (default: 1)
limit: Sayfa başına ürün sayısı (default: 10)
category: Kategori ID
search: Arama terimi
sort: Sıralama (price_asc, price_desc, newest, popular)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "product_id",
        "name": "Arduino UNO R3",
        "description": "Arduino UNO R3 Geliştirme Kartı",
        "price": 249.99,
        "category": {
          "id": "category_id",
          "name": "Arduino"
        },
        "images": [],
        "stock": {
          "quantity": 100
        }
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "pages": 10
    }
  }
}
```

### Ürün Detayı
```http
GET /products/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "product": {
      "id": "product_id",
      "name": "Arduino UNO R3",
      "description": "Arduino UNO R3 Geliştirme Kartı",
      "shortDescription": "Arduino UNO R3",
      "price": 249.99,
      "originalPrice": 299.99,
      "category": {
        "id": "category_id",
        "name": "Arduino"
      },
      "brand": "Arduino",
      "sku": "ARD-UNO-R3",
      "stock": {
        "quantity": 100,
        "lowStockThreshold": 10,
        "trackStock": true
      },
      "specifications": [
        {
          "key": "İşlemci",
          "value": "ATmega328P"
        }
      ],
      "features": [
        "USB Bağlantı",
        "14 Dijital Pin"
      ],
      "images": [],
      "seo": {
        "title": "Arduino UNO R3",
        "description": "Arduino UNO R3 Geliştirme Kartı",
        "keywords": ["arduino", "uno", "r3"]
      },
      "shipping": {
        "weight": 0.1,
        "dimensions": {
          "length": 10,
          "width": 5,
          "height": 2
        },
        "freeShipping": true,
        "shippingTime": "1-2-days"
      }
    }
  }
}
```

## Kategori İşlemleri

### Kategori Listesi
```http
GET /categories
```

**Response:**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "category_id",
        "name": "Elektronik",
        "description": "Elektronik Ürünler",
        "parent": null,
        "children": [
          {
            "id": "sub_category_id",
            "name": "Arduino",
            "description": "Arduino Ürünleri"
          }
        ],
        "image": {
          "url": "image_url",
          "alt": "Elektronik"
        },
        "level": 0,
        "isActive": true
      }
    ]
  }
}
```

## Sipariş İşlemleri

### Sipariş Oluştur
```http
POST /orders
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "items": [
    {
      "productId": "product_id",
      "quantity": 1
    }
  ],
  "shippingAddress": {
    "firstName": "Ad",
    "lastName": "Soyad",
    "address": "Adres",
    "city": "Şehir",
    "district": "İlçe",
    "phone": "+905551234567"
  },
  "paymentMethod": "credit_card"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sipariş başarıyla oluşturuldu",
  "data": {
    "order": {
      "id": "order_id",
      "items": [
        {
          "product": {
            "id": "product_id",
            "name": "Arduino UNO R3",
            "price": 249.99
          },
          "quantity": 1,
          "total": 249.99
        }
      ],
      "subtotal": 249.99,
      "shipping": 0,
      "total": 249.99,
      "status": "pending",
      "paymentStatus": "pending"
    }
  }
}
```

## Ödeme İşlemleri

### PayTR Ödeme Başlat
```http
POST /payments/paytr/init
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "orderId": "order_id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "iframeUrl": "paytr_iframe_url",
    "token": "paytr_token"
  }
}
```

### Havale/EFT Bildirimi
```http
POST /payments/bank-transfer/notify
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "orderId": "order_id",
  "bankName": "Banka Adı",
  "transferDate": "2024-03-15",
  "transferAmount": 249.99,
  "senderName": "Gönderen Ad Soyad",
  "receipt": "base64_encoded_receipt_image"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Ödeme bildirimi başarıyla alındı"
}
```

## Postman Kullanımı

1. Environment Variables:
```
baseUrl: http://localhost:3000/api
accessToken: {{login_response.data.tokens.accessToken}}
refreshToken: {{login_response.data.tokens.refreshToken}}
```

2. Collection Variables:
```
Authorization: Bearer {{accessToken}}
Refresh-Token: {{refreshToken}}
```

3. Tests Script (Her istek için):
```javascript
// Yeni token'ları kontrol et ve kaydet
if (pm.response.headers.has('New-Access-Token')) {
    pm.environment.set('accessToken', pm.response.headers.get('New-Access-Token'));
}
if (pm.response.headers.has('New-Refresh-Token')) {
    pm.environment.set('refreshToken', pm.response.headers.get('New-Refresh-Token'));
}
```

## Rate Limiting

| Endpoint | Limit | Süre |
|----------|-------|------|
| API Genel | 100 istek | 15 dakika |
| Kayıt | 5 istek | 1 saat |
| Giriş | 5 istek | 1 saat |
| Şifre Sıfırlama | 3 istek | 1 saat |
| Email Doğrulama | 3 istek | 1 saat |

## Güvenlik Önlemleri

1. **Token Güvenliği**
   - Access token: 1 saat
   - Refresh token: 7 gün
   - Otomatik token yenileme
   - JWT imzalama

2. **Rate Limiting**
   - IP bazlı limit
   - Endpoint bazlı limit
   - Brute force koruması

3. **CORS**
   - Güvenilir domainler
   - Metod kısıtlaması
   - Header kontrolü

4. **Veri Validasyonu**
   - Input sanitization
   - Schema validasyonu
   - Tip kontrolü

## Hata Yönetimi

Tüm hata yanıtları aşağıdaki formatta döner:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Hata açıklaması"
  }
}
```

### Genel Hata Kodları

| Kod | Açıklama |
|-----|-----------|
| VALIDATION_ERROR | Validasyon hatası |
| AUTH_ERROR | Kimlik doğrulama hatası |
| NOT_FOUND | Kaynak bulunamadı |
| RATE_LIMIT_EXCEEDED | Rate limit aşıldı |
| SERVER_ERROR | Sunucu hatası |

## Adres İşlemleri

### Adres Listesi
```http
GET /users/addresses
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "addresses": [
      {
        "id": "address_id",
        "firstName": "Ad",
        "lastName": "Soyad",
        "address": "Adres",
        "city": "Şehir",
        "district": "İlçe",
        "phone": "+905551234567",
        "isDefault": true
      }
    ]
  }
}
```

### Adres Ekle
```http
POST /users/addresses
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "firstName": "Ad",
  "lastName": "Soyad",
  "address": "Adres",
  "city": "Şehir",
  "district": "İlçe",
  "phone": "+905551234567"
}
```

### Varsayılan Adres Ayarla
```http
PUT /users/addresses/:id/default
```

## Favoriler

### Favori Listesi
```http
GET /users/favorites
```

### Favoriye Ekle
```http
POST /users/favorites/:productId
```

### Favoriden Çıkar
```http
DELETE /users/favorites/:productId
```

## Kargo Takip

### Kargo Durumu Sorgula
```http
GET /track/:id
```

### Kargo Numarası ile Sorgula
```http
GET /track/number/:trackingNumber
```

## Ürün Değerlendirmeleri

### Değerlendirme Ekle
```http
POST /reviews/:productSlug
```

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Request Body:**
```
rating: 5
comment: "Harika bir ürün"
image: [dosya]
```

### Değerlendirmeleri Listele
```http
GET /reviews/:productSlug
```

**Query Parameters:**
```
page: Sayfa numarası
limit: Sayfa başına değerlendirme sayısı
sort: rating_desc, rating_asc, newest, oldest
```

## Kargo Firmaları

### Firma Listesi
```http
GET /shipping/carriers
```

**Response:**
```json
{
  "success": true,
  "data": {
    "carriers": [
      {
        "code": "YK",
        "name": "Yurtiçi Kargo",
        "logo": "logo_url",
        "trackingUrl": "tracking_url"
      }
    ]
  }
}
```

## Email İşlemleri

### Email Doğrulama
```http
POST /auth/verify-email
```

**Request Body:**
```json
{
  "token": "verification_token"
}
```

### Doğrulama Emaili Tekrar Gönder
```http
POST /auth/resend-verification
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

## Şifre İşlemleri

### Şifremi Unuttum
```http
POST /auth/forgot-password
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

### Şifre Sıfırlama
```http
POST /auth/reset-password
```

**Request Body:**
```json
{
  "token": "reset_token",
  "newPassword": "yeni_şifre"
}
```

## Hesap İşlemleri

### Hesabı Deaktif Et
```http
POST /auth/deactivate
```

**Headers:**
```
Authorization: Bearer <access_token>
```

## İstatistikler

### Kullanıcı İstatistikleri
```http
GET /users/statistics
```

**Response:**
```json
{
  "success": true,
  "data": {
    "statistics": {
      "totalOrders": 10,
      "totalSpent": 2499.90,
      "favoriteProducts": 5,
      "lastOrderDate": "2024-03-15T10:30:00.000Z"
    }
  }
}
```

## Changelog

### v1.0.0 (2024-03-15)
- İlk sürüm
- Temel CRUD işlemleri
- JWT auth sistemi
- Otomatik token yenileme
- Rate limiting
- Hata yönetimi 

### v1.1.0 (2024-03-16)
- Adres yönetimi endpoint'leri eklendi
- Favori ürün işlemleri eklendi
- Kargo takip sistemi eklendi
- Ürün değerlendirme sistemi eklendi
- Email doğrulama ve şifre sıfırlama detayları eklendi
- Kullanıcı istatistikleri eklendi 