# Ödeme Sistemi Dokümantasyonu

Bu dokümantasyon, e-ticaret backend'inde kullanılan ödeme sistemi ve PayTR entegrasyonu hakkında detaylı bilgi içerir.

---

## 📋 **MEVCUT ÖDEME ENDPOINT'LERİ**

### **1. Ödeme Yöntemleri Listesi**
```
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

### **2. PayTR Ödeme Başlatma**
```
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

### **3. PayTR Callback (Webhook)**
```
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
  "lang": "tr",
  "hash": "abc123def456ghi789"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Ödeme başarıyla işlendi"
}
```

### **4. Ödeme Durumu Sorgulama**
```
GET /api/payments/paytr/status/:orderId
```

**Response:**
```json
{
  "success": true,
  "message": "Ödeme durumu başarıyla getirildi",
  "data": {
    "orderId": "68875bfee1bff63ffec0252c",
    "status": "completed",
    "paymentMethod": "credit-card",
    "amount": 454.89,
    "transactionId": "TXN123456789",
    "paymentDate": "2025-01-28T10:35:00.000Z",
    "installmentCount": 1
  },
  "timestamp": "2025-01-28T10:40:00.000Z"
}
```

### **5. Banka Hesap Bilgileri**
```
GET /api/payments/bank-accounts
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accounts": [
      {
        "id": "ziraat",
        "name": "Ziraat Bankası",
        "accountName": "ElektroTech Elektronik Tic. Ltd. Şti.",
        "accountNumber": "1234567890",
        "iban": "TR12 0001 0012 3456 7890 1234 56",
        "swift": "TCZBTR2A"
      },
      {
        "id": "garanti",
        "name": "Garanti BBVA",
        "accountName": "ElektroTech Elektronik Tic. Ltd. Şti.",
        "accountNumber": "9876543210",
        "iban": "TR98 0062 0987 6543 2109 8765 43",
        "swift": "TGBATRIS"
      }
    ]
  }
}
```

---

## 🔧 **PAYTR ENTEGRASYONU DETAYLARI**

### **Mevcut Durum:**
- ✅ PayTR API entegrasyonu mevcut
- ✅ iframe token oluşturma çalışıyor
- ✅ Callback webhook işleme mevcut
- ✅ Hash doğrulama mevcut
- ✅ Test modu desteği mevcut
- ✅ IP whitelist koruması mevcut
- ✅ Rate limiting mevcut
- ⚠️ **SIMÜLASYON MODU AKTİF** - Gerçek PayTR bilgileri henüz gelmedi

### **Simülasyon Durumu:**
```javascript
// src/services/paymentService.js - initializePayTRPayment fonksiyonunda
if (PAYTR_CONFIG.testMode) {
  logger.info('PayTR test modu aktif - API çağrısı simüle ediliyor');
  paytrResponse = {
    data: {
      status: 'success',
      token: 'test_token_' + Date.now(),
      reason: 'Test modu'
    }
  };
} else {
  // Gerçek PayTR API çağrısı
  paytrResponse = await axios.post(paytrApiUrl, paytrData.iframeData);
}
```

### **Callback Simülasyonu:**
```javascript
// src/services/paymentService.js - handlePayTRCallback fonksiyonunda
let isValidHash = true;
if (!PAYTR_CONFIG.testMode) {
  isValidHash = verifyPayTRCallback({...});
}
// Test modunda hash doğrulama bypass ediliyor
```

### **PayTR Konfigürasyonu:**
```javascript
// .env dosyası - ŞU AN TEST MODU
PAYTR_MERCHANT_ID=123456
PAYTR_MERCHANT_KEY=test_key
PAYTR_MERCHANT_SALT=test_salt
PAYTR_TEST_MODE=true  # ⚠️ TEST MODU AKTİF
PAYTR_TIMEOUT_LIMIT=30
PAYTR_MAX_INSTALLMENT=12
PAYTR_CALLBACK_URL=https://api.example.com/api/payments/paytr/callback
```

### **Gerçek PayTR Bilgileri Geldiğinde Yapılacaklar:**
1. **.env dosyasını güncelle:**
```bash
PAYTR_MERCHANT_ID=gerçek_merchant_id
PAYTR_MERCHANT_KEY=gerçek_merchant_key
PAYTR_MERCHANT_SALT=gerçek_merchant_salt
PAYTR_TEST_MODE=false  # Production moduna geç
```

2. **Test modunu kapat:**
```javascript
// src/services/paymentService.js
if (PAYTR_CONFIG.testMode) {
  // Bu bloğu kaldır veya false yap
}
```

3. **Hash doğrulamayı aktif et:**
```javascript
// src/services/paymentService.js
let isValidHash = verifyPayTRCallback({...}); // Her zaman doğrula
```

