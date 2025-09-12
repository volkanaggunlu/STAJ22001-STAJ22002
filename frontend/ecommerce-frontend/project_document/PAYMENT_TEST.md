# Ödeme (Checkout) Sayfası Test Senaryoları

## 1. Sepet Entegrasyonu
- [x] Sepet sayfasında ürün ekle, ödeme sayfasına geçince ürünler ve miktarları doğru geliyor mu?
- [ ] Sepet boşsa ödeme sayfasında uygun uyarı gösteriliyor mu?

## 2. Kullanıcı Bilgileri
- [ ] Login kullanıcıda adres ve profil bilgileri otomatik olarak dolduruluyor mu?
- [ ] Adres defteri desteği varsa, farklı adres seçilebiliyor mu?

## 3. Kargo Seçenekleri
- [ ] Kargo seçenekleri ve ücretleri doğru şekilde listeleniyor mu?
- [ ] Ücretsiz kargo limiti çalışıyor mu? (500₺ üzeri ücretsiz)

## 4. Ödeme Yöntemleri
- [ ] Sadece kredi kartı ve havale/EFT seçenekleri görünüyor mu?
- [ ] Seçime göre ilgili form ve açıklama geliyor mu?

## 5. Kredi Kartı Formu
- [ ] Kart numarası, expiry ve CVV için maskeleme ve validasyon çalışıyor mu?
- [ ] Hatalı girişte anında uyarı gösteriliyor mu?

## 6. Onay Kutuları
- [ ] Kullanım şartları kutusu işaretlenmeden sipariş verilemiyor mu?
- [ ] Kampanya izni kutusu opsiyonel mi?

## 7. Sipariş Özeti
- [ ] Ürünler, toplam, kargo, adres ve ödeme yöntemi özet olarak doğru gösteriliyor mu?

## 8. Sipariş Oluşturma
- [ ] “Siparişi Tamamla” tıklandığında API’ye doğru body ile istek atılıyor mu?
- [ ] Başarılı olursa success/onay sayfasına yönlendiriliyor mu?
- [ ] Hata olursa kullanıcıya feedback (toast veya form altında) gösteriliyor mu?
- [ ] Sipariş sonrası sepet temizleniyor mu?

## 9. Yükleniyor ve Hata Durumları
- [ ] Sipariş oluşturulurken loading spinner veya disabled buton gösteriliyor mu?
- [ ] API hatası veya validasyon hatası olursa kullanıcıya net mesaj gösteriliyor mu?

## 10. Responsive ve UX
- [ ] Tüm adımlar mobil ve masaüstünde düzgün çalışıyor mu?
- [ ] Formlar, butonlar ve özetler modern ve erişilebilir mi?

---

Her adım test edildikçe işaretlenebilir ve gözlemler eklenebilir. 