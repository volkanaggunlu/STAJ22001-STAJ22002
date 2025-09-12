# 🧪 E-Ticaret Projesi Test Senaryoları

## 📋 Test Genel Bilgileri
- **Test Ortamı:** Development (localhost:3000)
- **Backend URL:** http://localhost:8080
- **Test Kullanıcısı:** Mevcut hesap ile giriş yapılmalı
- **Tarayıcı:** Chrome/Firefox (DevTools açık)

---

## 🏠 1. Coming Soon Sayfası Testleri

### 1.1 Ana Sayfa Yönlendirmesi
- [ ] Ana sayfa (`/`) açıldığında `/coming-soon` sayfasına yönlendirme
- [ ] Coming soon sayfasında header ve footer gizli olmalı
- [ ] Sayfa responsive tasarım (mobil/tablet/desktop)
- [ ] Tüm linkler çalışıyor (sosyal medya, iletişim)

### 1.2 Geliştirici Erişimi
- [ ] `/home` sayfasına direkt erişim (geliştiriciler için)
- [ ] Ana sayfa içeriği `/home` sayfasında görünüyor
- [ ] Header ve footer `/home` sayfasında görünüyor

---

## 🛒 2. Sepet Merge Testleri

### 2.1 Misafir Kullanıcı Sepeti
- [ ] Misafir olarak ürün sepete ekleme
- [ ] Sepet içeriğinin localStorage'da saklanması
- [ ] Sepet toplamının doğru hesaplanması
- [ ] Ürün miktarı artırma/azaltma

### 2.2 Giriş Sonrası Sepet Merge
- [ ] Misafir sepetinde ürün varken giriş yapma
- [ ] Console'da debug logları kontrol etme:
  ```
  [DEBUG] Guest cart items: [...]
  [DEBUG] Backend cart items: [...]
  [DEBUG] Merged cart result: [...]
  ```
- [ ] Aynı ürün varsa miktar artırma
- [ ] Farklı ürünler varsa ekleme
- [ ] Sepet toplamının doğru güncellenmesi

### 2.3 Sepet İçeriği Kontrolü
- [ ] Sepet sayfasında (`/sepet`) ürünlerin görünmesi
- [ ] Cart drawer'da ürünlerin görünmesi
- [ ] Ürün silme işlemi
- [ ] Miktar güncelleme işlemi

---

## 🎫 3. Kupon Kodu Testleri

### 3.1 Kupon Uygulama
- [ ] Sepet sayfasında kupon kodu girişi
- [ ] Geçerli kupon kodu uygulama
- [ ] İndirim tutarının doğru hesaplanması
- [ ] Toplam tutarın güncellenmesi

### 3.2 Kupon Hata Durumları
- [ ] Geçersiz kupon kodu girişi
- [ ] Hata mesajının görünmesi
- [ ] Süresi dolmuş kupon kodu
- [ ] Minimum tutar kontrolü

### 3.3 Kupon Kaldırma
- [ ] Uygulanan kuponu kaldırma
- [ ] Toplam tutarın eski haline dönmesi
- [ ] İndirim tutarının sıfırlanması

---

## 💳 4. Ödeme Sayfası Testleri

### 4.1 Müşteri Tipi Seçimi
- [ ] "Bireysel" seçimi
- [ ] "Firma" seçimi
- [ ] Firma seçildiğinde şirket adı ve vergi no alanlarının görünmesi
- [ ] Bu alanların zorunlu olması

### 4.2 Form Validasyonu
- [ ] Zorunlu alanların boş bırakılması
- [ ] Hata mesajlarının görünmesi
- [ ] Email format kontrolü
- [ ] Telefon format kontrolü
- [ ] Posta kodu kontrolü

### 4.3 Adres Yönetimi
- [ ] Teslimat adresi seçimi
- [ ] Fatura adresi seçimi
- [ ] "Fatura adresi teslimat adresi ile aynı" seçeneği
- [ ] Yeni adres ekleme

### 4.4 Kargo ve Ödeme Seçenekleri
- [ ] Kargo seçeneklerinin yüklenmesi
- [ ] Dinamik kargo ücreti hesaplama
- [ ] Ödeme yöntemlerinin görünmesi
- [ ] Havale/EFT banka bilgilerinin görünmesi

### 4.5 Yasal Onaylar
- [ ] KVKK onayı
- [ ] Mesafeli satış sözleşmesi
- [ ] Gizlilik politikası
- [ ] Tüm onaylar işaretlenmeden sipariş verilememesi

### 4.6 PayTR Entegrasyonu
- [ ] Kredi kartı seçildiğinde PayTR iframe'inin açılması
- [ ] Test kartı ile ödeme
- [ ] Ödeme sonrası yönlendirme

---

## 📦 5. Sipariş Yönetimi Testleri

### 5.1 Sipariş Listesi
- [ ] `/siparislerim` sayfasına erişim
- [ ] Siparişlerin listelenmesi
- [ ] Durum filtreleme (Tümü, Beklemede, Onaylandı, vb.)
- [ ] Sayfalama çalışması

### 5.2 Sipariş Detayı
- [ ] Sipariş detay sayfasına erişim
- [ ] Sipariş bilgilerinin görünmesi
- [ ] Ürün listesinin görünmesi
- [ ] Ödeme bilgilerinin görünmesi
- [ ] Adres bilgilerinin görünmesi

