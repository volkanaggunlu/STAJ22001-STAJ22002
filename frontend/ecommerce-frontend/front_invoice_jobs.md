# Frontend – Fatura Sistemi Geçiş Görevleri (Manual/EDM’siz)

Bu dosya, `front_invoice_new.md` dokümanındaki yeni mimariye uygun olarak frontend tarafında yapılacak işleri profesyonel ve güvenli şekilde uygulamak için adım adım görevleri içerir.

## 0) Kapsam ve Varsayımlar
- EDM entegrasyonu kaldırıldı. Faturalar backend’de otomatik taslak olarak oluşur; Admin manuel doldurur ve dilerse e‑posta ile gönderir.
- Kullanıcı faturayı PDF olarak indirir. XML/UBL yolu kullanılmayacaktır.
- Endpoint’ler ve tipler `front_invoice_new.md` ile uyumlu hale getirilecektir.

## 1) Tipler (Types) ve Sabitler (Constants)
- [x] `lib/api/types.ts` içinde yeni tipler eklendi/güncellendi:
  - [x] `InvoiceStatus`: `'pending' | 'sent' | 'processing' | 'approved' | 'rejected' | 'error'`
  - [x] `Invoice` modeli: `seller`, `buyer`, `items`, `totals`, `shipping`, `meta`, `pdfPath`, `isManual`, `manualNotes`, `createdBy`, `sentAt`, `sentToUserAt`
  - [x] Eski `InvoiceFile` ve base64 tipleri kaldırıldı.
- [x] `lib/utils/constants.ts` API uçları güncellendi:
  - [x] INVOICES: `DETAIL`, `ADMIN_MANUAL`, `ADMIN_SEND_EMAIL`, `LIST`
  - [x] ORDERS: `INVOICE_PDF(orderId)` eklendi
  - [x] Eski `INVOICES.PDF/XML/STATUS/SEND` kaldırıldı.

## 2) API Servisleri
- [x] `lib/api/services/invoices.ts` yeniden yazıldı:
  - [x] `get`, `adminManual`, `adminSendEmail`, `list`, `downloadPdf`
  - [x] Eski `send/status/pdf/xml` kaldırıldı.

## 3) React Query Hook’ları
- [x] `lib/hooks/useInvoices.ts` revize edildi:
  - [x] `useInvoice(orderId)` tekil sorgu (opsiyonel polling)
  - [x] `useInvoicesAdminList(params)`
  - [x] `useAdminManualInvoice(orderId)`, `useAdminSendInvoiceEmail(orderId)`
  - [x] Eski `useSendInvoice`, `useInvoiceStatus`, `useInvoiceFiles` kaldırıldı.

## 4) UI Yardımcıları (Status/Badge)
- [x] `lib/utils/invoiceUi.ts` güncellendi: `gib_*` kaldırıldı, `error` eklendi.

## 5) Ödeme Başarılı Sayfası
- Dosya: `app/odeme/basarili/page.tsx`
- [x] EDM’ye özgü otomatik “send” tetikleme ve sessionStorage guard tamamen kaldırıldı.
- [x] Yeni akış:
  - [x] `useInvoice(orderId)` ile faturayı çek, 5sn polling.
  - [x] “Faturayı Görüntüle/İndir” → binary PDF indir.
  - [x] XML/JSON indirme yolları kaldırıldı.

## 6) Fatura Detay Sayfası (User)
- Dosya: `app/fatura/[orderId]/page.tsx`
- [x] `useInvoice(orderId)` kullanıyor.
- [x] Görüntüle/İndir tek PDF üzerinden (XML kaldırıldı).

## 7) Admin – Faturalar Listesi ve Sipariş Detayı
- Dosya: `app/admin/invoices/page.tsx`
  - [x] “PDF indir” yeni akışta
  - [x] “E‑posta Gönder” butonu `adminSendEmail` ile
  - [x] Filtreler yeni status seti
  - [x] Satır aksiyonları: Durumu Değiştir, Görüntüle, Düzenle (manuel form)
- Dosya: `app/admin/orders/page.tsx`
  - [x] Eski `status/pdf/xml` çağrıları kaldırıldı.
  - [ ] Gerekirse fatura durumu rozeti için backend’ten dönen özet kullanılacak (ileride refactor).

## 8) Sipariş Detayı (User)
- Dosya: `app/siparislerim/[orderId]/page.tsx`
- [x] Fatura durumu göstergesi `useInvoice(orderId)` ile.
- [x] PDF indir yeni akışta.

## 9) Eski Kod Temizliği
- [x] `status/send/pdf/xml` metotları ve kullanımları temizlendi (admin invoices, user pages, admin orders).
- [x] `useInvoiceFiles` ve base64 yolları kaldırıldı.
- [x] Terminoloji sadeleştirildi (UI).

## 10) Hata Yönetimi ve Kenar Durumlar
- [x] `GET /orders/:orderId/invoice` 404 → kullanıcı mesajı (indirme hatası mesajları güncellendi)
- [ ] `POST /invoices/:orderId/manual` validasyon hatalarını formda göstermek (admin sipariş detayında form eklenince)
- [x] `POST /invoices/:orderId/send-email` hata/success toast’ları

## 11) Test ve Doğrulama
- [ ] Unit/E2E güncellenecek (yeni servisler ve sayfalar için)

## 12) Dokümantasyon ve İletişim
- [ ] `project_document/` ve `README.md` güncellemeleri

## 13) Sürümleme ve Yayın
- [ ] PR/QA/Release

Not: Devam edenler – Admin sipariş detayında manuel fatura formu özel senaryolar (validasyon, alan zorunlulukları) eklenecek. Görsel/UX düzenlemeleri ikinci aşamada yapılacak. 