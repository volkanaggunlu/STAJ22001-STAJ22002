# Sepet (Cart) API Dokümantasyonu

Bu doküman, e-ticaret projesindeki sepet (cart) işlemlerine ait tüm API endpointlerini, açıklamalarını ve örnek istek/yanıtları içerir.

---

## 1. Sepeti Görüntüle

### GET `/api/cart`
Kullanıcının mevcut sepetini getirir.

**Headers:**
```
Authorization: Bearer {token}
```

**Yanıt:**
```json
{
  "success": true,
  "data": {
    "cart": {
      "id": "64f8a123456789abcdef",
      "user": "64f8a123456789abcdeg",
      "items": [
        {
          "id": "item1",
          "product": {
            "id": "64f8a123456789abcdeh",
            "name": "iPhone 15 Pro",
            "slug": "iphone-15-pro"
          },
          "quantity": 2,
          "price": 54999,
          "discountPrice": 49999,
          "total": 99998,
          "addedAt": "2023-10-01T10:00:00.000Z"
        }
      ],
      "totals": {
        "subtotal": 99998,
        "discount": 5000,
        "tax": 17099.64,
        "shipping": 0,
        "total": 112097.64
      },
      "appliedCoupons": [
        {
          "code": "WELCOME10",
          "discount": 5000,
          "type": "fixed"
        }
      ],
      "itemCount": 2,
      "createdAt": "2023-10-01T10:00:00.000Z",
      "updatedAt": "2023-10-01T12:00:00.000Z"
    }
  }
}
```

---

## 2. Sepete Ürün Ekle

### POST `/api/cart`
Sepete yeni ürün ekler veya mevcut ürünün miktarını artırır.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**İstek Body:**
```json
{
  "productId": "64f8a123456789abcdeh",
  "quantity": 1,
  "bundledProducts": []
}
```

**Yanıt:**
```json
{
  "success": true,
  "message": "Ürün sepete eklendi",
  "data": {
    "cart": { /* ... güncel sepet ... */ }
  }
}
```

---

## 3. Sepetteki Ürün Miktarını Güncelle

### PUT `/api/cart/:product`
Sepetteki bir ürünün miktarını günceller.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**URL Parametresi:**
- `:product` → Ürün detaylarını (ID ve varsa bundle bilgisi) JSON olarak encode edip URL'ye ekleyin.

**İstek Body:**
```json
{
  "quantity": 3
}
```

**Yanıt:**
```json
{
  "success": true,
  "message": "Ürün miktarı güncellendi",
  "data": {
    "cart": { /* ... güncel sepet ... */ }
  }
}
```

---

## 4. Sepetten Ürün Çıkar

### DELETE `/api/cart/:product`
Sepetten bir ürünü tamamen çıkarır.

**Headers:**
```
Authorization: Bearer {token}
```

**URL Parametresi:**
- `:product` → Ürün detaylarını (ID ve varsa bundle bilgisi) JSON olarak encode edip URL'ye ekleyin.

**Yanıt:**
```json
{
  "success": true,
  "message": "Ürün sepetten çıkarıldı",
  "data": {
    "cart": { /* ... güncel sepet ... */ }
  }
}
```

---

## 5. Sepeti Temizle

### DELETE `/api/cart`
Sepeti tamamen boşaltır.

**Headers:**
```
Authorization: Bearer {token}
```

**Yanıt:**
```json
{
  "success": true,
  "message": "Sepet temizlendi",
  "data": {
    "cart": { "itemCount": 0, "totals": { "total": 0 } }
  }
}
```

---

## 6. Sepet Özeti

### GET `/api/cart/summary`
Sepet özeti (toplam, indirim, kargo, vergi vs.)

**Headers:**
```
Authorization: Bearer {token}
```

**Yanıt:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "itemCount": 2,
      "totals": {
        "subtotal": 99998,
        "discount": 5000,
        "tax": 17099.64,
        "shipping": 0,
        "total": 112097.64
      },
      "items": [
        {
          "name": "iPhone 15 Pro",
          "quantity": 2,
          "price": 49999,
          "total": 99998
        }
      ],
      "coupons": [
        {
          "code": "WELCOME10",
          "discount": 5000
        }
      ]
    }
  }
}
```

---

## 7. Sepete Kupon Uygula

### POST `/api/cart/coupon`
Sepete kupon kodu uygular.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**İstek Body:**
```json
{
  "code": "WELCOME10"
}
```

**Yanıt:**
```json
{
  "success": true,
  "message": "Kupon başarıyla uygulandı",
  "data": {
    "coupon": {
      "code": "WELCOME10",
      "discount": 5000,
      "type": "fixed"
    },
    "cart": { /* ... güncel sepet ... */ }
  }
}
```

---

## 8. Kuponu Sepetten Kaldır

### DELETE `/api/cart/coupon/:code`
Sepetten kupon kaldırır.

**Headers:**
```
Authorization: Bearer {token}
```

**Yanıt:**
```json
{
  "success": true,
  "message": "Kupon kaldırıldı",
  "data": {
    "cart": { /* ... güncel sepet ... */ }
  }
}
```

---

## Notlar
- Tüm sepet işlemleri için kullanıcı girişi (auth) gereklidir.
- Sepet işlemleri hem tekil ürünler hem de bundle (paket) ürünler için desteklenir.
- Hatalı isteklerde uygun hata mesajları ve HTTP kodları döner.
- Sepetle ilgili iş mantığı ve validasyonlar backend'de controller/service/model katmanlarında yer alır. 