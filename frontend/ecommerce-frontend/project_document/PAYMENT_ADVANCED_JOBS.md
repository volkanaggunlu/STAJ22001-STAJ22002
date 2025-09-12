---
# Kupon Kodu Yönetimi - Yapılması Gerekenler

1. Kupon kodu ve indirim bilgisini global bir store’da (ör. Zustand) tut. ✅
2. Kupon kodu uygulama işlemini hem sepet ana sayfasında hem CartDrawer’da aynı şekilde (API’ye bağlı) yap. ✅
3. Kupon kodu uygulama işlemini /api/coupon/apply endpointine bağla ve store ile senkronize et. ✅
4. Kupon kodu ve indirim bilgisi ödeme sayfasına otomatik taşınmalı ve özetlenmeli. ✅
5. Kullanıcı isterse ödeme sayfasında kuponu kaldırabilmeli veya yeni bir kod deneyebilmeli. ✅
6. Sipariş oluşturulurken kullanılan kupon kodu backend’e gönderilmeli. ✅
7. Kupon kodu ile ilgili tüm feedback’ler (başarı, hata, loading) kullanıcıya gösterilmeli. ✅

---

# Kupon Kodu Yönetimi ve Entegrasyon Notları

- Kupon kodu hem sepet hem ödeme (checkout) sayfasında girilebilmeli. ✅
- Sepet sayfasında girilen ve onaylanan kupon, ödeme sayfasında da otomatik olarak uygulanmalı ve özetlenmeli. ✅
- Ödeme sayfasında kullanıcı isterse kuponu kaldırabilmeli veya yeni bir kod deneyebilmeli. ✅
- Kupon kodu ve indirim bilgisi, global state (ör. Zustand store) veya context ile yönetilmeli. ✅
- Sipariş oluşturulurken, kullanılan kupon kodu backend’e gönderilmeli. ✅
- Kupon kodu değişirse, hem sepet hem ödeme sayfası güncellenmeli. ✅
- Hatalı/iptal edilen kuponlar için anında feedback verilmeli. ✅

---

# Ödeme Sayfası Gelişmiş Görevler

## 1. Kupon Kodu Yönetimi - Yapılması Gerekenler
- [x] Kupon kodu ve indirim bilgisini global bir store'da (ör. Zustand) tut ✅
- [x] Sepet sayfasında kupon kodu girişi ve uygulama ✅
- [x] Ödeme sayfasında kupon kodu girişi ve uygulama ✅
- [x] Kupon kodu uygulama işlemini /api/coupon/apply endpointine bağla ✅
- [x] Store ile senkronize et ✅
- [x] Sipariş oluşturma görevi ile devam et ✅

## 2. Sipariş Oluşturma ve API Entegrasyonu
- [x] API eksikse, sipariş oluşturma için mock endpoint kullan ✅
- [x] Sipariş oluşturma formunu backend API'sine bağla ✅
- [x] Hata yönetimi ve loading durumları ekle ✅
- [x] Başarılı sipariş sonrası yönlendirme ✅

## 3. Kullanıcı Deneyimi (UX)
- [x] Teslimat notu, kargo tipi, teslimat tarihi gibi alanlar daha detaylı olabilir (temel düzeyde mevcut, gelişmişi TODO) ✅
- [x] Form validasyonu ve hata mesajları ✅
- [x] Loading durumları ve feedback ✅
- [x] Responsive tasarım ✅

## 4. Dinamik Veri Entegrasyonu
- [x] Kargo seçenekleri için hook oluştur (useShippingOptions) ✅
- [x] Ödeme yöntemleri için hook oluştur (usePaymentMethods) ✅
- [x] Kullanıcı adresleri için hook oluştur (useUserAddresses) ✅
- [x] Fatura adresleri için hook oluştur (useInvoiceAddresses) ✅
- [x] Banka hesap bilgileri için hook oluştur (useBankAccounts) ✅
- [x] Yasal linkler için hook oluştur (useLegalLinks) ✅
- [x] KVKK metni için hook oluştur (useKvkkText) ✅
- [x] Kampanya sistemi için hook oluştur (useApplicableCampaigns, useSuggestedCampaign) ✅
- [x] E-posta servisleri için hook oluştur (useEmailStatus, useEmailTest) ✅

