# 🛒 Sepete Ekleme (Add to Cart) Fonksiyonu Yol Haritası

## 1. Amaç
- Ana sayfa ve ürün cardlarında bulunan "Sepete Ekle" butonunu işlevsel hale getirmek.
- Kullanıcı bir ürünü sepete eklediğinde, frontend state ve/veya backend API ile sepet güncellensin.
- Kullanıcıya başarılı ekleme bildirimi gösterilsin (toast/sonner).

## 2. Proje Yapısında Sepet Yönetimi
- Sepet yönetimi için Zustand store kullanılıyor: `lib/store/cartStore.ts`
- Sepete ekleme işlemi için bir action/fonksiyon mevcut olmalı: ör. `addToCart(product, quantity)`
- Eğer backend ile entegre ise, API çağrısı da yapılabilir.

## 3. Yapılacaklar

### a) Sepet Store'unu ve Fonksiyonunu İncele
- `lib/store/cartStore.ts` dosyasını incele, mevcut fonksiyonları ve state'i kontrol et.
- Eğer yoksa, `addToCart` fonksiyonu oluştur.

### b) ProductCard'da Sepete Ekle Butonunu Bağla
- `ProductCard.tsx` içinde `handleAddToCart` fonksiyonunu güncelle:
  - `addToCart(product, 1)` çağrısı yap.
  - Başarılı olursa kullanıcıya toast bildirimi göster.

### c) Sepet Store'u ve UI Entegrasyonu
- Sepet drawer veya sepet sayfası ile store'un güncellendiğini doğrula.
- Sepete eklenen ürünün miktarı ve toplam fiyatı güncellenmeli.

### d) Backend Entegrasyonu (Varsa)
- Eğer sepet backend'de tutuluyorsa, API'ye ekleme isteği gönder.
- API'den dönen response ile store'u güncelle.

### e) Kullanıcıya Bildirim Göster
- Sepete ekleme başarılı olursa Sonner/Toast ile bilgi ver.
- Hata olursa hata mesajı göster.

### f) UI/UX Detayları
- Sepette olmayan ürünü eklerken animasyon veya görsel feedback eklenebilir.
- Sepette zaten varsa miktar artırılabilir.
- Stok kontrolü yapılmalı (quantity > stock ise eklenmemeli).

## 4. Dikkat Edilecekler
- Sepet state'i güncel ve tutarlı olmalı.
- Aynı ürün tekrar eklenirse miktarı artırılmalı.
- Sepet drawer veya sayfası otomatik güncellenmeli.
- Sepete ekleme işlemi hızlı ve kullanıcı dostu olmalı.

---

**Bir sonraki adım:**
- `lib/store/cartStore.ts` dosyasını incele ve addToCart fonksiyonunu kontrol et/oluştur. 