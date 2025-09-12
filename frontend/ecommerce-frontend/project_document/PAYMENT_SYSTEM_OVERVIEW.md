# 💳 Ödeme Sistemi Genel Bakış

## 📋 İçindekiler
1. [Sistem Genel Bakış](#sistem-genel-bakış)
2. [PayTR Entegrasyonu](#paytr-entegrasyonu)
3. [Ödeme Yöntemleri](#ödeme-yöntemleri)
4. [API Endpoint'leri](#api-endpointleri)
5. [Güvenlik](#güvenlik)
6. [Test Senaryoları](#test-senaryoları)

---

## 🏗️ Sistem Genel Bakış

E-ticaret platformumuzda PayTR ödeme sistemi entegrasyonu kullanılmaktadır. Sistem aşağıdaki özellikleri destekler:

### Desteklenen Ödeme Yöntemleri
- **Kredi Kartı**: Taksitli/taksitsiz ödeme
- **Havale/EFT**: Banka transferi
- **Kapıda Ödeme**: Nakit/pos ile ödeme

### Sistem Özellikleri
- ✅ Güvenli ödeme işlemi
- ✅ Taksit seçenekleri (1, 3, 6, 9, 12 ay)
- ✅ Kupon sistemi entegrasyonu
- ✅ Otomatik sipariş güncelleme
- ✅ Webhook callback sistemi
- ✅ Test modu desteği

---

## 🔗 PayTR Entegrasyonu

### Kurulum Gereksinimleri
```javascript
// PayTR Konfigürasyonu
const paytrConfig = {
  merchantId: process.env.PAYTR_MERCHANT_ID,
  merchantKey: process.env.PAYTR_MERCHANT_KEY,
  merchantSalt: process.env.PAYTR_MERCHANT_SALT,
  testMode: process.env.NODE_ENV === 'development'
};
```

### Güvenlik Parametreleri
- **Merchant ID**: PayTR'dan alınan mağaza kimliği
- **Merchant Key**: API erişim anahtarı
- **Merchant Salt**: Güvenlik için kullanılan salt değeri
- **Test Mode**: Geliştirme ortamında test modu

---

## 💳 Ödeme Yöntemleri

### 1. Kredi Kartı Ödemesi
```json
{
  "method": "credit-card",
  "installmentCount": 3,
  "cardInfo": {
    "cardNumber": "4111111111111111",
    "expiryMonth": "12",
    "expiryYear": "2025",
    "cvv": "123",
    "cardHolderName": "AHMET YILMAZ"
  }
}
```

### 2. Havale/EFT Ödemesi
```json
{
  "method": "bank-transfer",
  "bankInfo": {
    "bankName": "Garanti BBVA",
    "accountName": "ABC Şirketi",
    "accountNumber": "12345678",
    "iban": "TR123456789012345678901234"
  }
}
```

---

## 🔌 API Endpoint'leri

### 1. Ödeme Yöntemleri Listesi
```http
GET /api/payments/methods
```

**Response:**
```json
{
  "success": true,
  "data": {
    "methods": [
      {
        "value": "credit-card",
        "label": "Kredi Kartı",
        "description": "Güvenli ödeme",
        "fields": ["cardNumber", "expiryMonth", "expiryYear", "cvv", "cardHolderName"],
        "installmentOptions": [1, 3, 6, 9, 12],
        "isActive": true,
        "order": 1
      },
      {
        "value": "bank-transfer",
        "label": "Havale/EFT",
        "description": "Banka hesabına transfer",
        "bankInfo": {
          "bankName": "Garanti BBVA",
          "accountName": "ABC Şirketi",
          "accountNumber": "12345678",
          "iban": "TR123456789012345678901234"
        },
        "isActive": true,
        "order": 2
      }
    ]
  }
}
```

### 2. PayTR Ödeme Başlatma
```http
POST /api/payments/paytr/init
```

**Request Body:**
```json
{
  "orderId": "68875bfee1bff63ffec0252c",
  "installmentCount": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "PayTR ödeme başlatıldı",
  "data": {
    "iframeToken": "eyJ0b2tlbiI6IjEyMzQ1Njc4OTAiLCJzdGF0dXMiOiJzdWNjZXNzIn0=",
    "iframeUrl": "https://www.paytr.com/odeme/guvenli/1234567890",
    "orderId": "68875bfee1bff63ffec0252c",
    "expiresAt": "2025-01-28T11:30:00.000Z"
  },
  "timestamp": "2025-01-28T10:30:00.000Z"
}
```

### 3. PayTR Callback (Webhook)
```http
POST /api/payments/paytr/callback
```

**Request Body (PayTR'dan gelen):**
```json
{
  "merchant_id": "123456",
  "user_ip": "192.168.1.1",
  "merchant_oid": "ORD-20250128-123456",
  "email": "user@example.com",
  "payment_amount": 45489,
  "paytr_token": "abc123def456",
  "user_basket": "[{\"name\":\"Ürün 1\",\"price\":\"25000\",\"quantity\":\"1\"}]",
  "debug_on": 1,
  "no_installment": 0,
  "max_installment": 0,
  "user_name": "Ahmet Yılmaz",
  "user_phone": "+905551234567",
  "user_address": "İstanbul, Türkiye",
  "merchant_ok_url": "https://example.com/success",
  "merchant_fail_url": "https://example.com/fail",
  "timeout_limit": 30,
  "currency": "TL",
  "test_mode": 0,
  "lang": "tr"
}
```

### 4. Ödeme Durumu Kontrolü
```http
GET /api/payments/status/{orderId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "68875bfee1bff63ffec0252c",
    "status": "paid",
    "paymentMethod": "credit-card",
    "amount": 454.89,
    "paidAt": "2025-01-28T10:35:00.000Z",
    "transactionId": "TXN123456789"
  }
}
```

---

## 🔒 Güvenlik

### PayTR Güvenlik Önlemleri
1. **Token Doğrulama**: Her istek için benzersiz token
2. **IP Kontrolü**: Güvenilir IP adreslerinden gelen istekler
3. **Hash Doğrulama**: PayTR'dan gelen verilerin hash kontrolü
4. **Test Modu**: Geliştirme ortamında test modu

### Güvenlik Kontrol Listesi
- [ ] PayTR merchant bilgileri doğru
- [ ] SSL sertifikası aktif
- [ ] Webhook URL'leri güvenli
- [ ] Test modu production'da kapalı
- [ ] Log dosyaları güvenli

---

## 🧪 Test Senaryoları

### 1. Başarılı Ödeme Testi
```javascript
// Test senaryosu: Başarılı kredi kartı ödemesi
const testSuccessfulPayment = {
  orderId: "TEST-ORDER-001",
  paymentMethod: "credit-card",
  amount: 100.00,
  expectedStatus: "paid"
};
```

### 2. Başarısız Ödeme Testi
```javascript
// Test senaryosu: Yetersiz bakiye
const testFailedPayment = {
  orderId: "TEST-ORDER-002",
  paymentMethod: "credit-card",
  amount: 10000.00,
  expectedStatus: "failed",
  expectedError: "insufficient_funds"
};
```

### 3. Taksit Testi
```javascript
// Test senaryosu: 3 taksit ödeme
const testInstallmentPayment = {
  orderId: "TEST-ORDER-003",
  paymentMethod: "credit-card",
  amount: 300.00,
  installmentCount: 3,
  expectedStatus: "paid"
};
```

---

## 📊 Ödeme Durumları

| Durum | Açıklama | Aksiyon |
|-------|----------|---------|
| `pending` | Ödeme bekliyor | Kullanıcıya bilgi ver |
| `processing` | İşleniyor | Loading göster |
| `paid` | Başarılı | Siparişi onayla |
| `failed` | Başarısız | Hata mesajı göster |
| `cancelled` | İptal edildi | Siparişi iptal et |
| `refunded` | İade edildi | İade işlemi yap |

---

## 🔧 Sorun Giderme

### Yaygın Sorunlar

#### 1. PayTR Token Hatası
```javascript
// Çözüm: Merchant bilgilerini kontrol et
const checkMerchantConfig = () => {
  console.log('Merchant ID:', process.env.PAYTR_MERCHANT_ID);
  console.log('Merchant Key:', process.env.PAYTR_MERCHANT_KEY);
  console.log('Merchant Salt:', process.env.PAYTR_MERCHANT_SALT);
};
```

#### 2. Callback Hatası
```javascript
// Çözüm: Webhook URL'ini kontrol et
const webhookUrl = 'https://yourdomain.com/api/payments/paytr/callback';
```

#### 3. SSL Sertifika Hatası
```bash
# SSL sertifikasını kontrol et
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
```

---

## 📚 Ek Kaynaklar

- [PayTR API Dokümantasyonu](https://www.paytr.com/odeme-sistemi/api)
- [PayTR Test Kartları](https://www.paytr.com/odeme-sistemi/test-kartlari)
- [SSL Sertifika Kurulumu](./HTTPS_SETUP.md)
- [Test Senaryoları](./PAYMENT_TEST_SCENARIOS.md)

---

## 🤝 Katkıda Bulunma

Bu dökümantasyonu güncellemek için:
1. Değişiklikleri `project_document/` klasörüne ekleyin
2. Ana indeksi güncelleyin
3. Test senaryolarını kontrol edin 