### 5.3 Sipariş Durumu
- [ ] Farklı durumlardaki siparişlerin görünmesi
- [ ] Durum badge'lerinin doğru renkte olması
- [ ] Sipariş tarihlerinin görünmesi

---

## 🏠 6. Adres Yönetimi Testleri

### 6.1 Adres Listesi
- [ ] `/hesabim/adreslerim` sayfasına erişim
- [ ] Teslimat adresleri tab'ı
- [ ] Fatura adresleri tab'ı
- [ ] Adreslerin kart formatında görünmesi

### 6.2 Yeni Adres Ekleme
- [ ] "Yeni Adres Ekle" butonuna tıklama
- [ ] Form alanlarının doldurulması
- [ ] Teslimat adresi ekleme
- [ ] Fatura adresi ekleme (şirket bilgileri ile)
- [ ] Varsayılan adres seçimi

### 6.3 Adres Düzenleme
- [ ] Mevcut adresi düzenleme
- [ ] Form alanlarının doldurulması
- [ ] Değişikliklerin kaydedilmesi

### 6.4 Adres Silme
- [ ] Adres silme butonuna tıklama
- [ ] Onay dialogu
- [ ] Adresin listeden kaldırılması

### 6.5 Form Validasyonu
- [ ] Zorunlu alanların boş bırakılması
- [ ] Fatura adresi için şirket bilgilerinin zorunlu olması
- [ ] Hata mesajlarının görünmesi

---

## 📧 7. Email Yönetimi Testleri (Admin)

### 7.1 Email Durumu
- [ ] `/admin/email` sayfasına erişim
- [ ] Email servis durumunun görünmesi
- [ ] Durum göstergesinin doğru çalışması

### 7.2 Test Email
- [ ] Test email gönderme
- [ ] Başarı/hata mesajının görünmesi
- [ ] Email'in gerçekten gönderilmesi

---

## 🔧 8. Debug ve Hata Testleri

### 8.1 Console Logları
- [ ] Development modunda debug loglarının görünmesi
- [ ] Production modunda logların gizlenmesi
- [ ] API çağrılarının loglanması

### 8.2 Hata Yönetimi
- [ ] Network hatası durumunda hata mesajı
- [ ] API hata durumunda kullanıcı dostu mesaj
- [ ] Loading durumlarının gösterilmesi

### 8.3 JWT Token Yönetimi
- [ ] Token süresi dolduğunda otomatik yenileme
- [ ] Refresh token ile yeni token alma
- [ ] Token olmadan API çağrılarının reddedilmesi

---

## 📱 9. Responsive Tasarım Testleri

### 9.1 Mobil Uyumluluk
- [ ] Mobil cihazlarda sayfa düzeni
- [ ] Touch gesture'ların çalışması
- [ ] Form alanlarının mobil uyumlu olması

### 9.2 Tablet Uyumluluk
- [ ] Tablet boyutlarında sayfa düzeni
- [ ] Grid layout'un doğru çalışması

### 9.3 Desktop Uyumluluk
- [ ] Büyük ekranlarda sayfa düzeni
- [ ] Hover efektlerinin çalışması

---

## 🚀 10. Performans Testleri

### 10.1 Sayfa Yükleme
- [ ] Ana sayfa yükleme süresi
- [ ] Sepet sayfası yükleme süresi
- [ ] Ödeme sayfası yükleme süresi

### 10.2 API Yanıt Süreleri
- [ ] Adres listesi yükleme süresi
- [ ] Sipariş listesi yükleme süresi
- [ ] Kupon uygulama süresi

---

## 📝 Test Raporu Şablonu

### Test Sonuçları
```
Test Tarihi: _______________
Test Eden: _______________
Ortam: Development/Production

✅ Başarılı Testler:
- [ ] Test 1
- [ ] Test 2

❌ Başarısız Testler:
- [ ] Test 3 (Hata: ...)
- [ ] Test 4 (Hata: ...)

⚠️ Dikkat Edilmesi Gerekenler:
- [ ] Test 5 (İyileştirme gerekli)
- [ ] Test 6 (Performans sorunu)

📊 Genel Değerlendirme:
- Toplam Test: ___
- Başarılı: ___
- Başarısız: ___
- Başarı Oranı: ___%
```

---

## 🔍 Test Öncelikleri

### 🔴 Kritik (Mutlaka Test Edilmeli)
1. Sepet merge işlemi
2. Ödeme sayfası form validasyonu
3. JWT token yönetimi
4. Adres ekleme/düzenleme

### 🟡 Önemli (Test Edilmeli)
1. Kupon kodu işlemleri
2. Sipariş listesi ve detayları
3. Responsive tasarım
4. Error handling

### 🟢 Normal (Zaman Varsa Test Edilmeli)
1. Email yönetimi
2. Debug logları
3. Performans testleri
4. Edge case'ler

---

## 🛠️ Test Araçları

### Browser DevTools
- Network tab (API çağrıları)
- Console tab (debug logları)
- Application tab (localStorage)
- Performance tab (yükleme süreleri)

### Test Verileri
- Test kullanıcı bilgileri
- Test kupon kodları
- Test ürün ID'leri
- Test adres verileri

### Test Ortamı
- Backend: http://localhost:8080
- Frontend: http://localhost:3000
- Database: Test veritabanı
- Email: Test email servisi 