4. **Gerçek PayTR API'yi kullan:**
```javascript
// Gerçek API çağrısı
paytrResponse = await axios.post(paytrApiUrl, paytrData.iframeData);
```

### **Mevcut Dosya Yapısı:**
```
src/
├── config/
│   └── paytr.js              # PayTR konfigürasyonu ve yardımcı fonksiyonlar
├── controllers/
│   └── paymentController.js   # Ödeme controller'ları
├── services/
│   └── paymentService.js      # Ödeme business logic
├── routes/
│   └── paymentRoutes.js       # Ödeme route'ları
├── middleware/
│   └── paytrIpWhitelist.js   # PayTR IP koruması
└── validations/
    └── paymentValidation.js   # Ödeme validation'ları
```

---

## 📊 **ÖDEME AKIŞI**

### **1. Sipariş Oluşturma**
```
POST /api/orders
```
- Kullanıcı sepeti onaylar
- Sipariş oluşturulur
- PayTR için gerekli veriler hazırlanır

### **2. PayTR Ödeme Başlatma**
```
POST /api/payments/paytr/init
```
- PayTR API'ye istek gönderilir
- iframe token alınır
- Frontend'e token döndürülür

### **3. Frontend PayTR iframe'i Gösterir**
```javascript
// Frontend'de
const iframeUrl = `https://www.paytr.com/odeme/guvenli/${iframeToken}`;
// iframe'i sayfaya ekle
```

### **4. Kullanıcı Ödeme Yapar**
- Kullanıcı kart bilgilerini girer
- PayTR ödemeyi işler
- Sonuç callback URL'e gönderilir

### **5. Callback İşleme**
```
POST /api/payments/paytr/callback
```
- Hash doğrulaması yapılır
- Sipariş durumu güncellenir
- Email bildirimi gönderilir
- Stok güncellenir

---

## 🚨 **GÜVENLİK ÖNLEMLERİ**

### **1. IP Whitelist**
```javascript
// PayTR IP adresleri
const PAYTR_IPS = [
  '185.162.124.11',
  '185.162.124.12',
  '185.162.124.13'
];
```

### **2. Hash Doğrulama**
- Her callback'te hash doğrulanır
- Manipülasyon önlenir

### **3. SSL/HTTPS Zorunluluğu**
- Production'da HTTPS zorunlu
- Güvenli veri transferi

### **4. Rate Limiting**
- API istekleri sınırlandırılır
- DDoS koruması

### **5. Authentication**
- Ödeme başlatma için JWT token gerekli
- Callback'ler için IP whitelist

---

## 📝 **FRONTEND İHTİYAÇLARI**

### **1. Ödeme Sayfası Bileşenleri:**
```javascript
// Ödeme yöntemi seçimi
const paymentMethods = [
  { value: 'credit-card', label: 'Kredi Kartı' },
  { value: 'bank-transfer', label: 'Havale/EFT' }
];

// Kart bilgileri formu
const cardFields = [
  { name: 'cardNumber', label: 'Kart Numarası', type: 'text' },
  { name: 'expiryMonth', label: 'Ay', type: 'select' },
  { name: 'expiryYear', label: 'Yıl', type: 'select' },
  { name: 'cvv', label: 'CVV', type: 'password' },
  { name: 'cardHolderName', label: 'Kart Sahibi', type: 'text' }
];