## 5. Yasal ve Güvenlik Gereklilikleri
- [x] KVKK/GDPR uyumluluğu için açık aydınlatma metni ve onay kutusu ✅
- [x] Gizlilik politikası ve mesafeli satış sözleşmesi linkleri ✅

## 6. Ekstra Özellikler (Büyük Siteler için)
- [x] Sipariş geçmişi ve tekrar sipariş (mock ile başla) ✅
- [ ] Fatura PDF indirme (mock)
- [ ] Kargo takip entegrasyonu (mock)
- [ ] Çoklu dil ve para birimi desteği (mock)
- [ ] Guest checkout (misafir olarak sipariş)
- [ ] Adres ve ödeme bilgilerinin otomatik doldurulması (tarayıcı veya profil üzerinden)

## 7. PayTR Kredi Kartı ile Ödeme Entegrasyonu
- [x] Ödeme adımında "Kredi Kartı (PayTR)" seçildiğinde, PayTR iframe'i ile ödeme alınacak ✅
- [x] Kart bilgileri frontend'de tutulmayacak, doğrudan iframe'e girilecek ✅
- [x] Sipariş ve müşteri bilgileri backend'e gönderilecek, backend PayTR API'sinden iframe token alacak ✅
- [x] Frontend, bu token ile PayTR iframe'ini ekrana gömecek ✅
- [x] Ödeme sonucu için PayTR callback endpointi backend'de olacak ✅
- [x] Başarılı/başarısız ödeme sonrası kullanıcıya feedback gösterilecek ✅
- [ ] 3D Secure ve SSL desteği zorunlu (canlıda)

## 8. Yeni Backend API Entegrasyonları
### 8.1 Kampanya Sistemi
- [x] `/api/campaigns/applicable` endpointi ile uygun kampanyaları getir ✅
- [x] `/api/campaigns/suggest` endpointi ile en iyi kampanya önerisini al ✅
- [x] Kampanya otomatik uygulama özelliği ekle ✅

### 8.2 Yasal Dokümanlar
- [x] `/api/legal/links` endpointi ile yasal linkleri getir ✅
- [x] `/api/legal/kvkk-text` endpointi ile KVKK metnini getir ✅
- [x] Ödeme sayfasında yasal onay kutularını dinamik hale getir ✅

### 8.3 Banka Hesap Bilgileri
- [x] `/api/payments/bank-accounts` endpointi ile havale/EFT bilgilerini dinamik getir ✅
- [x] Havale/EFT seçildiğinde banka bilgilerini göster ✅

### 8.4 E-posta Servisleri
- [x] `/api/email/status` endpointi ile e-posta durumunu kontrol et ✅
- [x] Sipariş onay e-postası gönderim entegrasyonu ✅

## 9. Gelişmiş Özellikler
### 9.1 Sipariş Yönetimi
- [x] `/api/orders` endpointi ile sipariş listesi ✅
- [x] `/api/orders/:orderId` endpointi ile sipariş detayı ✅
- [x] Sipariş geçmişi sayfası oluştur ✅
- [x] Sipariş detay sayfası oluştur ✅
- [x] Sipariş filtreleme ve sayfalama ✅
- [x] Sipariş durumu göstergeleri ✅

## 10. Admin Panel Özellikleri
### 10.1 E-posta Yönetimi
- [x] E-posta servis durumu kontrolü ✅
- [x] Test e-postası gönderme ✅
- [x] E-posta yönetimi sayfası ✅

## Tamamlanan Özellikler
✅ Kupon kodu global store entegrasyonu
✅ Sipariş oluşturma API entegrasyonu
✅ PayTR ödeme entegrasyonu
✅ Dinamik veri hook'ları
✅ Yasal doküman entegrasyonu
✅ Kampanya sistemi entegrasyonu
✅ Banka hesap bilgileri entegrasyonu
✅ E-posta servisleri entegrasyonu
✅ Sipariş yönetimi sayfaları
✅ Admin panel e-posta yönetimi

## Kalan Görevler
- [ ] Fatura PDF indirme
- [ ] Kargo takip entegrasyonu
- [ ] Çoklu dil desteği
- [ ] Guest checkout
- [ ] Kullanıcı profil yönetimi
- [ ] Ürün yönetimi
- [ ] 3D Secure entegrasyonu 