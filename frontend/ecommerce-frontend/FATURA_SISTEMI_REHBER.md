# 🧾 **E-TİCARET FATURA SİSTEMİ - PROFESYONel REHBER**

## 📋 **Temel Kavramlar**

### **1. Fatura Türleri**

#### **A. Bireysel Müşteriler (B2C)**
```
PERAKENDE SATIŞ FATURASI
- Müşteri: Gerçek kişi
- TC Kimlik: Opsiyonel (5000₺ altında)
- KDV: Dahil fiyat gösterimi
- Yasal gereklilik: Basit
```

#### **B. Kurumsal Müşteriler (B2B)**
```
TİCARİ FATURA
- Müşteri: Tüzel kişi (şirket)
- Vergi No: Zorunlu
- KDV: Ayrı gösterim
- Yasal gereklilik: Detaylı
```

---

## 🏢 **Kurumsal Fatura Detayları**

### **Zorunlu Bilgiler:**
1. **Firma Unvanı:** "ABC Teknoloji Ltd. Şti."
2. **Vergi Numarası:** 10 haneli numara
3. **Vergi Dairesi:** "Kadıköy Vergi Dairesi"
4. **Adres:** Tam açık adres
5. **Yetkili Kişi:** İmza yetkilisi bilgileri

### **Opsiyonel Bilgiler:**
- MERSIS No
- Ticaret Sicil No
- E-Fatura adresi (@hs01, @hs02)

---

## 💻 **Teknik Implementasyon**

### **1. Database Schema Güncellemeleri**

#### **A. Users/Customers Tablosu**
```javascript
// Mevcut schema'ya eklenecek
const userSchema = {
  // ... mevcut alanlar
  
  // Kurumsal bilgiler
  corporateInfo: {
    companyName: String,
    taxNumber: String,        // 10 haneli vergi numarası
    taxOffice: String,        // "Kadıköy Vergi Dairesi"
    mersisNo: String,         // MERSIS numarası (opsiyonel)
    tradeRegistryNo: String,  // Ticaret sicil no (opsiyonel)
    eInvoiceAddress: String,  // E-fatura adresi (opsiyonel)
    
    // Yetkili kişi bilgileri
    authorizedPerson: {
      firstName: String,
      lastName: String,
      title: String,         // "Satın Alma Müdürü"
      email: String,
      phone: String
    },
    
    // Doğrulama durumu
    isVerified: {
      type: Boolean,
      default: false
    },
    verificationDate: Date,
    verificationDocuments: [String] // Doküman URL'leri
  }
}
```

#### **B. Orders Tablosu**
```javascript
const orderSchema = {
  // ... mevcut alanlar
  
  // Fatura bilgileri
  invoice: {
    type: {
      type: String,
      enum: ['retail', 'commercial'], // perakende vs ticari
      required: true
    },
    number: String,           // 2025000001
    series: String,           // "A", "B" gibi seri
    date: Date,
    
    // KDV detayları
    vatDetails: [{
      rate: Number,           // 20, 18, 8, 1, 0
      baseAmount: Number,     // KDV matrahı
      vatAmount: Number,      // KDV tutarı
      description: String     // "Ürün satışı", "Hizmet"
    }],
    
    // E-Fatura bilgileri
    eInvoice: {
      uuid: String,           // E-fatura UUID
      status: String,         // "sent", "delivered", "read"
      gib_status: String,     // GİB durumu
      xml_path: String,       // XML dosya yolu
      pdf_path: String        // PDF dosya yolu
    }
  }
}
```

### **2. Frontend Form Güncellemeleri**

#### **A. Kurumsal Kayıt Formu**
```tsx
// components/forms/CorporateRegistrationForm.tsx
const CorporateRegistrationForm = () => {
  const [formData, setFormData] = useState({
    // Şirket bilgileri
    companyName: '',
    taxNumber: '',
    taxOffice: '',
    mersisNo: '',
    
    // Yetkili kişi
    authorizedPerson: {
      firstName: '',
      lastName: '',
      title: '',
      email: '',
      phone: ''
    },
    
    // Adres
    address: {
      title: 'Merkez Ofis',
      street: '',
      district: '',
      city: '',
      postalCode: '',
      country: 'Türkiye'
    }
  })
  
  // Vergi numarası doğrulama
  const validateTaxNumber = async (taxNumber: string) => {
    try {
      const response = await fetch(`/api/validate-tax-number/${taxNumber}`)
      const result = await response.json()
      return result.isValid
    } catch (error) {
      return false
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form alanları */}
    </form>
  )
}
```

