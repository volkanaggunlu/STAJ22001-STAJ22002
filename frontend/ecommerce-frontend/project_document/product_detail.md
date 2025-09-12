# 🛒 Ürün Detay Sayfası Dinamikleştirme Yol Haritası

## 1. Amaç
- `app/urun/[id]/page.tsx` dosyasındaki statik (mock) ürün detayını, backend'den gerçek verilerle dinamik hale getirmek.
- Tasarımı ve kullanıcı deneyimini bozmadan, mevcut component yapısını koruyarak veri entegrasyonu yapmak.

## 2. Veri Çekme Yöntemi
- Projede ürün detay verisi için **slug** veya **id** ile API'den veri çekiliyor.
- `lib/api/services/products.ts` içinde:
  - `getProductById(id)` ve `getProductBySlug(slug)` fonksiyonları mevcut.
- `lib/hooks/useProducts.ts` içinde:
  - `useProduct(id)` ve `useProductBySlug(slug)` custom hook'ları var.
- Next.js route'u `[id]` veya `[slug]` ile çalışıyor olabilir. (Bizim dosya `[id]` şeklinde.)

## 3. Yapılacaklar

### a) Route Parametresini Al
- Next.js `useParams` veya `useRouter` ile `[id]` parametresini al.

### b) API'den Ürün Detayını Çek
- `useProduct(id)` hook'unu kullanarak ürünü çek.
- Gerekirse loading ve error state'lerini yönet.

### c) Mock Veriyi Kaldır
- Statik `product` ve `relatedProducts` mocklarını kaldır.
- API'den gelen veriyi uygun şekilde componentlere aktar.

### d) Tasarımı Koru
- Mevcut UI/UX ve component yapısını bozmadan, sadece veri kaynağını değiştir.
- Eksik veri veya loading durumunda skeleton/placeholder göster.

### e) Benzer Ürünler
- `productsApi.getRelatedProducts(productId)` ve `useRelatedProducts(productId)` hook'u ile benzer ürünleri çek.

### f) Teknik Özellikler, Özellikler, Yorumlar
- Backend modeline uygun şekilde:
  - `specifications` (array) → teknik özellikler tabına aktar.
  - `features` (array) → özellikler tabına aktar.
  - `reviews` (array/id) → gerekirse ayrı API çağrısı ile çek.

### g) SEO ve Meta
- Ürün başlığı, açıklaması ve görselleri dinamik olarak sayfa meta'larına aktarılabilir.

## 4. Dikkat Edilecekler
- Tasarım bozulmamalı, responsive yapı korunmalı.
- Loading ve error state'leri kullanıcıya düzgün gösterilmeli.
- Eksik veri durumunda fallback değerler veya skeleton kullanılmalı.
- API'den dönen veri backend modeline uygun parse edilmeli.
- Gerekirse types/interfaces güncellenmeli.

## 5. Ekstra
- Eğer route `[slug]` ile çalışacaksa, hook ve API fonksiyonu ona göre değiştirilmeli.
- Yorumlar ve rating için ayrı API çağrısı yapılabilir.
- Sepete ekle, favori, paylaş gibi aksiyonlar backend ile entegre edilmeli (ilerleyen adımda).

---

**Bir sonraki adım:**
- Route parametresini alıp, API'den ürünü çekerek sayfayı dinamikleştirmeye başla. 