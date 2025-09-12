# Cart (Sepet) API Dokümantasyonu

Bu doküman, frontend geliştiricileri için sepet (cart) işlemlerine dair tüm endpointleri, gönderilen ve alınan verileri, örnek istek/yanıtları içerir.

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
      "_id": "665f8a123456789abcdef01",
      "userId": "665f8a123456789abcdefff",
      "items": [
        {
          "product": {
            "id": "665f8a123456789abcde111",
            "name": "iPhone 15 Pro",
            "slug": "iphone-15-pro",
            "brand": "Apple",
            "image": "https://cdn.site.com/iphone.jpg",
            "sku": "IPH15PRO-256GB"
          },
          "quantity": 2,
          "price": 499.99,
          "originalPrice": 599.99,
          "addedAt": "2024-06-10T12:34:56.789Z",
          "bundledProducts": []
        }
      ],
      "totalItems": 2,
      "subtotal": 999.98,
      "totalSavings": 200,
      "lastModified": "2024-06-10T12:34:56.789Z",
      "isActive": true,
      "createdAt": "2024-06-10T12:34:56.789Z",
      "updatedAt": "2024-06-10T12:34:56.789Z"
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
  "productId": "665f8a123456789abcde111",
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

### PUT `/api/cart/:productId`
Sepetteki bir ürünün miktarını günceller.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**URL Parametresi:**
- `:productId` → Güncellenecek ürünün ID'si

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
  "data": {
    "cart": { /* ... güncel sepet ... */ }
  }
}
```

---

## 4. Sepetten Ürün Çıkar

### DELETE `/api/cart/:productId`
Sepetten bir ürünü tamamen çıkarır.

**Headers:**
```
Authorization: Bearer {token}
```

**Yanıt:**
```json
{
  "success": true,
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
  "data": {
    "cart": { "items": [], "totalItems": 0, "subtotal": 0 }
  }
}
```

---

## 6. Sepet Özeti (Varsa)

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
        "subtotal": 999.98,
        "discount": 200,
        "tax": 180.00,
        "shipping": 0,
        "total": 1179.98
      },
      "items": [
        {
          "name": "iPhone 15 Pro",
          "quantity": 2,
          "price": 499.99,
          "total": 999.98
        }
      ]
    }
  }
}
```

---

## Notlar
- Tüm sepet işlemleri için kullanıcı girişi (auth) gereklidir.
- Sepet işlemleri hem tekil ürünler hem de bundle (paket) ürünler için desteklenir.
- Hatalı isteklerde uygun hata mesajları ve HTTP kodları döner.
- Sepetle ilgili iş mantığı ve validasyonlar backend'de controller/service/model katmanlarında yer alır. 