# E-Fatura / E-Arşiv Test Senaryoları (EDM)

Bu döküman, EDM (Edoksis) entegrasyonu için API, Frontend ve E2E seviyelerinde kapsamlı test senaryolarını içerir. Amaç; B2B (e-Fatura) ve B2C (e-Arşiv) akışlarının hatasız çalıştığını doğrulamaktır.

---

## 1) Ön Koşullar
- Backend servisleri ayakta ve test ortamı erişilebilir
  - `/api/invoices/:orderId/send|status|pdf|xml| (GET/POST)`
  - `/api/invoices` (liste)
- Test kullanıcıları
  - Bireysel (TCKN): e-Arşiv senaryosu
  - Kurumsal (VKN, Vergi Dairesi, opsiyonel Alias): e-Fatura senaryosu
- Örnek siparişler (en az 1 B2B, 1 B2C)
- Auth: JWT ile müşteri ve admin rolleri

---

## 2) API Testleri (Insomnia/cURL)

A. Fatura Gönder (Auto)
- Adım: `POST /api/invoices/:orderId/send { mode: 'auto' }`
- Beklenen: `success=true`, `data.ettn` dolu, `data.channel` (einvoice/earchive), `status in ['sent','processing']`
- Negatif: Geçersiz orderId → 404/400; yetkisiz → 401/403; EDM hatası → `EDM_*` kod map’lenmiş mesaj

B. Durum Sorgu
- Adım: `GET /api/invoices/:orderId/status`
- Beklenen: `success=true`, `data.status` geçişleri (`sent`→`processing`→`approved|rejected`)
- Negatif: EDM time-out → 504/408 map; retry/backoff loglandı

C. PDF / XML
- Adım: `GET /api/invoices/:orderId/pdf|xml`
- Beklenen: `success=true`, `data.contentBase64` dolu, mime uygun
- Güvenlik: Sipariş sahibi veya admin dışında 403

D. Liste (Admin)
- Adım: `GET /api/invoices?channel=&status=&from=&to=&page=&limit=`
- Beklenen: Sayfalı sonuç, filtreler çalışır, toplam kayıt uyuşur

Örnek cURL:
```bash
# Gönder
curl -X POST "$API/invoices/$ORDER_ID/send" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"mode":"auto"}'
# Durum
curl -X GET "$API/invoices/$ORDER_ID/status" -H "Authorization: Bearer $TOKEN"
# PDF
curl -X GET "$API/invoices/$ORDER_ID/pdf" -H "Authorization: Bearer $TOKEN"
# XML
curl -X GET "$API/invoices/$ORDER_ID/xml" -H "Authorization: Bearer $TOKEN"
# Liste
curl -X GET "$API/invoices?channel=einvoice&status=approved&page=1&limit=20" -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## 3) Frontend Testleri (Manuel + UI)

A. Checkout (Bireysel)
- Adım: Bireysel seç, TCKN zorunlu ve 11 hane kontrolü; fatura adresi teslimat ile aynı/ayrı toggle
- Beklenen: Hatalar alan bazlı; geçerli veri ile sipariş oluşur; yeni fatura adresi “kaydet” çalışır

B. Checkout (Firma)
- Adım: Firma seç, `companyName`, `taxNumber(10 hane)`, `taxOffice` zorunlu; `eInvoiceAddress` opsiyonel
- Beklenen: Hatalar alan bazlı; geçerli veri ile sipariş oluşur; yeni fatura adresi “kaydet” çalışır

C. Ödeme Başarılı Sayfası
- Adım: Ödeme tamamla → `/odeme/basarili?orderId=...`
- Beklenen: Fatura gönderimi otomatik tetiklenir, rozet durumları (Bekleniyor/Gönderildi/İşleniyor/Onaylandı) 15 sn’de bir güncellenir; toast mesajları görünür
- Negatif: Backend kapalı → bilgi toast’ı

D. Sipariş Detayı (Müşteri)
- Adım: `/siparislerim/[orderId]`
- Beklenen: e-Fatura rozetinin standart renk/etiketle görünmesi; PDF/XML indirme çalışır
- Güvenlik: Başka kullanıcının siparişi → görünmez/403

E. Admin Faturalar
- Adım: `/admin/invoices` filtreler (kanal/durum/tarih) + PDF/XML + Yeniden Gönder
- Beklenen: Filtre sonuçları doğru; indirmeler başarılı; resend → status güncellemeleri listede yansır

F. Admin Siparişler
- Adım: `/admin/orders`
- Beklenen: Fatura durum rozeti + “durumu yenile” + menüde PDF/XML indirme çalışır

---

## 4) E2E Senaryolar (B2C ve B2B)

Scenario-1: B2C e-Arşiv
- Kullanıcı bireysel → Checkout → Ödeme başarılı → Fatura auto-send → Sipariş detayda PDF indirilebilir
- Kabul: `channel=earchive`, durum `approved` ve PDF erişilebilir

Scenario-2: B2B e-Fatura
- Kullanıcı firma (VKN, Vergi Dairesi) → Checkout → Ödeme başarılı → Fatura auto-send → Status `approved`
- Kabul: `channel=einvoice`, `ettn` var, XML indirilebilir

Scenario-3: Reddedildi akışı
- EDM sandbox’ta reddedilecek örnek fatura → status `rejected` → UI rozet kırmızı, açıklama log’da

Scenario-4: Yetkisiz indirme
- Başka kullanıcı JWT ile PDF/XML → 403

Scenario-5: Zaman aşımları ve retry
- EDM gecikme simülasyonu → status endpoint backoff log’landı, UI bilgi/toast gösterdi

---

## 5) Güvenlik ve Uyumluluk
- JWT/role: müşteri kendi siparişine, admin tüm kayıtlara erişebilir
- Log maskeleme: TCKN/VKN kısmi maskeli
- İmzalı kısa süreli dosya URL/stream (backend kontrol)

---

## 6) Performans/Dayanıklılık
- 50 eşzamanlı `status` poll: oranlar ve limitler (rate limit) korunuyor
- PDF/XML indirme süresi < 3s (ortalama), 10MB üstü dosyalarda uyarı

---

## 7) Test Sonuç Kaydı
- Her senaryo için: Tarih, Ortam, Kullanıcı, SiparişID, Sonuç, Not
- Hatalı durumlarda: Request/Response örnekleri ve `EDM_*` kodu, backend log referansı 