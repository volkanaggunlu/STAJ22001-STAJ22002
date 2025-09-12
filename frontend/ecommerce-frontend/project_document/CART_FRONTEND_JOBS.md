# Cart Frontend Görev Listesi ve Mevcut Durum

## Görevler

1. [x] **Kullanıcı login yapmışsa sepet içeriği apiden çekilecek**
   - Login işlemi sonrası API'den /cart çağrısı ile sepet çekiliyor ve store'a eksiksiz yazılıyor.

2. [x] **Login yapmadan önce sepete ekleme yapıp sonra giriş yaptıysa sepet içeriği giriş yapan kullanıcının sepetine aktarılması lazım (merge)**
   - Login sonrası local sepetteki ürünler backend'e POST ile aktarılıyor, ardından güncel sepet çekilip store'a yazılıyor. Backend mevcut sepetle birleştirme (merge) işlemini otomatik yapıyor.

3. [x] **Sepette varolan ürünün aynısı sepete tekrar ekleme butonuna basıldığında sepetteki ürünün sayısı artırılmalı**
   - Login ise: POST /cart ile miktar artırılıyor, dönen sepet store ve localStorage'a eksiksiz yazılıyor. Login değilse localStorage'da miktar artırılıyor.

4. [x] **Sepet içeriğinde azaltma ve artırma işlemlerinde login ise eğer kullanıcı apide güncelleme yapılmalı, login değilse localstorage'da güncelleme yapılmalı**
   - Login ise: PUT /cart/:productId ile miktar güncelleniyor, dönen sepet store ve localStorage'a eksiksiz yazılıyor. Login değilse localStorage'da miktar güncelleniyor.

---

## Şu Anki Mevcut Durum

- Sepet işlemleri için hibrit bir yapı mevcut: login ise API, değilse localStorage kullanılıyor.
- Sepete ekleme, silme, miktar artırma/azaltma işlemleri için hibrit fonksiyonlar yazıldı (useHybridAddToCart, useHybridRemoveFromCart, useHybridUpdateQuantity).
- API'den dönen sepet ile store güncelleniyor, localStorage ile tam senkronizasyon sağlandı.
- Sepet tamamen boşaldığında localStorage temizleniyor.
- Sepet merge işlemi (login olduktan sonra local sepetin backend'e aktarılması) otomatik ve doğru çalışıyor.
- Ürün miktarı artırma/azaltma işlemlerinde login ise API'ye istek atılıyor, değilse localStorage güncelleniyor.
- Sepete tekrar ekleme işlemlerinde login ise API'ye, değilse localStorage'a ekleniyor; miktar güncellenmesi ve senkronizasyon sorunsuz.

---

> Tüm görevler tamamlandı ve sepet işleyişi eksiksiz çalışacak şekilde yapılandırıldı. Her bir adım ve edge-case test edilip, eksik/hatalı noktalar düzeltildi. 