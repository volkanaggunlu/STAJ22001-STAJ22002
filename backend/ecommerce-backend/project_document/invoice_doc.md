# E-Fatura / E-Arşiv Entegrasyonu Görev Dokümanı (EDM)

Bu doküman, EDM üzerinden e-Fatura (B2B) ve e-Arşiv (B2C) entegrasyonlarının projeye eklenmesi için backend ve frontend ekiplerinin yerine getirmesi gereken görevleri, API sözleşmelerini, kabul kriterlerini ve yayına alma planını içerir.

- Sağlayıcı: EDM (Edoksis)
- Referans: `project_document/edm_api_doc.md`
- Bağlam: Next.js (App Router), React 19, TS, React Query, Zustand, Tailwind, Axios

---

## 1) Kapsam ve Hedefler

- B2B (Kurumsal) siparişlerde e-Fatura üretimi ve GİB’e gönderim (EDM).
- B2C (Bireysel) siparişlerde e-Arşiv faturası üretimi ve iletimi (EDM).
- Sipariş bazlı fatura durumu takibi, PDF/XML indirme, admin listeleme ve yeniden gönderim.

Başarı ölçütleri:
- Sipariş tamamlandıktan sonra fatura otomatik tetiklenir ve ETTN alınır.
- Fatura durumları periyodik olarak güncellenir (sent/processing/approved/rejected).
- Müşteri ve admin PDF/XML’e yetkili şekilde erişir.

---

## 2) Mimari Özet

- Backend: UBL 2.1 üretimi, EDM SOAP çağrıları (Gonder/Status/PDF/XML), job scheduler, veri kalıcılığı, güvenli indirme.
- Frontend: Checkout’ta fatura tipi (Bireysel/Şirket), adres & vergi alanları; sipariş detayı ve admin’de durum/indirme; API service ve hook’lar.

---

## 3) Ortam Değişkenleri ve Güvenlik (Backend)

Zorunlu:
- `EDM_ENDPOINT`, `EDM_WSDL_URL`, `EDM_USERNAME`, `EDM_PASSWORD`, `EDM_VKN`
Opsiyonel/kurumsal:
- `EDM_CERT_PATH`, `EDM_CERT_PASSWORD`

Güvenlik:
- Kimlik bilgileri secrets store’da; log’larda VKN/TCKN maskelenir.
- İndirme linkleri imzalı ve kısa süreli.

---

## 4) Veri Modeli (Backend)

Sipariş modeline eklenecek alanlar (öneri):
- `order.eInvoice`: `{ ettn, envelopeId, provider: 'EDM', channel: 'einvoice'|'earchive', status, gibStatusHistory[], sentAt, lastCheckedAt }`
Alternatif: Ayrı `Invoice` koleksiyonu ve `orderId` referansı.

Kabul kriteri:
- Fatura gönderimi sonrası `ettn` zorunlu olarak kalıcı hale getirilmeli.

---

## 5) API Sözleşmeleri (Backend)

1) POST `/api/invoices/:orderId/send`
- Amaç: Siparişe bağlı faturayı EDM’e gönderir.
- Body (opsiyonel): `{ mode?: 'auto'|'einvoice'|'earchive' }` (varsayılan `auto` → B2B ise e-Fatura, B2C ise e-Arşiv)
- Response 200:
```json
{
  "success": true,
  "data": { "orderId": "...", "ettn": "urn:uuid:...", "channel": "einvoice", "status": "sent" }
}
```
- Hata: 4xx/5xx, detaylı mesaj ve hata kodu (`EDM_*`).

2) GET `/api/invoices/:orderId/status`
- Amaç: EDM `FaturaStatuSorgulama` ile güncel durumu döndürür (gerekirse poll ederek DB’yi günceller).
- Response 200:
```json
{ "success": true, "data": { "status": "processing", "gibStatusHistory": [ {"at": "...", "status": "sent"} ] } }
```

3) GET `/api/invoices/:orderId/pdf`
- Amaç: EDM `FaturaPDFGoruntule` sonucu Base64 → `application/pdf` indirme.
- Güvenlik: Sadece sipariş sahibi veya admin.

4) GET `/api/invoices/:orderId/xml`
- Amaç: EDM `FaturaIndir` (UBL/XML) indirme.
- Güvenlik: Sadece sipariş sahibi veya admin.

5) GET `/api/invoices`
- Amaç: Admin listesi, filtreler: `?channel=&status=&from=&to=&page=&limit=`
- Response 200: sayfalı özet liste (orderId, ettn, kanal, durum, toplam tutar, müşteri adı/unvan).

Kabul kriteri:
- Tüm endpoint’ler JWT ile korunmalı; role kontrolü (admin/müşteri) sağlanmalı.

---

