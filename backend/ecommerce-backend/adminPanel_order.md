# 📦 Admin Panel - Sipariş Yönetimi API Dokümantasyonu

## 🔐 Kimlik Doğrulama
Tüm admin endpoint'leri için `Authorization: Bearer <token>` header'ı gereklidir. Token admin rolüne sahip olmalıdır.

---

## 📋 1. SİPARİŞ LİSTESİ

### GET `/api/admin/orders`
Tüm siparişleri listeler (filtreleme ve arama ile).

**Query Parameters:**
- `page` (number, optional): Sayfa numarası (varsayılan: 1)
- `limit` (number, optional): Sayfa başına sipariş sayısı (varsayılan: 10)
- `status` (string, optional): Sipariş durumu filtresi
- `search` (string, optional): Sipariş numarası veya müşteri email arama

**Desteklenen Status Değerleri:**
- `pending` - Beklemede
- `confirmed` - Onaylandı
- `processing` - İşleniyor
- `shipped` - Kargoda
- `delivered` - Teslim Edildi
- `cancelled` - İptal Edildi
- `returned` - İade Edildi

**Request Example:**
```http
GET /api/admin/orders?page=1&limit=20&status=pending&search=ORD-2024
Authorization: Bearer <admin_token>
```

**Response Example:**
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
        "items": [
          {
            "productId": "686c0a685d35c600136472f4",
            "name": "Arduino UNO R3 Geliştirme Kartı",
            "image": "http://localhost:8080/api/uploads/products/1752669689798_po4ldcnqnb8.jpg",
            "price": 349.9,
            "originalPrice": 399.9,
            "quantity": 1,
            "sku": "ARD-UNO-R3",
            "type": "product"
          }
        ],
        "totalItems": 1,
        "subtotal": 349.9,
        "shippingCost": 29.9,
        "taxAmount": 0,
        "discountAmount": 70,
        "totalAmount": 309.8,
        "currency": "TRY",
        "status": "pending",
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
        "shippingMethod": "standard",
        "shippingTime": "2-3-days",
        "payment": {
          "method": "credit-card",
          "status": "pending"
        },
        "coupon": null,
        "campaign": {
          "id": "68875a47dacc94c502b5f64e",
          "name": "İlk Sipariş İndirimi",
          "type": "discount",
          "discountType": "percentage",
          "discountValue": 20,
          "discountAmount": 70
        },
        "shippingType": "standart",
        "isGift": false,
        "kvkkConsent": true,
        "privacyPolicyConsent": true,
        "distanceSalesConsent": true,
        "viewCount": 0,
        "source": "website",
        "statusHistory": [
          {
            "status": "pending",
            "date": "2025-07-30T10:55:47.394Z",
            "note": "Sipariş oluşturuldu"
          }
        ],
        "orderDate": "2025-07-30T10:55:47.394Z",
        "createdAt": "2025-07-30T10:55:47.400Z",
        "updatedAt": "2025-07-30T10:55:47.400Z",
        "totalSavings": 120,
        "canBeCancelled": true,
        "canBeReturned": false,
        "isOverdue": false
      }
    ],
    "total": 150,
    "page": 1,
    "totalPages": 8
  }
}
```

---

## 📊 2. SİPARİŞ DETAYI

### GET `/api/orders/:orderId`
Belirli bir siparişin detaylarını getirir.

**Request Example:**
```http
GET /api/orders/6889fa33f227f17f3876ad4c
Authorization: Bearer <admin_token>
```

**Response Example:**
```json
{
  "success": true,
  "order": {
    "_id": "6889fa33f227f17f3876ad4c",
    "orderNumber": "ORD-20250730-947400",
    "userId": {
      "_id": "686b84e52f0f3d0c364be5dd",
      "email": "cnosman14043@gmail.com",
      "firstName": "osmanAdmin",
      "lastName": "canAdmin"
    },
    "status": "pending",
    "customerType": "bireysel",
    "paymentMethod": "credit-card",
    "shippingType": "Standart Kargo",
    "createdAt": "2025-07-30T10:55:47.400Z",
    "updatedAt": "2025-07-30T10:55:47.400Z",
    "items": [
      {
        "productId": "686c0a685d35c600136472f4",
        "productName": "Arduino UNO R3 Geliştirme Kartı",
        "quantity": 1,
        "price": 349.9,
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
    "invoiceAddress": {
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
    "couponDiscount": 0,
    "campaignDiscount": 70,
    "totalAmount": 309.8,
    "notes": {
      "customer": "Müşteri notu",
      "admin": "Admin notu",
      "delivery": "Teslimat notu"
    },
    "trackingNumber": null
  }
}
```

---

## 🔄 3. SİPARİŞ DURUMU GÜNCELLEME

### PUT `/api/admin/orders/:id/status`
Sipariş durumunu günceller.

**Request Body:**
```json
{
  "status": "shipped",
  "note": "Kargo şirketi: Aras Kargo, Takip No: 123456789"
}
```

**Desteklenen Status Değerleri:**
- `pending` - Beklemede
- `confirmed` - Onaylandı
- `processing` - İşleniyor
- `shipped` - Kargoda
- `delivered` - Teslim Edildi
- `cancelled` - İptal Edildi
- `returned` - İade Edildi

**Request Example:**
```http
PUT /api/admin/orders/6889fa33f227f17f3876ad4c/status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "shipped",
  "note": "Kargo şirketi: Aras Kargo"
}
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "_id": "6889fa33f227f17f3876ad4c",
    "orderNumber": "ORD-20250730-947400",
    "status": "shipped",
    "adminNotes": [
      {
        "note": "Kargo şirketi: Aras Kargo",
        "addedBy": "686b84e52f0f3d0c364be5dd",
        "addedAt": "2025-07-30T11:00:00.000Z"
      }
    ],
    "statusHistory": [
      {
        "status": "pending",
        "date": "2025-07-30T10:55:47.394Z",
        "note": "Sipariş oluşturuldu"
      },
      {
        "status": "shipped",
        "date": "2025-07-30T11:00:00.000Z",
        "note": "Sipariş durumu shipped olarak güncellendi"
      }
    ],
    "updatedAt": "2025-07-30T11:00:00.000Z"
  }
}
```

---

## 📦 4. KARGO TAKİP NUMARASI EKLEME

### PUT `/api/admin/orders/:id/tracking`
Siparişe kargo takip numarası ekler.

**Request Body:**
```json
{
  "trackingNumber": "TRK123456789",
  "carrier": "Aras Kargo"
}
```

**Request Example:**
```http
PUT /api/admin/orders/6889fa33f227f17f3876ad4c/tracking
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "trackingNumber": "TRK123456789",
  "carrier": "Aras Kargo"
}
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "_id": "6889fa33f227f17f3876ad4c",
    "orderNumber": "ORD-20250730-947400",
    "tracking": {
      "trackingNumber": "TRK123456789",
      "carrier": "Aras Kargo",
      "trackingUrl": "https://www.araskargo.com.tr/tr/cargo-tracking?code=TRK123456789",
      "estimatedDelivery": "2025-08-02T10:00:00.000Z",
      "actualDelivery": null
    },
    "updatedAt": "2025-07-30T11:00:00.000Z"
  }
}
```

---

## 📅 5. TARİH ARALIĞI SİPARİŞLERİ

### GET `/api/orders/get-by-date`
Belirli tarih aralığındaki siparişleri getirir.

**Query Parameters:**
- `startDate` (string, required): Başlangıç tarihi (YYYY-MM-DD)
- `endDate` (string, required): Bitiş tarihi (YYYY-MM-DD)

**Request Example:**
```http
GET /api/orders/get-by-date?startDate=2025-07-01&endDate=2025-07-31
Authorization: Bearer <admin_token>
```

**Response Example:**
```json
[
  {
    "_id": "6889fa33f227f17f3876ad4c",
    "orderNumber": "ORD-20250730-947400",
    "userId": "686b84e52f0f3d0c364be5dd",
    "items": [...],
    "status": "shipped",
    "totalAmount": 309.8,
    "createdAt": "2025-07-30T10:55:47.400Z",
    "updatedAt": "2025-07-30T11:00:00.000Z"
  }
]
```

---

## 📄 6. FATURA İNDİRME

### GET `/api/orders/:orderId/invoice`
Sipariş için PDF fatura indirir.

**Request Example:**
```http
GET /api/orders/6889fa33f227f17f3876ad4c/invoice
Authorization: Bearer <admin_token>
```

**Response:**
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="fatura_ORD-20250730-947400.pdf"`
- PDF dosyası binary olarak döner

