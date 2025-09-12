# Frontend – Yeni Fatura Yapısı ve Endpointler

Bu doküman, faturanın EDM entegrasyonundan ayrılıp manuel yapıya geçmesiyle birlikte frontend tarafında kullanılacak veri yapıları ve endpointleri özetler.

## Genel Akış
- Sipariş oluşturulunca backend bir “taslak fatura” kaydı oluşturur.
- Admin, dış sistemde kesilen gerçek fatura bilgilerini ve PDF dosyasını sonradan faturaya işler.
- Kullanıcı faturasını indirebilir; admin isterse faturayı e‑posta ile iletir.

## Veri Modeli (Invoice)
- Kimlik ve durum:
  - `orderId: string`
  - `userId: string`
  - `status: 'pending' | 'sent' | 'processing' | 'approved' | 'rejected' | 'error'`
  - `isManual: boolean`
  - `createdBy: string`
  - `sentAt: string | null`, `sentToUserAt: string | null`
- Satıcı (`seller`): `name, taxOffice, vkn, tckn, mersis, address, city, district, postalCode, phone, email, bankName, iban`
- Alıcı (`buyer`): `firstName, lastName, companyName, tckn, taxNumber, taxOffice, email, phone, address, city, district, postalCode`
- Kalemler (`items[]`): `productId, name, sku, quantity, unit, unitPrice, discount, taxRate, taxAmount, totalExclTax, totalInclTax`
- Toplamlar (`totals`): `subtotal, discountsTotal, shippingCost, taxTotal, grandTotal`
- Teslimat (`shipping`): `address, city, district, postalCode, carrier, trackingNumber, deliveredAt`
- Üst bilgi (`meta`): `invoiceNumber, invoiceDate, currency, orderNumber, orderDate, paymentMethod, paymentReference, paymentDate, dueDate, notes`
- Ekler: `pdfPath: string` (sunucudaki PDF dosya yolu), `manualNotes: string`

Not: `buyer`, `items`, `totals`, `shipping`, `meta` alanları siparişten otomatik doldurulur. `seller` alanları boş başlar ve admin doldurur.

## Endpointler

### 1) Faturayı getir
GET `/api/invoices/:orderId`
- Auth: Kullanıcı (sipariş sahibi) veya Admin
- Response:
```json
{
  "success": true,
  "data": { /* Invoice objesi (yukarıdaki şema) */ }
}
```

### 2) Admin – Fatura güncelle/ekle (manuel)
POST `/api/invoices/:orderId/manual`
- Auth: Admin
- Body (kısmi güncelleme desteklenir; sadece değişen alanları gönderin):
```json
{
  "seller": { "name": "Firma AŞ", "taxOffice": "Kadıköy", "vkn": "1234567890", "mersis": "..." },
  "buyer": { "companyName": "Alıcı Ltd", "taxNumber": "1111111111" },
  "items": [ { "name": "Ürün", "sku": "P-1", "quantity": 2, "unitPrice": 100, "totalExclTax": 200, "totalInclTax": 200 } ],
  "totals": { "subtotal": 200, "taxTotal": 0, "grandTotal": 225, "shippingCost": 25 },
  "shipping": { "carrier": "yurtici", "trackingNumber": "ABC123" },
  "meta": { "invoiceNumber": "FTR-2025-0001", "invoiceDate": "2025-08-13" },
  "pdfPath": "public/uploads/invoices/FTR-2025-0001.pdf",
  "manualNotes": "İade süresi 14 gün",
  "status": "approved"
}
```
- Response: Güncellenmiş fatura objesi.

### 3) Admin – Faturayı e‑posta ile gönder
POST `/api/invoices/:orderId/send-email`
- Auth: Admin
- Body (opsiyonel):
```json
{ "pdfPath": "public/uploads/invoices/FTR-2025-0001.pdf" }
```
- Not: Gövdede `pdfPath` verilmezse faturadaki `pdfPath` kullanılır.
- Response: Güncellenmiş fatura (status: `sent`, `sentAt`, `sentToUserAt`).

### 4) Admin – Fatura listesi
GET `/api/invoices?status=&from=&to=&page=&limit=`
- Auth: Admin
- Query örnekleri:
  - `status=pending`
  - `from=2025-01-01&to=2025-01-31`
  - `page=1&limit=20`
- Response: `{ items: Invoice[], page, limit, total }`

### 5) Kullanıcı – Faturayı indir
GET `/api/orders/:orderId/invoice`
- Auth: Sipariş sahibi
- Response: Content-Type `application/pdf` ile dosya indirilir. `pdfPath` yoksa 404.

## PDF Yükleme (Varolan Upload Kullanımı)
- Ayrı bir fatura upload endpoint’i eklemeden mevcut admin upload uçlarını kullanın.
- Önerilen kullanım:
  - POST `/api/admin/upload/receipt-image` (veya uygun başka bir upload ucu) ile PDF dosyasını `public/uploads/...` altına yükleyin.
  - Response içinde dönen `url`’den dosya yolu türeterek `pdfPath` olarak faturaya yazın. Örn:
    - Response: `{ data: { url: "/uploads/receipts/xxxx.pdf" } }`
    - `pdfPath`: `public/uploads/receipts/xxxx.pdf`
- Not: İstenirse `/api/admin/upload/invoice` gibi özel bir uç eklenebilir (sadece `application/pdf`, `public/uploads/invoices/` klasörüne).

## UI Önerileri
- Sipariş Detay (User):
  - Fatura bilgilerini göster (GET `/api/invoices/:orderId`)
  - “PDF indir” (GET `/api/orders/:orderId/invoice`)
- Admin Sipariş Detay:
  - Fatura formu sekmesi:
    - Satıcı alanları
    - Fatura numarası, tarih (meta)
    - PDF yükle (admin upload → dönen `url`’i `pdfPath`e çevirip kaydet)
    - Kalem/Toplam/Teslimat düzenlemeleri
  - Kaydet: POST `/api/invoices/:orderId/manual`
  - E‑posta gönder: POST `/api/invoices/:orderId/send-email`

## Hatalar ve Durumlar
- 404: Fatura henüz oluşturulmadı veya `pdfPath` yok → indirme olmaz.
- 400: Validasyon hatası → eksik/yanlış alanlar.
- 200: Başarılı isteklerde `{ success: true, data: ... }` gövdesi döner.

## Notlar
- Tarihler ISO formatında gönderilmeli (YYYY-MM-DD veya tam ISO).
- `pdfPath` sunucu dosya yolu olmalı (genelde `public/uploads/...`).
- Frontend’de gösterim için `url` isterseniz: `pdfPath` → `url` = `pdfPath.replace('public', '')` ve host ile birleştirin: `${origin}/api${url}` ya da statik servis kuralınıza göre. 