## 6) Backend Görevleri

6.1 UBL Üretim Servisi
- Sipariş → UBL 2.1 map’leme (gönderici, alıcı, kalemler, KDV/matrah/toplamlar, referanslar).
- B2B: VKN/ticari alanlar zorunluluk kontrolü; B2C: e-Arşiv için uygun alanlar.
- Validasyon: Eksik alanlarda anlaşılır hata döndür.
- DoD: Örnek siparişlerle geçerli UBL üretimi (unit testleri).

6.2 EDM SOAP Client
- WSDL’den client oluşturma veya generic SOAP; WS-Security header (UsernameToken); TLS/sertifika.
- Metotlar: `Gonder`, `FaturaStatuSorgulama`, `FaturaPDFGoruntule`, `FaturaIndir`.
- Hata yönetimi: SOAP Fault → `EDM_*` hata kodları; retry/backoff politikası.
- DoD: Test ortamında ETTN alınması ve PDF/XML getirme başarılı.

6.3 Mükellefiyet / Kanal Seçimi
- `mode=auto` ise: Alıcı VKN mükellef mi? Evet → e-Fatura; hayır → e-Arşiv.
- DoD: B2B/B2C örneklerinde doğru kanal seçimi.

6.4 REST Endpoint’lerin Geliştirilmesi
- 5. bölümdeki sözleşmelere göre.
- DoD: Swagger/Insomnia koleksiyon güncel, auth ve hata örnekleri mevcut.

6.5 Job Scheduler (Durum İzleme)
- Cron: `*/10 * * * *` (öneri) `status in (sent, processing)` için EDM status poll.
- Backoff: Arttırımlı aralık ve üst limit; çok sayıda hatada alarm.
- DoD: En az 3 statü geçişi senaryosu ile doğrulama.

6.6 Güvenli Dosya İndirme
- PDF/XML indirmede imzalı, kısa süreli URL veya streaming; rate limit.
- DoD: Yetkisiz erişimler 403; log’lar maskeli.

6.7 Gözlemlenebilirlik ve Loglama
- Audit log: `send`, `status`, `pdf`, `xml`, `retry` olayları.
- Metrikler: başarı oranı, ort. yanıt süresi, hata kod dağılımı.
- DoD: Dashboard/Kibana sorguları hazır.

### Durum (Backend Checklist)
- [x] UBL Üretim Servisi (iskele) `src/services/ublBuilder.js`
- [x] EDM SOAP Client (sarmalayıcı) `src/services/edmSoapClient.js`
- [x] Veri Modeli `src/models/Invoice.js`
- [x] Servis Katmanı `src/services/invoiceService.js` (retry/backoff, maskeleme)
- [x] Controller `src/controllers/invoiceController.js`
- [x] Routes `src/routes/invoiceRoutes.js` (auth + owner/admin, public imzalı indirme)
- [x] ENV Değişkenleri `ENVIRONMENT_SETUP.md`
- [x] OpenAPI `/docs/openapi.yaml` güncellemesi
- [x] Cron (durum izleme) `src/scripts/invoiceCron.js`
- [x] İmzalı kısa süreli URL yardımcıları
- [ ] WSDL alan eşlemeleri (gerçek EDM şemalarıyla birebir)
- [ ] Gelişmiş retry/backoff ve hata kod haritalama (`EDM_*`)

---

## 7) Frontend Görevleri

7.1 API Service ve Tipler
- [x] `lib/api/utils/constants.ts` içine `API_ENDPOINTS.INVOICES` ve `QUERY_KEYS` eklendi
- [x] `lib/api/types.ts` içine `Invoice*` tipleri eklendi
- [x] `lib/api/services/invoices.ts` servis eklendi
- DoD: Tip güvenli istek/yanıt; hata mesajları `use-toast` ile.

7.2 Hook’lar
- [x] `lib/hooks/useInvoices.ts` eklendi: `useSendInvoice`, `useInvoiceStatus`, `useInvoiceFiles`, `useInvoicesAdminList`
- DoD: React Query cache key’leri tutarlı; loading/error UI’ları hazır.

7.3 Checkout (Bireysel/Şirket)
- [x] `app/odeme`: Fatura tipi seçimi (Bireysel/Şirket) ve alanlar (Bireysel: TCKN; Şirket: companyName, VKN, vergi dairesi, eInvoiceAddress)
- [x] Zod + RHF validasyonları (Zod eklendi; mevcut form controlled input’lar üzerinden tetikleniyor)
- [x] `hooks/useInvoiceAddresses` ile adres kaydet/seç entegrasyonu (create/update/remove + reload eklendi, UI’da “Bu adresi kaydet” aksiyonu mevcut)
- DoD: Form hataları alan bazlı; geçerli veride sorunsuz ilerleme; sipariş body’sine TCKN/VKN/taxOffice/eInvoiceAddress dahil edilir.

