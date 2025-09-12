# E-Ticaret Backend API Dokümantasyonu

Bu doküman, ElektroTech e-ticaret platformu için geliştirilen backend API'lerinin kapsamlı dokümantasyonudur. Tüm endpoint'ler, request/response formatları ve örnekler içerir.

---

## 📋 İçindekiler

1. [Sipariş Yönetimi](#1-sipariş-yönetimi)
2. [Ödeme İşlemleri](#2-ödeme-işlemleri)
3. [Kupon Sistemi](#3-kupon-sistemi)
4. [Kampanya Sistemi](#4-kampanya-sistemi)
5. [E-posta Servisleri](#5-e-posta-servisleri)
6. [Yasal ve Güvenlik](#6-yasal-ve-güvenlik)
7. [Kullanıcı Yönetimi](#7-kullanıcı-yönetimi)
8. [Ürün Yönetimi](#8-ürün-yönetimi)

---

## 1. Sipariş Yönetimi

### 1.1 Sipariş Oluştur

#### POST `/api/orders`
Kullanıcının sepetindeki ürünlerle yeni bir sipariş oluşturur.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**İstek Body:**
```json
{
  "customerType": "bireysel", // "bireysel" veya "firma"
  "items": [
    {
      "productId": "665f8a123456789abcde111",
      "quantity": 2
    }
  ],
  "shippingAddress": {
    "title": "Ev", // opsiyonel, default: "Ev"
    "firstName": "Ahmet",
    "lastName": "Yılmaz",
    "address": "Atatürk Cad. No:123",
    "city": "İstanbul",
    "district": "Kadıköy",
    "postalCode": "34710",
    "phone": "+905551234567",
    "deliveryNotes": "Kapıda ödeme" // opsiyonel
  },
  "invoiceAddress": {
    "title": "İş", // opsiyonel
    "firstName": "Ahmet",
    "lastName": "Yılmaz",
    "email": "ahmet@example.com",
    "phone": "+905551234567",
    "address": "İş Adresi No:456",
    "city": "İstanbul",
    "district": "Beşiktaş",
    "postalCode": "34353",
    "companyName": "ABC Şirketi", // firma ise zorunlu
    "taxNumber": "1234567890" // firma ise zorunlu
  },
  "paymentMethod": "credit-card", // "credit-card", "bank-transfer"
  "couponCode": "WELCOME10", // opsiyonel
  "notes": {
    "customer": "Özel notum var", // opsiyonel
    "delivery": "Teslimat notu" // opsiyonel
  },
  "shippingType": "standart", // "standart", "ekspres", "same-day"
  "kvkkConsent": true, // zorunlu
  "privacyPolicyConsent": true, // zorunlu
  "distanceSalesConsent": true // zorunlu
}
```

**Başarılı Yanıt:**
```json
{
  "success": true,
  "message": "Sipariş başarıyla oluşturuldu",
  "data": {
    "order": {
      "_id": "688f8a123456789abcdef01",
      "orderNumber": "ORD-20241228-123456",
      "userId": "665f8a123456789abcdefff",
      "customerType": "bireysel",
      "items": [
        {
          "productId": "665f8a123456789abcde111",
          "name": "Arduino Uno R3",
          "image": "https://cdn.site.com/arduino.jpg",
          "price": 249.99,
          "originalPrice": 299.99,
          "quantity": 2,
          "sku": "ARDUINO-001",
          "type": "product"
        }
      ],
      "totalItems": 2,
      "subtotal": 499.98,
      "shippingCost": 29.90,
      "discountAmount": 50.00,
      "totalAmount": 479.88,
      "currency": "TRY",
      "status": "pending",
      "shippingAddress": {
        "title": "Ev",
        "firstName": "Ahmet",
        "lastName": "Yılmaz",
        "address": "Atatürk Cad. No:123",
        "city": "İstanbul",
        "district": "Kadıköy",
        "postalCode": "34710",
        "phone": "+905551234567"
      },
      "billingAddress": {
        "firstName": "Ahmet",
        "lastName": "Yılmaz",
        "email": "ahmet@example.com",
        "phone": "+905551234567",
        "address": "İş Adresi No:456",
        "city": "İstanbul",
        "district": "Beşiktaş",
        "postalCode": "34353"
      },
      "payment": {
        "method": "credit-card",
        "status": "pending"
      },
      "coupon": {
        "code": "WELCOME10",
        "discountType": "percentage",
        "discountValue": 10,
        "discountAmount": 50.00
    },
      "campaign": null,
      "notes": {
        "customer": "Özel notum var",
        "delivery": "Teslimat notu"
      },
      "shippingType": "standart",
      "kvkkConsent": true,
      "privacyPolicyConsent": true,
      "distanceSalesConsent": true,
      "createdAt": "2024-12-28T12:34:56.789Z"
    }
  }
}
```

**Hata Yanıtı:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Firma siparişlerinde şirket adı ve vergi numarası zorunludur."
  }
}
```

### 1.2 Sipariş Detayı Getir

#### GET `/api/orders/:orderId`
Belirli bir siparişin detaylarını getirir.

**Headers:**
```
Authorization: Bearer {token}
```

**Yanıt:**
```json
{
  "success": true,
  "data": {
    "order": {
      "_id": "688f8a123456789abcdef01",
      "orderNumber": "ORD-20241228-123456",
      "status": "paid",
      "items": [...],
      "totals": {
        "subtotal": 499.98,
        "shippingCost": 29.90,
        "discountAmount": 50.00,
        "totalAmount": 479.88
      },
      "payment": {
        "method": "credit-card",
        "status": "completed",
        "transactionId": "PAYTR-123456",
        "paymentDate": "2024-12-28T12:35:00.000Z"
      },
      "tracking": {
        "trackingNumber": "TRK123456789",
        "carrier": "aras",
        "trackingUrl": "https://www.araskargo.com.tr/tr/cargo-tracking?code=TRK123456789",
        "estimatedDelivery": "2024-12-30T00:00:00.000Z"
      },
      "createdAt": "2024-12-28T12:34:56.789Z"
    }
  }
}
```

### 1.3 Siparişleri Listele

#### GET `/api/orders`
Kullanıcının tüm siparişlerini listeler.

**Query Parameters:**
- `page` (opsiyonel): Sayfa numarası (default: 1)
- `limit` (opsiyonel): Sayfa başına kayıt (default: 10)
- `status` (opsiyonel): Sipariş durumu filtresi

**Yanıt:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "_id": "688f8a123456789abcdef01",
        "orderNumber": "ORD-20241228-123456",
        "status": "paid",
        "totalAmount": 479.88,
        "createdAt": "2024-12-28T12:34:56.789Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "pages": 1
    }
  }
}
```

---

## 2. Ödeme İşlemleri

### 2.1 PayTR Ödeme Başlat

#### POST `/api/payments/paytr/init`
PayTR ile ödeme başlatır ve iframe token döner.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**İstek Body:**
```json
{
  "orderId": "688f8a123456789abcdef01"
}
```

**Yanıt:**
```json
{
  "success": true,
  "message": "PayTR ödeme başlatıldı",
  "data": {
    "iframeToken": "iframe_token_here",
    "paymentUrl": "https://www.paytr.com/odeme/guvenli/iframe_token_here",
    "orderId": "688f8a123456789abcdef01"
  }
}
```

### 2.2 PayTR Callback

#### POST `/api/payments/paytr/callback`
PayTR'den gelen ödeme sonucunu işler.

**İstek Body:**
```json
{
  "merchant_oid": "ORD-20241228-123456",
  "status": "success",
  "total_amount": "479.88",
  "hash": "hash_value_here",
  "test_mode": "1"
}
```

**Yanıt:**
```json
{
  "success": true,
  "message": "Ödeme durumu güncellendi"
}
```

### 2.3 Banka Hesap Bilgileri

#### GET `/api/payments/bank-accounts`
Havale/EFT için banka hesap bilgilerini getirir.

**Yanıt:**
```json
{
  "success": true,
  "data": {
    "accounts": [
      {
        "bankName": "Garanti BBVA",
        "accountName": "ElektroTech Ticaret Ltd. Şti.",
        "accountNumber": "1234567890",
        "iban": "TR123456789012345678901234",
        "branchCode": "123"
      }
    ]
  }
}
```

---

## 3. Kupon Sistemi

### 3.1 Kupon Doğrula

#### POST `/api/coupons/validate`
Kupon kodunu doğrular ve indirim bilgisini döner.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**İstek Body:**
```json
{
  "code": "WELCOME10",
  "orderAmount": 500.00
}
```

**Yanıt:**
```json
{
  "success": true,
  "message": "Kupon geçerli",
  "data": {
    "coupon": {
      "id": "665f8a123456789abcde222",
      "code": "WELCOME10",
      "name": "Hoş Geldin İndirimi",
      "description": "İlk alışverişinizde %10 indirim",
      "type": "percentage",
      "value": 10,
      "discountAmount": 50.00,
      "minOrderAmount": 100,
      "maxDiscountAmount": 100
    }
  }
}
```

### 3.2 Sepete Kupon Uygula

#### POST `/api/cart/apply-coupon`
Sepete kupon uygular ve güncellenmiş toplamları döner.

**İstek Body:**
```json
{
  "code": "WELCOME10",
  "cartItems": [
    {
      "productId": "665f8a123456789abcde111",
      "quantity": 2
    }
  ]
}
```

**Yanıt:**
```json
{
  "success": true,
  "message": "Kupon başarıyla uygulandı",
  "data": {
    "subtotal": 499.98,
    "discountAmount": 50.00,
    "totalAfterDiscount": 449.98,
    "coupon": {
      "code": "WELCOME10",
      "discountType": "percentage",
      "discountValue": 10,
      "discountAmount": 50.00
    }
  }
}
```

### 3.3 Kullanılabilir Kuponları Listele

#### GET `/api/coupons/available`
Kullanıcı için kullanılabilir kuponları listeler.

**Query Parameters:**
- `orderAmount` (opsiyonel): Sipariş tutarı

**Yanıt:**
```json
{
  "success": true,
  "data": {
    "coupons": [
      {
        "id": "665f8a123456789abcde222",
        "code": "WELCOME10",
        "name": "Hoş Geldin İndirimi",
        "description": "İlk alışverişinizde %10 indirim",
        "type": "percentage",
        "value": 10,
        "minOrderAmount": 100,
        "maxDiscountAmount": 100,
        "endDate": "2024-12-31T23:59:59.000Z"
      }
    ]
  }
}
```

---

## 4. Kampanya Sistemi

### 4.1 Uygun Kampanyaları Getir

#### GET `/api/campaigns/applicable`
Kullanıcı için uygun kampanyaları listeler.

**Query Parameters:**
- `orderAmount` (opsiyonel): Sipariş tutarı
- `items` (opsiyonel): Ürün listesi

**Yanıt:**
```json
{
  "success": true,
  "data": {
    "campaigns": [
      {
        "id": "665f8a123456789abcde333",
        "name": "Yaz Sezonu İndirimi",
        "description": "Tüm elektronik ürünlerde %15 indirim",
        "type": "seasonal",
        "discount": {
          "type": "percentage",
          "value": 15,
          "maxDiscountAmount": 100
        },
        "discountAmount": 75.00,
        "isAutoApply": false,
        "priority": 1
      }
    ],
    "count": 1
  }
}
```

### 4.2 En İyi Kampanya Önerisi

#### GET `/api/campaigns/suggest`
Sepet için en iyi kampanya önerisini getirir.

**Query Parameters:**
- `orderAmount` (opsiyonel): Sipariş tutarı
- `items` (opsiyonel): Ürün listesi

**Yanıt:**
```json
{
  "success": true,
  "data": {
    "campaign": {
      "id": "665f8a123456789abcde333",
      "name": "Yaz Sezonu İndirimi",
      "description": "Tüm elektronik ürünlerde %15 indirim",
      "type": "seasonal",
      "discount": {
        "type": "percentage",
        "value": 15,
        "maxDiscountAmount": 100
      },
      "discountAmount": 75.00
    }
  }
}
```

### 4.3 Otomatik Kampanya Uygula

#### POST `/api/campaigns/auto-apply`
Otomatik uygulanacak kampanyaları kontrol eder.

**İstek Body:**
```json
{
  "orderAmount": 500.00,
  "items": [
    {
      "productId": "665f8a123456789abcde111",
      "quantity": 2
    }
  ]
}
```

**Yanıt:**
```json
{
  "success": true,
  "data": {
    "campaign": {
      "id": "665f8a123456789abcde444",
      "name": "Ücretsiz Kargo",
      "type": "free_shipping",
      "discount": {
        "type": "free_shipping",
        "value": 29.90
      },
      "discountAmount": 29.90
    },
    "applied": true
  }
}
```

---

## 5. E-posta Servisleri

### 5.1 E-posta Durumu Kontrol Et

#### GET `/api/email/status`
E-posta ayarlarını kontrol eder.

**Headers:**
```
Authorization: Bearer {token}
```

**Yanıt:**
```json
{
  "success": true,
  "data": {
    "config": {
      "host": "smtp.gmail.com",
      "port": 587,
      "user": "noreply@elektrotech.com",
      "from": "ElektroTech <noreply@elektrotech.com>",
      "testMode": true
    },
    "status": "test_mode"
  }
}
```

### 5.2 Test E-postası Gönder

#### POST `/api/email/test`
Test e-postası gönderir.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**İstek Body:**
```json
{
  "email": "test@example.com",
  "type": "order_confirmation" // "order_confirmation", "welcome"
}
```

**Yanıt:**
```json
{
  "success": true,
  "message": "Test e-postası başarıyla gönderildi",
  "data": {
    "email": "test@example.com",
    "type": "order_confirmation",
    "messageId": "test-message-id"
  }
}
```

### 5.3 Sipariş Onay E-postası Gönder

#### POST `/api/email/order-confirmation`
Manuel olarak sipariş onay e-postası gönderir.

**İstek Body:**
```json
{
  "orderId": "688f8a123456789abcdef01",
  "userId": "665f8a123456789abcdefff"
}
```

**Yanıt:**
```json
{
  "success": true,
  "message": "Sipariş onay e-postası başarıyla gönderildi",
  "data": {
    "orderNumber": "ORD-20241228-123456",
    "userEmail": "user@example.com",
    "messageId": "sent"
  }
}
```

---

## 6. Yasal ve Güvenlik

### 6.1 Yasal Linkleri Getir

#### GET `/api/legal/links`
Yasal doküman linklerini getirir.

**Yanıt:**
```json
{
  "success": true,
  "data": {
    "privacyPolicyUrl": "https://shop.acikatolye.com.tr/gizlilik-politikasi",
    "distanceSalesUrl": "https://shop.acikatolye.com.tr/mesafeli-satis-sozlesmesi",
    "kvkkUrl": "https://shop.acikatolye.com.tr/kvkk-aydinlatma-metni",
    "termsOfServiceUrl": "https://shop.acikatolye.com.tr/kullanim-kosullari",
    "cookiePolicyUrl": "https://shop.acikatolye.com.tr/cerez-politikasi",
    "returnPolicyUrl": "https://shop.acikatolye.com.tr/iade-politikasi"
  }
}
```

### 6.2 KVKK Aydınlatma Metni

#### GET `/api/legal/kvkk-text`
KVKK aydınlatma metnini getirir.

**Yanıt:**
```json
{
  "success": true,
  "data": {
    "title": "Kişisel Verilerin Korunması Aydınlatma Metni",
    "lastUpdated": "2024-07-28",
    "content": "<h2>1. Veri Sorumlusu</h2><p>ElektroTech olarak...</p>",
    "consentText": "Kişisel verilerimin işlenmesine ve KVKK Aydınlatma Metni'ni okuduğumu onaylıyorum.",
    "requiredConsent": true
  }
}
```

### 6.3 Gizlilik Politikası

#### GET `/api/legal/privacy-policy`
Gizlilik politikası metnini getirir.

**Yanıt:**
```json
{
  "success": true,
  "data": {
    "title": "Gizlilik Politikası",
    "lastUpdated": "2024-07-28",
    "content": "<h2>1. Giriş</h2><p>ElektroTech olarak...</p>"
  }
}
```

### 6.4 Mesafeli Satış Sözleşmesi

#### GET `/api/legal/distance-sales`
Mesafeli satış sözleşmesi metnini getirir.

**Yanıt:**
```json
{
  "success": true,
  "data": {
    "title": "Mesafeli Satış Sözleşmesi",
    "lastUpdated": "2024-07-28",
    "content": "<h2>1. Taraflar</h2><p><strong>SATICI:</strong> ElektroTech...</p>"
  }
}
```

---

## 7. Kullanıcı Yönetimi

### 7.1 Kullanıcı Profili

#### GET `/api/users/profile`
Kullanıcının profil bilgilerini getirir.

**Headers:**
```
Authorization: Bearer {token}
```

**Yanıt:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "665f8a123456789abcdefff",
      "firstName": "Ahmet",
      "lastName": "Yılmaz",
      "email": "ahmet@example.com",
      "phone": "+905551234567",
      "role": "customer",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### 7.2 Adres Yönetimi

#### GET `/api/users/addresses`
Kullanıcının kayıtlı adreslerini getirir.

**Yanıt:**
```json
{
  "success": true,
  "data": {
    "addresses": [
      {
        "_id": "665f8a123456789abcde555",
        "title": "Ev",
        "firstName": "Ahmet",
        "lastName": "Yılmaz",
        "address": "Atatürk Cad. No:123",
        "city": "İstanbul",
        "district": "Kadıköy",
        "postalCode": "34710",
        "phone": "+905551234567",
        "isDefault": true
      }
    ]
  }
}
```

---

## 8. Ürün Yönetimi

### 8.1 Ürünleri Listele

#### GET `/api/products`
Ürünleri listeler.

**Query Parameters:**
- `page` (opsiyonel): Sayfa numarası
- `limit` (opsiyonel): Sayfa başına kayıt
- `category` (opsiyonel): Kategori filtresi
- `search` (opsiyonel): Arama terimi

**Yanıt:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "_id": "665f8a123456789abcde111",
        "name": "Arduino Uno R3",
        "description": "Mikrodenetleyici geliştirme kartı",
        "price": 249.99,
        "originalPrice": 299.99,
        "images": [
          {
            "url": "https://cdn.site.com/arduino.jpg",
            "alt": "Arduino Uno R3"
          }
        ],
        "category": "Elektronik",
        "brand": "Arduino",
        "stock": {
          "quantity": 50,
          "trackStock": true
        },
        "sku": "ARDUINO-001"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10
    }
  }
}
```

### 8.2 Ürün Detayı

#### GET `/api/products/:productId`
Ürün detayını getirir.

**Yanıt:**
```json
{
  "success": true,
  "data": {
    "product": {
      "_id": "665f8a123456789abcde111",
      "name": "Arduino Uno R3",
      "description": "Mikrodenetleyici geliştirme kartı",
      "price": 249.99,
      "originalPrice": 299.99,
      "images": [...],
      "category": "Elektronik",
      "brand": "Arduino",
      "stock": {
        "quantity": 50,
        "trackStock": true
      },
      "specifications": [...],
      "reviews": [...]
    }
  }
}
```

---

## 🔒 Güvenlik ve Doğrulama

### Kimlik Doğrulama
- Tüm özel endpoint'ler için JWT token gereklidir
- Token `Authorization: Bearer {token}` header'ında gönderilmelidir

### Rate Limiting
- Tüm endpoint'ler için rate limiting uygulanır
- SSL bağlantısı olmayan istekler için daha sıkı limitler

### SSL/HTTPS
- Production ortamında hassas endpoint'ler için HTTPS zorunludur
- `/api/payments`, `/api/orders`, `/api/users` endpoint'leri SSL gerektirir

### Veri Doğrulama
- Tüm input'lar server-side validation'dan geçer
- SQL injection ve XSS koruması aktif
- CSRF koruması mevcuttur

---

## 📊 Hata Kodları

| Kod | Açıklama |
|-----|----------|
| `VALIDATION_ERROR` | Veri doğrulama hatası |
| `AUTHENTICATION_ERROR` | Kimlik doğrulama hatası |
| `AUTHORIZATION_ERROR` | Yetki hatası |
| `NOT_FOUND` | Kaynak bulunamadı |
| `PAYMENT_ERROR` | Ödeme işlemi hatası |
| `COUPON_ERROR` | Kupon işlemi hatası |
| `CAMPAIGN_ERROR` | Kampanya işlemi hatası |
| `EMAIL_ERROR` | E-posta gönderim hatası |
| `SSL_REQUIRED` | HTTPS bağlantısı gerekli |

---

## 🚀 Test Ortamı

### Test Kuponları
- `WELCOME10`: %10 indirim (min: 100 TL)
- `FREESHIP`: Ücretsiz kargo (min: 500 TL)
- `VIP25`: %25 indirim (VIP müşteriler)

### Test Kampanyaları
- Yaz Sezonu İndirimi: %15 indirim
- Ücretsiz Kargo: 500 TL üzeri
- VIP Müşteri İndirimi: %25 indirim
- Flash Sale: %30 indirim
- İlk Sipariş İndirimi: %20 indirim

### Test E-posta
- Test modunda e-postalar simüle edilir
- Gerçek e-posta gönderilmez

---

## 📝 Notlar

- Tüm tarihler ISO 8601 formatında döner
- Para birimi TRY (Türk Lirası) olarak kullanılır
- Stok kontrolü otomatik yapılır
- Kupon ve kampanya kuralları backend'de kontrol edilir
- Ödeme işlemleri güvenli şekilde yapılır
- KVKK/GDPR uyumluluğu sağlanmıştır
- SSL/HTTPS güvenliği production'da zorunludur 