---

## 🔄 7. SİPARİŞ TEKRARLAMA

### POST `/api/orders/:orderId/repeat`
Eski bir siparişi temel alarak yeni sipariş oluşturur.

**Request Example:**
```http
POST /api/orders/6889fa33f227f17f3876ad4c/repeat
Authorization: Bearer <admin_token>
```

**Response Example:**
```json
{
  "success": true,
  "message": "Tekrar sipariş oluşturuldu.",
  "order": {
    "_id": "6889fa34f227f17f3876ad4d",
    "orderNumber": "ORD-20250730-971026",
    "userId": "686b84e52f0f3d0c364be5dd",
    "items": [...],
    "status": "pending",
    "createdAt": "2025-07-30T11:00:00.000Z"
  }
}
```

---

## 📊 8. SİPARİŞ İSTATİSTİKLERİ

### Dashboard İstatistikleri
Admin dashboard'da sipariş istatistikleri için kullanılan veriler:

**Sipariş Durumu Dağılımı:**
- Bekleyen siparişler
- İşlenen siparişler
- Kargodaki siparişler
- Teslim edilen siparişler
- İptal edilen siparişler

**Zaman Bazlı İstatistikler:**
- Günlük sipariş sayısı
- Haftalık sipariş sayısı
- Aylık sipariş sayısı
- Toplam satış tutarı
- Ortalama sipariş tutarı