7.4 Ödeme Sonrası Tetikleme
- [x] Başarılı ödeme → `invoices.send(orderId)` (otomatik kanal) tetikleme `app/odeme/basarili/page.tsx` içine eklendi
- [ ] Kullanıcı bilgilendirme toast’ları (temel eklendi, hata/başarı mesajlarını zenginleştir)
- DoD: “Fatura gönderildi/işleniyor” bilgisi ve hata halinde yeniden deneme imkanı.

7.5 Sipariş Detayı (Müşteri)
- [x] `app/siparislerim/[orderId]`: Fatura durumu rozeti, PDF/XML indirme butonları eklendi (polling: 15sn)
- DoD: Yetki kontrolü backend’de; indirme linkleri Base64 → istemci indirme ile çalışır.

7.6 Admin Fatura Listesi
- [x] `app/admin/invoices`: Liste/filtre/aksiyon (yeniden gönder/yeniden kontrol, PDF/XML indirme)
- [x] `app/admin/orders`: Fatura durumu kolonu ve PDF/XML aksiyonları eklendi
- DoD: Filtreler çalışır, aksiyonlar audit log’a düşer.

7.7 UI/UX
- [x] Durum renkleri (sent/processing/approved/rejected) ve etiketleri ortak yardımcı ile normalize edildi (`lib/utils/invoiceUi.ts`)
- [x] Toast bildirimleri zenginleştirildi (başarılı/hata mesajları)
- DoD: Mobil/masaüstü uyumu, a11y kontrolleri.

---

## 8) Test Planı

- Backend Unit: UBL builder, EDM client sarmalayıcıları, mapper’lar.
- Backend Integration: Test ortamına `Gonder`, `Status`, `PDF/XML` akışları.
- Frontend Unit: Hook’lar (Query/Mutation), form validasyonları.
- Frontend Integration: Checkout → Ödeme → Fatura gönderim → Durum/PDF/XML akışı.
- E2E: B2B ve B2C akışları; hata senaryoları (mükellef değil, ağ/timeout, invalid data).
- Performans: PDF/XML indirme süresi, status poll oranları.
- DoD: Tüm kritik yolaklar “yeşil”; geriye dönük regresyon yok.

---

## 9) Yayına Alma ve Operasyon

- Aşama 1: Test/Sandbox ortamında B2B e-Fatura → UAT onayı.
- Aşama 2: B2C e-Arşiv → UAT onayı.
- Prod Hazırlık: Sertifika ve env’ler; rate limit ve alarm eşiği; rollback planı.
- İzleme: İlk hafta yakın takip; hata eşiğinde alarm ve geçici devre dışı bırakma (feature flag opsiyonel).

---

## 10) Riskler ve Azaltımlar

- WSDL/şema değişiklikleri → Versiyon pinleme ve kontrat testleri.
- Sertifika sorunları → Son kullanma izleme, yedek sertifika.
- GİB/EDM gecikmeleri → Backoff + kullanıcı bilgilendirmesi + manuel retry.
- PII/GDPR → Maskeleme ve erişim kontrolü.

---

## 11) Bağımlılıklar

- Ödeme akışı (sipariş tamamlandığında tetikleme gerekir).
- Kullanıcı/Adres/Fatura adresi modülleri (checkout formları).
- Admin yetki ve liste sayfaları.

---

## 12) Teslimatlar

- Backend: UBL builder, EDM client, REST endpoint’ler, job scheduler, güvenli indirme, log/metrics.
- Frontend: API services, hook’lar, checkout form & tetikleme, sipariş detayı, admin invoice sayfası, UI/UX.
- Dokümantasyon: `edm_api_doc.md`, bu dosya; API koleksiyonu.
- Test: Unit/Integration/E2E raporları; UAT onayı.

---

## 13) Zaman Planı (Öneri)

- Hafta 1: Backend UBL + EDM client + `/send`
- Hafta 2: Status/PDF/XML + job scheduler + Frontend services/hooks
- Hafta 3: Checkout değişiklikleri + Sipariş detayı + Admin listesi
- Hafta 4: Testler (E2E/UAT), sertifikalar, prod hazırlık

---

## 14) Kabul Kriterleri (Özet)

- B2B siparişte e-Fatura ETTN üretimi ve `approved` durumuna geçiş.
- B2C siparişte e-Arşiv PDF üretilmesi ve müşteriye erişim.
- PDF/XML sadece yetkili kullanıcılarca indirilebilir.
- Admin listesi filtrelenebilir ve aksiyonlar kayıt altına alınır.
- Hata mesajları kullanıcı-dostu ve log’lar maskeli. 