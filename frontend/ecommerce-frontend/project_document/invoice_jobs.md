# E-Fatura (EDM) Entegrasyon Görev Planı

Bu dosya, EDM e-Fatura entegrasyonu için atılacak adımları ve yapılacak işleri teknik görevler halinde sıralar.

---

## Ön Koşullar ve Hazırlık

1. Ortam Değişkenleri
   - `.env.local` içine eklenir:
     - `EDM_ENDPOINT`, `EDM_WSDL_URL`, `EDM_USERNAME`, `EDM_PASSWORD`, `EDM_VKN`
     - Sertifika gerekiyorsa: `EDM_CERT_PATH`, `EDM_CERT_PASSWORD`
2. Sertifikalar
   - `certificates/` klasörüne kurum sertifikaları konumlandırılır.
   - Gerekirse PFX/PEM format dönüşümleri hazırlanır.
3. Ağ ve Güvenlik
   - Test/Prod endpoint’lerine çıkış izni ve TLS doğrulaması.
   - IP whitelisting gerekiyorsa ilgili IP’ler açılır.

---

## Backend İyileştirmeleri (API Katmanı)

1. UBL Üretim Servisi
   - Order verisinden UBL 2.1 fatura XML’i üretecek yardımcı servis oluştur.
   - KDV/matrah/genel toplam ve satır kalemleri eksiksiz eşle.
   - Firma/Alıcı bilgilerinin zorunlu alan doğrulamaları.

2. EDM SOAP Client
   - WSDL’den tipler/istek-yanıt sarmalayıcıları üret veya generic SOAP client kullan.
   - Operasyonlar: `Gonder`, `FaturaStatuSorgulama`, `FaturaIndir`, `FaturaPDFGoruntule`, `GidenFaturaListeleme`.
   - Hata yönetimi ve geri dönüş map’leme (`EDM_*` kodları → app error messages).

3. Fatura Kaydı ve Durum Takibi (DB)
   - `Order` veya ayrı `Invoice` koleksiyonu/tabloda şu alanlar:
     - `ettn`, `envelopeId`, `status`, `gibStatus`, `sentAt`, `lastCheckedAt`, `pdfReady`.
   - `send` sonrası kayıt ve `status` güncellemeleri.

4. REST Endpoint’leri (Frontend tüketimi)
   - `POST /api/invoices/:orderId/send` → UBL oluştur, EDM `Gonder` çağır, `ettn` döndür.
   - `GET /api/invoices/:orderId/status` → `FaturaStatuSorgulama` ile güncel durumu döndür (cache’li).
   - `GET /api/invoices/:orderId/pdf` → `FaturaPDFGoruntule` Base64 al, güvenli indirme.
   - `GET /api/invoices/:orderId/xml` → `FaturaIndir` (UBL/XML) güvenli indirme.
   - Admin listeleri için: `GET /api/invoices?type=&status=&page=`.

5. Cron/Job (Durum İzleme ve Retry)
   - `edm:poll-status` (*/5-15 dk): `status in (sent, processing)` olan faturaları `FaturaStatuSorgulama` ile güncelle.
   - Retry politikası: 3-5 kez exponential backoff, sonra manuel işaretleme.

---

## Frontend Entegrasyonları

1. Admin Paneli
   - `app/admin/invoices` sayfası: EDM durumu, ETTN, tarihçeler, PDF/XML indirme butonları, yeniden gönder/yeniden kontrol.
   - Filtreler: `type`, `status`, `dateRange`.

2. Sipariş Akışı
   - Ödeme onayı sonrası (B2B müşteriler için) `send invoice` tetikleme.
   - Kullanıcıya bildirim: “Faturanız GİB’e iletildi / onaylandı / reddedildi” durumları.

3. Müşteri Hesabım
   - `Hesabım > Siparişlerim > Faturalarım`: PDF indirme, durum görüntüleme (yalnızca yetkili kullanıcı).

---

## Validasyonlar ve İş Kuralları

- Mükellef kontrolü: Alıcı VKN’nin e-Fatura mükellefi olup olmadığını EDM üzerinden veya GİB listesinden doğrula (opsiyonel endpoint).
- B2B/B2C ayrımı: B2C için e-Arşiv süreci ayrı tutulur; B2B için e-Fatura gönderimi.
- Seri/Numara politikası: Mevcutta varsa seri-no üretimi uyarlanır; yoksa EDM tarafında otomatik.
- Para birimi ve KDV oran eşleşmeleri.

---

## Loglama ve Gözlemlenebilirlik

- Audit log: `send`, `status poll`, `download` işlemlerini kullanıcı, zaman ve sonuçla kaydet.
- Maskelenmiş log: VKN/TCKN ve kişisel veriler maskelenir.
- Alarm: 5xx hata oranı veya ardışık retry eşiği aşıldığında uyarı.

---

## Güvenlik

- Endpoint’lerde yetkilendirme: Admin veya ilgili siparişin sahibi.
- Dosya indirme URL’leri kısa süreli imzalı link ile.
- Sertifika ve kimlik bilgilerinin gizli yönetimi (env/secrets vault).

---

## Test Senaryoları (Kısa Liste)

- Başarılı gönderim: `Gonder` → `KABUL`, ETTN kaydı.
- Statü akışı: `processing` → `gib_approved`.
- Red/İade: `gib_rejected` akışı ve hata mesajlarının yüzeye çıkarılması.
- PDF/XML indirme: Doğru içerik ve yetki kontrolü.
- Ağ/timeout: Retry ve kullanıcıya düzgün hata iletisi.

---

## Yayına Alma

- Test ortamında örnek veri ile UAT onayı.
- Prod kimlik bilgileri ve endpoint değişimi.
- İlk hafta sıkı izleme ve hata dashboard’u.

---

## Bağımlılıklar ve Riskler

- Üretici WSDL/şema değişiklikleri.
- Sertifika süresi dolması.
- GİB servis gecikmeleri ve yoğun dönemlerde rate limit.

---

## Teslimatlar

- `project_document/edm_api_doc.md` tamamlandı.
- Backend servisler ve endpoint’ler (listelendi).
- Admin UI geliştirmeleri.
- Cron/job yapılandırması.
- Test raporu ve UAT onayı. 