---

## 🚨 9. HATA KODLARI

### Genel Hata Kodları:
- `401` - Yetkilendirme hatası
- `403` - Erişim reddedildi
- `404` - Sipariş bulunamadı
- `500` - Sunucu hatası

### Özel Hata Mesajları:
```json
{
  "success": false,
  "error": {
    "code": "ORDER_NOT_FOUND",
    "message": "Sipariş bulunamadı"
  }
}
```

---

## 📝 10. NOTLAR VE ÖZELLİKLER

### Sipariş Durumu Geçişleri:
- `pending` → `confirmed` → `processing` → `shipped` → `delivered`
- `pending` → `cancelled` (iptal)
- `delivered` → `returned` (iade)

### Otomatik İşlemler:
- Sipariş durumu değiştiğinde `statusHistory` güncellenir
- Kargo takip numarası eklendiğinde `trackingUrl` otomatik oluşturulur
- Admin notları `adminNotes` dizisinde saklanır

### Güvenlik:
- Tüm endpoint'ler admin rolü gerektirir
- Sipariş verileri kullanıcıya göre filtrelenir
- Sensitif bilgiler (kart numarası vb.) gizlenir

### Performans:
- Sayfalama (pagination) desteklenir
- Populate işlemleri optimize edilmiştir
- Index'ler performans için kullanılır

---

## 🔧 11. FRONTEND ENTEGRASYONU

### Örnek React Hook:
```javascript
const useAdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({});

  const fetchOrders = async (params = {}) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/orders?${new URLSearchParams(params)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setOrders(data.data.orders);
      setPagination(data.data);
    } catch (error) {
      console.error('Siparişler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, status, note) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status, note })
      });
      return await response.json();
    } catch (error) {
      console.error('Sipariş durumu güncellenirken hata:', error);
    }
  };

  return { orders, loading, pagination, fetchOrders, updateOrderStatus };
};
```

### Örnek Vue.js Composable:
```javascript
export const useAdminOrders = () => {
  const orders = ref([]);
  const loading = ref(false);
  const pagination = ref({});

  const fetchOrders = async (params = {}) => {
    loading.value = true;
    try {
      const { data } = await axios.get('/api/admin/orders', { params });
      orders.value = data.data.orders;
      pagination.value = data.data;
    } catch (error) {
      console.error('Siparişler yüklenirken hata:', error);
    } finally {
      loading.value = false;
    }
  };

  return { orders, loading, pagination, fetchOrders };
};
```

---

## 📚 12. EK KAYNAKLAR

- [Order Model Detayları](../src/models/Order.js)
- [Order Service Detayları](../src/services/orderService.js)
- [Admin Controller Detayları](../src/controllers/adminController.js)
- [Order Controller Detayları](../src/controllers/order.js)

---

**Son Güncelleme:** 30 Temmuz 2025  
**Versiyon:** 1.0  
**Backend Geliştirici:** AI Assistant 