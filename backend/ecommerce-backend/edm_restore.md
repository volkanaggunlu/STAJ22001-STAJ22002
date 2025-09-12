# EDM Kaldırma ve Manuel Fatura Geçiş Planı

Bu doküman, projedeki EDM e-Fatura/e-Arşiv entegrasyonunun tamamen kaldırılması ve yerine manuel fatura akışının devreye alınması için izlenecek adımları ve teknik değişiklikleri içerir.

## Hedefler
- EDM entegrasyonunu ve bağımlılıklarını projeden kaldırmak.
- Sipariş oluşturulduktan sonra otomatik bir fatura taslağı kaydı yaratmak.
- Admin panelinden sipariş detayında faturayı manuel doldurup kullanıcıya e-posta ile iletebilmek.
- PDF üretimi için basit bir şablon ile sistem içi PDF üretimini desteklemek (opsiyonel: admin kendi PDF’ini base64 olarak ekleyebilir).

## Kapsam Dışı
- GİB’e otomatik gönderim, e-İmza, Zarf/ETTN yönetimi.
- EDM SOAP çağrıları, UBL üretimi.

## Teknik Değişiklikler (Özet)
- EDM dosyalarının kaldırılması: `src/services/edmSoapClient.js`, `src/services/edmPayloadBuilder.js`, `src/services/ublBuilder.js`, `src/config/edm.js`, `src/scripts/invoiceCron.js`, `src/middleware/invoiceToken.js`.
- Fatura modeli sadeleştirme: EDM alanlarını tamamen kaldırma (ör: `ettn`, `envelopeId`, `gibStatusHistory`, `lastCheckedAt`, `errorCode`, `errorMessage`, `provider`, `channel`). Manuel alanları koru (`invoiceNumber`, `invoiceDate`, `pdfBase64`, `manualNotes`, `sentToUserAt`, `isManual`).
- Fatura servisini yeniden yazma: manuel fatura oluşturma/güncelleme/gönderme (e-posta) akışları.
- Controller/Route güncellemeleri: EDM endpoint’lerinin kaldırılması; manuel endpoint’lerin eklenmesi.
- Sipariş akışı: sipariş oluşturulduğunda otomatik fatura taslağı kaydı.
- Cron kaldırma: EDM durum sorgulama görevleri iptal.
- Paket bağımlılıkları: `soap`, `xmlbuilder2` kaldırma.

## Adım Adım Uygulama Planı
1) Kod Temizliği ve Dosya Kaldırma
   - [x] `src/scripts/invoiceCron.js` (sil)
   - [x] `src/services/edmSoapClient.js` (sil)
   - [x] `src/services/edmPayloadBuilder.js` (sil)
   - [x] `src/services/ublBuilder.js` (sil)
   - [x] `src/config/edm.js` (sil)
   - [x] `src/middleware/invoiceToken.js` (sil)
   - [x] `src/app.js` içindeki cron başlatma kodunu kaldır

2) Model Güncellemeleri (`src/models/Invoice.js`)
   - [x] EDM alanlarını tamamen kaldır: `ettn`, `envelopeId`, `gibStatusHistory`, `lastCheckedAt`, `errorCode`, `errorMessage`, `provider`, `channel`.
   - [x] Manuel alanlar mevcut: `isManual`, `invoiceNumber`, `invoiceDate`, `pdfBase64`, `manualNotes`, `sentToUserAt`.

3) Service Refaktörü (`src/services/invoiceService.js`)
   - [x] EDM bağımlı metodları kaldır: `send`, `status`, `getPdf`, `getXml`.
   - [x] Serviste EDM alanlarına (provider/channel vs.) bağımlılığı kaldır.
   - [x] Yeni metodlar:
       - `createInitial(orderId, context)` → sipariş sonrası taslak fatura oluşturur.
       - `getByOrder(orderId)` → faturayı getirir.
       - `upsertManual(orderId, payload, context)` → admin panelden manuel fatura bilgilerini kaydeder/günceller.
       - `sendEmail(orderId, options)` → kullanıcıya e-posta ile faturayı gönderir (opsiyon: `pdfBase64`’ü ek olarak gönder).
       - `adminList(filters)` → basit filtre/sayfalama ile listeleme.

4) Controller ve Route Düzenlemeleri
   - [x] `src/controllers/invoiceController.js` içeriğini manuel akışa göre güncelle.
   - [x] `src/routes/invoiceRoutes.js` endpoint’lerini değiştir:
       - GET `/api/invoices/:orderId` → faturayı getir (auth: owner/admin)
       - POST `/api/invoices/:orderId/manual` → manuel bilgiler kaydet (auth: admin)
       - POST `/api/invoices/:orderId/send-email` → e-posta gönder (auth: admin)
       - GET `/api/invoices` → admin listesi (auth: admin)
       - Kaldır: `/send`, `/status`, `/pdf`, `/xml`, `/public/*`, `/links`

5) Validasyon (`src/validations/invoiceValidation.js`)
   - [x] `sendInvoiceSchema` yerine `manualInvoiceSchema` ekle (ör: `invoiceNumber`, `invoiceDate`, `pdfBase64`, `manualNotes`).
   - [x] `adminListSchema` kanal/durum alanlarını manuellerle uyumlu hale getir.

6) Sipariş Akışı Entegrasyonu (`src/services/orderService.js`)
   - [x] Sipariş başarıyla kaydedildikten sonra `invoiceService.createInitial(order._id, { userId })` çağır.

7) Paketler ve Yapılandırma
   - [x] `package.json` bağımlılıklarından `soap`, `xmlbuilder2` kaldır.
   - [x] Ortam değişkenlerinden EDM ile ilgili olanlar temizlenecek veya dikkate alınmayacak.

8) Dokümantasyon ve Admin Panel Notları
   - [ ] README/OpenAPI güncellemeleri (fatura endpoint’leri değişimi).
   - [ ] Admin panel sipariş detayında fatura formu alanları: `invoiceNumber`, `invoiceDate`, `manualNotes`, `pdf upload` ya da `pdfBase64`.
   - [ ] E-posta şablonunda fatura bilgilerini özetle.

## Rollback Planı
- Bu değişiklikler ayrı bir branch’te yapılmalıdır. Geri dönüş gerektiğinde branch değişikliğiyle EDM’li sürüme dönebiliriz.
- Model alanları geriye dönük uyumluluk için korunacağından veri kaybı beklenmez.

## Test Kapsamı
- [ ] Sipariş oluşturma → fatura taslağı oluşturuyor mu?
- [ ] Admin manuel güncelleme → veriler doğru kaydoluyor mu?
- [ ] E-posta gönderimi → ekler ile iletiliyor mu (TEST MODE’da log)?
- [ ] Yetkilendirme → yalnızca admin güncelleme/gönderme yapabiliyor mu?
- [ ] Admin listeleme → filtre/sayfalama çalışıyor mu?

## Operasyonel Notlar
- Production’da SSL zorunluluğu faturalar için korunabilir.
- E-posta gönderiminde `EMAIL_TEST_MODE=true` iken gerçek gönderim yapılmaz, loglanır. 