#### **B. Checkout'ta Fatura Türü Seçimi**
```tsx
// components/checkout/InvoiceTypeSelector.tsx
const InvoiceTypeSelector = ({ customerType, setCustomerType }) => {
  return (
    <div className="space-y-4">
      <Label>Fatura Türü</Label>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Bireysel Fatura */}
        <Card 
          className={`cursor-pointer ${customerType === 'bireysel' ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => setCustomerType('bireysel')}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <User className="h-6 w-6 text-blue-600" />
              <div>
                <h3 className="font-semibold">Bireysel Fatura</h3>
                <p className="text-sm text-gray-600">Kişisel alışverişler için</p>
                <p className="text-xs text-gray-500">KDV dahil fiyat</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Kurumsal Fatura */}
        <Card 
          className={`cursor-pointer ${customerType === 'firma' ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => setCustomerType('firma')}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Building className="h-6 w-6 text-blue-600" />
              <div>
                <h3 className="font-semibold">Kurumsal Fatura</h3>
                <p className="text-sm text-gray-600">Şirket alışverişleri için</p>
                <p className="text-xs text-gray-500">KDV ayrı gösterim</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Kurumsal fatura seçildiğinde ek bilgiler */}
      {customerType === 'firma' && (
        <Alert className="bg-blue-50 border-blue-200">
          <Building className="h-4 w-4" />
          <AlertDescription>
            <strong>Kurumsal fatura</strong> için vergi numarası ve firma unvanı zorunludur.
            Fatura şirket adresine kesilir ve KDV ayrı gösterilir.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
```

### **3. Backend API Güncellemeleri**

#### **A. Vergi Numarası Doğrulama**
```javascript
// routes/validation.js
router.get('/validate-tax-number/:taxNumber', async (req, res) => {
  try {
    const { taxNumber } = req.params
    
    // Temel format kontrolü
    if (!/^\d{10}$/.test(taxNumber)) {
      return res.json({ isValid: false, message: 'Vergi numarası 10 haneli olmalıdır' })
    }
    
    // GİB API ile doğrulama (opsiyonel)
    // const gibResult = await validateWithGIB(taxNumber)
    
    // Basit algoritma ile kontrol
    const isValid = validateTaxNumberAlgorithm(taxNumber)
    
    res.json({ 
      isValid, 
      message: isValid ? 'Geçerli vergi numarası' : 'Geçersiz vergi numarası' 
    })
  } catch (error) {
    res.status(500).json({ error: 'Doğrulama hatası' })
  }
})

// Vergi numarası algoritması
function validateTaxNumberAlgorithm(taxNumber) {
  const digits = taxNumber.split('').map(Number)
  const checksum = digits[9]
  
  let sum = 0
  for (let i = 0; i < 9; i++) {
    const temp = (digits[i] + 9 - i) % 10
    sum += temp * (2 ** (9 - i)) % 9
  }
  
  return (sum % 10) === checksum
}
```

#### **B. Fatura Oluşturma Service**
```javascript
// services/InvoiceService.js
class InvoiceService {
  // Fatura numarası oluştur
  static async generateInvoiceNumber(type = 'retail') {
    const year = new Date().getFullYear()
    const series = type === 'commercial' ? 'A' : 'B'
    
    const lastInvoice = await Invoice.findOne({
      'invoice.series': series,
      createdAt: { $gte: new Date(year, 0, 1) }
    }).sort({ 'invoice.number': -1 })
    
    const nextNumber = lastInvoice ? 
      parseInt(lastInvoice.invoice.number) + 1 : 
      1
    
    return `${series}${year}${nextNumber.toString().padStart(6, '0')}`
  }
  
  // KDV hesaplama
  static calculateVAT(items, customerType) {
    const vatRates = {
      electronics: 20,
      books: 8,
      food: 8,
      services: 20
    }
    
    const vatDetails = []
    let totalVat = 0
    
    for (const item of items) {
      const vatRate = vatRates[item.category] || 20
      const baseAmount = item.price * item.quantity
      const vatAmount = customerType === 'firma' ? 
        (baseAmount * vatRate / 100) : 0 // Bireysel'de KDV dahil
      
      vatDetails.push({
        rate: vatRate,
        baseAmount,
        vatAmount,
        description: item.name
      })
      
      totalVat += vatAmount
    }
    
    return { vatDetails, totalVat }
  }
  
  // E-Fatura gönderimi (entegrasyon gerekli)
  static async sendEInvoice(order) {
    try {
      // E-Fatura servis sağlayıcısına gönder
      // Örnek: Foriba, Logo, Uyumsoft
      
      const eInvoiceData = {
        uuid: generateUUID(),
        customerTaxNumber: order.invoiceAddress.taxNumber,
        items: order.items,
        totalAmount: order.totalAmount,
        vatAmount: order.vatAmount
      }
      
      // const response = await eInvoiceProvider.send(eInvoiceData)
      
      return {
        uuid: eInvoiceData.uuid,
        status: 'sent',
        gib_status: 'processing'
      }
    } catch (error) {
      console.error('E-Fatura gönderim hatası:', error)
      throw error
    }
  }
}
```

### **4. Admin Panel Fatura Yönetimi**

#### **A. Fatura Listesi**
```tsx
// app/admin/invoices/page.tsx
const InvoicesPage = () => {
  const [invoices, setInvoices] = useState([])
  const [filters, setFilters] = useState({
    type: 'all', // 'retail', 'commercial', 'all'
    status: 'all',
    dateRange: [null, null]
  })
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Fatura Yönetimi</h1>
        <Button onClick={() => exportInvoices()}>
          <Download className="h-4 w-4 mr-2" />
          Fatura İndir
        </Button>
      </div>
      
      {/* Filtreler */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-4 gap-4">
            <Select value={filters.type} onValueChange={(value) => 
              setFilters(prev => ({ ...prev, type: value }))
            }>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Faturalar</SelectItem>
                <SelectItem value="retail">Perakende Satış</SelectItem>
                <SelectItem value="commercial">Ticari Fatura</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Diğer filtreler */}
          </div>
        </CardContent>
      </Card>
      
      {/* Fatura tablosu */}
      <InvoiceTable invoices={invoices} />
    </div>
  )
}
```

---

## 📊 **Fatura İş Akışı**

### **1. Sipariş → Fatura Süreci**
```
1. Sipariş Oluşturuldu
   ↓
2. Ödeme Onaylandı
   ↓
3. Fatura Oluştur
   ├─ Fatura No Üret
   ├─ KDV Hesapla
   ├─ PDF Oluştur
   └─ E-Fatura Gönder (kurumsal)
   ↓
4. Müşteriye Bildirim
   ↓
5. Admin Onayı (gerekirse)
```

### **2. E-Fatura Entegrasyonu**
```
Kurumsal Müşteri
   ↓
E-Fatura Adresi Kontrolü
   ├─ Var → E-Fatura Gönder
   └─ Yok → PDF Fatura Email
```

---

## 🚨 **Yasal Gereklilikler**

### **1. KDV Oranları (2025)**
- **Genel Oran:** %20
- **İndirimli Oran:** %8 (kitap, gazete, gıda)
- **Süper İndirimli:** %1 (tarım ürünleri)
- **Sıfır Oran:** %0 (ihracat)

### **2. Fatura Saklama**
- **Süre:** 10 yıl
- **Format:** Elektronik + fiziki
- **Yedekleme:** Zorunlu

### **3. E-Fatura Zorunluluğu**
- **Ciro Limit:** Yıllık 5 milyon TL
- **Mükellefiyet:** Aylık 25 bin TL

---

## 🔧 **Kullanılacak Servisler**

### **1. E-Fatura Servis Sağlayıcıları**
- **Foriba:** En popüler
- **Logo:** ERP entegrasyonu güçlü
- **Uyumsoft:** Uygun fiyatlı
- **İnteraktif:** Özelleştirilebilir

### **2. Vergi Numarası Doğrulama**
- **GİB Web Servisi:** Resmi API
- **3. Parti Servisler:** Daha hızlı

### **3. PDF Oluşturma**
- **Puppeteer:** HTML → PDF
- **jsPDF:** Client-side
- **PDFKit:** Node.js

---

## 💡 **Uygulama Önerileri**

### **1. Aşamalı Geliştirme**
1. **Faz 1:** Temel fatura sistemi (PDF)
2. **Faz 2:** E-Fatura entegrasyonu
3. **Faz 3:** Gelişmiş raporlama

### **2. Kullanıcı Deneyimi**
- **Tek tıkla** fatura türü seçimi
- **Otomatik** vergi numarası doğrulama
- **Anlık** fatura önizlemesi
- **Email** otomatik gönderim

### **3. Güvenlik**
- **API keys** güvenli saklama
- **Rate limiting** DDoS koruması
- **Audit logs** iz kaydı
- **Backup** düzenli yedekleme

---

Bu rehber ile profesyonel bir e-ticaret fatura sistemi kurabilirsiniz. 
Hangi bölümü öncelikli olarak implementasyon için ele almak istiyorsunuz? 