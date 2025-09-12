# Backend Eksik Endpoint'ler - Frontend İhtiyaçları

Bu dosya, frontend uygulamasının düzgün çalışması için backend'e eklenmesi gereken eksik endpoint'leri içerir.

---

## 🚨 **ÖNCELİK 1: FATURA ADRESLERİ ENDPOINT'LERİ**

### Eksik Endpoint'ler:
1. `GET /api/users/invoice-addresses` - Fatura adresleri listesi
2. `POST /api/users/invoice-addresses` - Fatura adresi ekleme
3. `PUT /api/users/invoice-addresses/:id` - Fatura adresi güncelleme
4. `DELETE /api/users/invoice-addresses/:id` - Fatura adresi silme

### Frontend Etkisi:
- ❌ Fatura adresi ekleme çalışmıyor (404 hatası)
- ❌ Fatura adresi listesi yüklenmiyor
- ❌ Fatura adresi düzenleme/silme çalışmıyor

### Beklenen Response Formatı:
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

### POST Request Body:
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

### Backend Implementation Önerisi:
```javascript
// routes/userRoutes.js
router.get('/invoice-addresses', auth, userController.getInvoiceAddresses);
router.post('/invoice-addresses', auth, userController.addInvoiceAddress);
router.put('/invoice-addresses/:id', auth, userController.updateInvoiceAddress);
router.delete('/invoice-addresses/:id', auth, userController.deleteInvoiceAddress);

// controllers/userController.js
exports.getInvoiceAddresses = async (req, res) => {
  try {
    const addresses = await User.findById(req.user.id).select('invoiceAddresses');
    res.json({
      success: true,
      data: {
        invoiceAddresses: addresses.invoiceAddresses || []
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Fatura adresleri alınamadı' }
    });
  }
};

exports.addInvoiceAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.invoiceAddresses.push(req.body);
    await user.save();
    
    res.json({
      success: true,
      message: 'Fatura adresi başarıyla eklendi',
      data: { address: req.body }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: { message: 'Fatura adresi eklenemedi' }
    });
  }
};
```

---

## 📋 **ÖNCELİK 2: SİPARİŞ DETAY ENDPOINT'İ**

### Eksik Endpoint:
- `GET /api/orders/:orderId` - Tekil sipariş detayı

### Frontend Etkisi:
- ❌ Sipariş detay sayfası çalışmıyor (404 hatası)

### Beklenen Response Formatı:
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

---

## 🚀 **ÖNCELİK SIRASI**

1. **YÜKSEK**: Fatura adresleri endpoint'leri (404 hatası)
2. **YÜKSEK**: Sipariş detay endpoint'i (404 hatası)
3. **ORTA**: Email servisleri
4. **DÜŞÜK**: Dinamik içerik endpoint'leri

---

**Backend Geliştirici Notu**: Bu endpoint'ler frontend'in düzgün çalışması için kritik öneme sahiptir. Özellikle fatura adresleri endpoint'leri acil olarak eklenmelidir. 