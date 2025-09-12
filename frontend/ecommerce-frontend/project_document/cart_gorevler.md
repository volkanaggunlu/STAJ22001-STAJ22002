# 🛒 Sepet (Cart) Geliştirme Görev Listesi

## Genel Hedef
- Kullanıcı login olmadan sepete ürün ekleyebilsin (anonim sepet)
- Giriş yaptıktan sonra local sepet ile backend sepeti birleştir
- Sepet işlemleri (ekle, çıkar, güncelle, temizle) hem local hem backend ile uyumlu çalışsın
- Satın alma (checkout) öncesi giriş zorunlu olsun
- Sepet kaybolmasın, kullanıcı hesabına bağlansın

---

## Görevler

- [x] **Anonim Sepet:** Kullanıcı login olmadan sepete ürün ekleyebilsin (localStorage + Zustand)
- [x] **Girişli Sepet:** Kullanıcı login ise sepete ekleme, çıkarma, güncelleme işlemleri backend API ile yapılsın
- [x] **Hibrit Sepete Ekle:** Sepete ekle butonu login durumuna göre local veya API'ye ekleme yapsın
- [x] **Girişte Sepet Merge:** Kullanıcı login olduğunda local sepet backend'e aktarılsın ve birleştirilsin
- [x] **Sepet Drawer/Sayfa Senkronizasyonu:** Sepet drawer ve sepet sayfası, store güncellenince otomatik yenilensin
- [x] **Checkout'ta Giriş Kontrolü:** Satın alma butonunda kullanıcı login değilse login/register'a yönlendirilsin
- [x] **Sepet Kaybolmasın:** Giriş yaptıktan sonra sepet backend'de saklansın, logout olunca local'e alınsın veya temizlensin
- [x] **Sepet UI/UX İyileştirmeleri:** Sepete ekleme animasyonu, stok kontrolü, hata ve başarı bildirimleri, loading durumları
- [x] **Sepet API Hataları:** Backend'den dönen hata mesajları kullanıcıya düzgün gösterilsin
- [x] **Sepet Özeti ve Kupon:** Sepet özeti, toplamlar, indirim, kupon uygulama fonksiyonları entegre edilsin

---

> **Yapılanlar işaretlenecek, kalanlar yapılınca güncellenecek!** 