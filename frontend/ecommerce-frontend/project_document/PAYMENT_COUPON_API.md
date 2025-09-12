# Ödeme & Kupon API Dökümantasyonu

Bu döküman, ödeme ve kupon işlemleriyle ilgili backend API endpointlerini, gönderilmesi ve alınması gereken verileri ve örnekleri içerir.

---

## 1. Sipariş Oluşturma (Ödeme Başlatma)

### Endpoint
**POST** `/api/orders`

### Gönderilecek Body (JSON)
```json
{
  "customerType": "bireysel" | "firma",
  "shippingAddress": {
    "firstName": "Ahmet",
    "lastName": "Yılmaz",
    "email": "ahmet@example.com",
    "phone": "+905551112233",
    "address": "Atatürk Cad. No:1",
    "city": "İstanbul",
    "district": "Kadıköy",
    "postalCode": "34710"
  },
  "invoiceAddress": { // firma ise zorunlu
    "firstName": "Ahmet",
    "lastName": "Yılmaz",
    "email": "ahmet@example.com",
    "phone": "+905551112233",
    "address": "Atatürk Cad. No:1",
    "city": "İstanbul",
    "district": "Kadıköy",
    "postalCode": "34710",
    "companyName": "Yılmaz Ltd.",
    "taxNumber": "1234567890"
  },
  "items": [
    { "productId": "...", "quantity": 2, "price": 499.99 }
  ],
  "paymentMethod": "credit-card" | "bank-transfer" | "cash-on-delivery",
  "couponCode": "WELCOME10", // opsiyonel
  "notes": {
    "customer": "Kapıcıya teslim edilebilir",
    "delivery": "Acele teslimat"
  },
  "shippingType": "standart" | "ekspres" | "same-day",
  "kvkkConsent": true,
  "privacyPolicyConsent": true,
  "distanceSalesConsent": true
}
```

### Dönen Yanıt (Başarılı)
```json
{
  "success": true,
  "message": "Sipariş başarıyla oluşturuldu",
  "data": {
    "order": {
      "_id": "...",
      "orderNumber": "ORD-20240612-123456",
      "items": [...],
      "shippingAddress": {...},
      "invoiceAddress": {...},
      "coupon": {
        "code": "WELCOME10",
        "discountType": "percentage",
        "discountValue": 10,
        "discountAmount": 50
      },
      "discountAmount": 50,
      "totalAmount": 450,
      ...
    }
  }
}
```

### Hata Yanıtı (Kupon Geçersiz)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Kupon kodu kullanılamaz: Kupon süresi dolmuş"
  }
}
```

---

## 2. Kupon Doğrulama & Sepette Uygulama

### Endpoint
**POST** `/api/coupon/apply`

### Gönderilecek Body
```json
{
  "coupon": "WELCOME10"
}
```

### Dönen Yanıt
```json
{
  "coupon": {
    "code": "WELCOME10",
    "type": "percentage",
    "value": 10,
    ...
  },
  "discountedTotal": 450
}
```

---

## 3. Sipariş Geçmişi

### Endpoint
**GET** `/api/users/orders`

### Dönen Yanıt
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "orderNumber": "ORD-20240612-123456",
        "items": [...],
        "coupon": { ... },
        "discountAmount": 50,
        "totalAmount": 450,
        ...
      }
    ],
    "pagination": { ... }
  }
}
```

---

## 4. Tekrar Sipariş

### Endpoint
**POST** `/api/orders/:orderId/repeat`

### Dönen Yanıt
```json
{
  "success": true,
  "message": "Tekrar sipariş oluşturuldu.",
  "order": { ...yeni sipariş... }
}
```

---

## 5. Fatura PDF İndirme

### Endpoint
**GET** `/api/orders/:orderId/invoice`

Yanıt: PDF dosyası (Content-Type: application/pdf)

---

## 6. Kargo Takip

### Endpointler
- **GET** `/api/track/order/:orderId` → Siparişe ait kargo takip bilgisi
- **GET** `/api/track/number/:trackingNumber` → Takip numarası ile kargo bilgisi

---

## 7. Adresleri Getir

### Endpoint
**GET** `/api/users/addresses`

### Dönen Yanıt
```json
{
  "success": true,
  "data": {
    "addresses": [
      { "firstName": "Ahmet", "address": "...", ... }
    ]
  }
}
```

---

## 8. Yasal Metin Linkleri

### Endpoint
**GET** `/api/legal/links`

### Dönen Yanıt
```json
{
  "privacyPolicyUrl": "https://shop.acikatolye.com.tr/gizlilik-politikasi",
  "distanceSalesUrl": "https://shop.acikatolye.com.tr/mesafeli-satis-sozlesmesi",
  "kvkkUrl": "https://shop.acikatolye.com.tr/kvkk-aydinlatma-metni"
}
```

---

## Notlar
- Tüm endpointlerde JWT ile authentication gereklidir (aksi belirtilmedikçe).
- Kupon kodu ile ilgili validasyon ve hata mesajları backend tarafından açıkça döndürülür.
- Sipariş oluşturulurken KVKK, gizlilik ve mesafeli satış onayları zorunludur.
- Fatura PDF'i sadece ilgili kullanıcı tarafından indirilebilir. 