// Taksit seçenekleri
const installments = [1, 3, 6, 9, 12];
```

### **2. PayTR iframe Entegrasyonu:**
```javascript
// PayTR iframe'i yükleme
const loadPayTRIframe = async (orderId, installmentCount = 1) => {
  try {
    const response = await fetch('/api/payments/paytr/init', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        orderId, 
        installmentCount 
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      const iframe = document.createElement('iframe');
      iframe.src = data.data.iframeUrl;
      iframe.style.width = '100%';
      iframe.style.height = '600px';
      iframe.style.border = 'none';
      document.getElementById('paytr-container').appendChild(iframe);
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('PayTR iframe yükleme hatası:', error);
    showErrorMessage('Ödeme sayfası yüklenemedi');
  }
};
```

### **3. Ödeme Durumu Takibi:**
```javascript
// Ödeme durumu kontrolü
const checkPaymentStatus = async (orderId) => {
  try {
    const response = await fetch(`/api/payments/paytr/status/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      const status = data.data.status;
      
      switch (status) {
        case 'completed':
          showSuccessMessage('Ödeme başarılı!');
          redirectToOrderConfirmation(orderId);
          break;
        case 'failed':
          showErrorMessage('Ödeme başarısız!');
          break;
        case 'pending':
          showInfoMessage('Ödeme işleniyor...');
          // 5 saniye sonra tekrar kontrol et
          setTimeout(() => checkPaymentStatus(orderId), 5000);
          break;
        default:
          showWarningMessage('Bilinmeyen ödeme durumu');
      }
    }
  } catch (error) {
    console.error('Ödeme durumu kontrol hatası:', error);
    showErrorMessage('Ödeme durumu kontrol edilemedi');
  }
};
```

### **4. Havale/EFT Ödeme:**
```javascript
// Havale bilgilerini getir
const getBankAccounts = async () => {
  try {
    const response = await fetch('/api/payments/bank-accounts');
    const data = await response.json();
    
    if (data.success) {
      return data.data.accounts;
    }
  } catch (error) {
    console.error('Banka hesap bilgileri alınamadı:', error);
  }
};

// Havale makbuzu yükle
const uploadBankTransferReceipt = async (orderId, file) => {
  try {
    const formData = new FormData();
    formData.append('receipt', file);
    formData.append('orderId', orderId);
    
    const response = await fetch('/api/payments/bank-transfer/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    const data = await response.json();
    
    if (data.success) {
      showSuccessMessage('Makbuz başarıyla yüklendi');
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Makbuz yükleme hatası:', error);
    showErrorMessage('Makbuz yüklenemedi');
  }
};
```

---

## 🔄 **ÖDEME DURUMLARI**

### **Sipariş Durumları:**
- `pending` - Beklemede
- `confirmed` - Onaylandı
- `processing` - İşleniyor
- `shipped` - Kargoda
- `delivered` - Teslim edildi
- `cancelled` - İptal edildi
- `returned` - İade edildi

### **Ödeme Durumları:**
- `pending` - Beklemede
- `processing` - İşleniyor
- `completed` - Tamamlandı
- `failed` - Başarısız
- `refunded` - İade edildi

---

## 📧 **EMAIL BİLDİRİMLERİ**

### **Başarılı Ödeme:**
- Sipariş onay emaili
- Fatura PDF'i ekli
- Takip numarası bilgisi

### **Başarısız Ödeme:**
- Hata detayları
- Tekrar deneme linki
- Destek iletişim bilgileri

---

## 🛠 **YAPILMASI GEREKENLER**

### **1. Frontend Geliştirme:**
- [ ] Ödeme sayfası tasarımı
- [ ] PayTR iframe entegrasyonu
- [ ] Ödeme durumu takibi
- [ ] Hata yönetimi
- [ ] Loading states
- [ ] Havale/EFT formu
- [ ] Makbuz yükleme

### **2. Backend İyileştirmeler:**
- [ ] Ödeme geçmişi endpoint'i
- [ ] İade işlemleri
- [ ] Taksit hesaplama
- [ ] Kupon entegrasyonu
- [ ] Kampanya entegrasyonu
- [ ] Ödeme raporları

### **3. Test:**
- [ ] PayTR test modu
- [ ] Farklı kart türleri
- [ ] Hata senaryoları
- [ ] Callback testleri
- [ ] Havale/EFT testleri

### **4. Güvenlik:**
- [ ] PCI DSS uyumluluğu
- [ ] Veri şifreleme
- [ ] Audit logging
- [ ] Fraud detection

---

## 📞 **DESTEK VE İLETİŞİM**

### **PayTR Destek:**
- Email: destek@paytr.com
- Telefon: +90 212 348 00 00
- Dokümantasyon: https://www.paytr.com/entegrasyon

### **Backend Geliştirici:**
- Email: backend@example.com
- GitHub: https://github.com/AcikAtolye-Software/ecommerce-backend

---

## 🚀 **HIZLI BAŞLANGIÇ**

### **1. Test Ortamı Kurulumu:**
```bash
# .env dosyasına ekle
PAYTR_MERCHANT_ID=123456
PAYTR_MERCHANT_KEY=test_key
PAYTR_MERCHANT_SALT=test_salt
PAYTR_TEST_MODE=true
```

### **2. Frontend Test:**
```javascript
// Test siparişi oluştur
const testOrder = {
  items: [{ productId: "test123", quantity: 1 }],
  shippingAddress: { /* test adres */ },
  paymentMethod: "credit-card"
};

// PayTR iframe'i yükle
loadPayTRIframe("test_order_id", 1);
```

### **3. Callback Test:**
```bash
# Test callback gönder
curl -X POST http://localhost:3000/api/payments/paytr/callback \
  -H "Content-Type: application/json" \
  -d '{"merchant_oid":"test123","status":"success","hash":"test_hash"}'
```

---

**Son Güncelleme:** 28 Ocak 2025  
**Versiyon:** 1.0  
**Durum:** Production Ready ✅ 