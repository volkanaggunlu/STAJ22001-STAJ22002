# Backend Eksik Endpoint'ler - Frontend İhtiyaçları

Bu dosya, frontend uygulamasının düzgün çalışması için backend'e eklenmesi gereken eksik endpoint'leri içerir.

---

## ✅ **TAMAMLANAN: FATURA ADRESLERİ ENDPOINT'LERİ**

### ✅ Tamamlanan Endpoint'ler:
1. `GET /api/users/invoice-addresses` - Fatura adresleri listesi ✅
2. `POST /api/users/invoice-addresses` - Fatura adresi ekleme ✅
3. `PUT /api/users/invoice-addresses/:id` - Fatura adresi güncelleme ✅
4. `DELETE /api/users/invoice-addresses/:id` - Fatura adresi silme ✅

### ✅ Frontend Etkisi:
- ✅ Fatura adresi ekleme çalışıyor
- ✅ Fatura adresi listesi yükleniyor
- ✅ Fatura adresi düzenleme/silme çalışıyor

### ✅ Güncellenmiş Response Formatı:
```json
// GET /api/users/invoice-addresses
{
  "success": true,
  "data": {
    "invoiceAddresses": [
      {
        "_id": "665f8a123456789abcde222",
        "title": "Şirket",
        "firstName": "Ahmet",
        "lastName": "Yılmaz",
        "address": "Atatürk Cad. No:1",
        "city": "İstanbul",
        "district": "Kadıköy",
        "postalCode": "34710",
        "phone": "+905551234567",
        "companyName": "ABC Şirketi",
        "taxNumber": "1234567890",
        "isDefault": false
      }
    ]
  }
}
```

### ✅ POST Request Body (firstName/lastName eklendi):
```json
{
  "title": "Şirket",
  "firstName": "Ahmet",
  "lastName": "Yılmaz",
  "address": "Atatürk Cad. No:1",
  "city": "İstanbul",
  "district": "Kadıköy",
  "postalCode": "34710",
  "phone": "+905551234567",
  "companyName": "ABC Şirketi",
  "taxNumber": "1234567890",
  "isDefault": false
}
```

### ✅ Backend Implementation:
```javascript
// routes/userRoutes.js
router.get('/invoice-addresses', auth, userController.getInvoiceAddresses);
router.post('/invoice-addresses', auth, userController.addInvoiceAddress);
router.put('/invoice-addresses/:id', auth, userController.updateInvoiceAddress);
router.delete('/invoice-addresses/:id', auth, userController.deleteInvoiceAddress);

// controllers/userController.js
exports.getInvoiceAddresses = async (req, res) => {
  try {
    const user = await userService.getUserById(req.user._id);
    const invoiceAddresses = user && user.invoiceAddresses ? user.invoiceAddresses : [];
    res.json({
      success: true,
      data: { invoiceAddresses },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Fatura adresleri alınamadı' }
    });
  }
};
```

### ✅ Yapılan Değişiklikler:
1. **User Model**: `invoiceAddressSchema` oluşturuldu (firstName/lastName kaldırıldı)
2. **User Service**: Fatura adresi CRUD fonksiyonları eklendi
3. **User Controller**: Fatura adresi endpoint'leri eklendi
4. **User Routes**: Fatura adresi route'ları eklendi
5. **Validation**: `invoiceAddressValidation` şeması eklendi
6. **Order Model**: Adres şemalarından firstName/lastName kaldırıldı
7. **Order Validation**: Adres validation'larından firstName/lastName kaldırıldı

---

## 📋 **ÖNCELİK 2: SİPARİŞ DETAY ENDPOINT'İ**

### ✅ Tamamlanan Endpoint:
- `GET /api/orders/:orderId` - Tekil sipariş detayı ✅

### ✅ Frontend Etkisi:
- ✅ Sipariş detay sayfası çalışıyor

### ✅ Beklenen Response Formatı:
```json
{
  "success": true,
  "data": {
    "order": {
      "_id": "68875bfee1bff63ffec0252c",
      "orderNumber": "ORD-20250728-374314",
      "userId": { "_id": "...", "firstName": "Ahmet", "lastName": "Yılmaz" },
      "items": [...],
      "shippingAddress": {...},
      "invoiceAddress": {...},
      "payment": { "method": "credit-card", "status": "paid" },
      "coupon": { "code": "WELCOME10", "discountAmount": 50 },
      "campaign": { "name": "Yaz Kampanyası", "discountAmount": 25 },
      "subtotal": 499.99,
      "shippingCost": 29.90,
      "couponDiscount": 50.00,
      "campaignDiscount": 25.00,
      "totalAmount": 454.89,
      "status": "completed",
      "createdAt": "2025-07-28T10:30:00.000Z"
    }
  }
}
```

---

## 🔧 **ÖNCELİK 3: DİĞER EKSİK ENDPOINT'LER**

### Email Servisleri:
- `GET /api/admin/email/status` - Email servis durumu
- `POST /api/admin/email/test` - Test email gönderme

### Dinamik İçerik:
- `GET /api/bank-accounts` - Banka hesap bilgileri
- `GET /api/legal/links` - Yasal doküman linkleri
- `GET /api/legal/kvkk-text` - KVKK metni
- `GET /api/campaigns/applicable` - Uygulanabilir kampanyalar
- `GET /api/campaigns/suggested` - Önerilen kampanyalar

---

## 📝 **NOTLAR**

1. **JWT Authentication**: Tüm endpoint'ler JWT token gerektirir
2. **Validation**: Backend'de input validation eklenmelidir
3. **Error Handling**: Tutarlı hata response formatı kullanılmalı
4. **Rate Limiting**: Mevcut rate limiting kuralları uygulanmalı
5. **Adres Alanları**: firstName ve lastName alanları tüm adres şemalarından kaldırıldı

---

## 🚀 **ÖNCELİK SIRASI**

1. **✅ TAMAMLANDI**: Fatura adresleri endpoint'leri
2. **✅ TAMAMLANDI**: Sipariş detay endpoint'i
3. **ORTA**: Email servisleri
4. **DÜŞÜK**: Dinamik içerik endpoint'leri

---

**Backend Geliştirici Notu**: Fatura adresi endpoint'leri başarıyla tamamlandı. firstName ve lastName alanları tüm adres şemalarından kaldırıldı. Frontend artık fatura adresi yönetimini kullanabilir. 