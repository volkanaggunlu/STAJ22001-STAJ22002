# Ödeme (Checkout) Backend Gelişmiş Görev Listesi

Bu döküman, profesyonel bir e-ticaret ödeme/checkout akışı için backend tarafında yapılması gereken tüm görevleri adım adım içerir. Frontend ile tam entegre, güvenli ve yasal gerekliliklere uygun bir yapı hedeflenmektedir.

---

## 1. Sipariş Oluşturma API'si Geliştirme
- [ ] `/api/orders` endpointini aşağıdaki alanlarla güncelle:
  - [ ] `customerType: "bireysel" | "firma"` (zorunlu)
  - [ ] `shippingAddress` objesine ad, soyad, e-posta, telefon, adres, şehir, ilçe, posta kodu, teslimat notu, kargo tipi ekle
  - [ ] `invoiceAddress` objesine ad, soyad, e-posta, telefon, adres, şehir, ilçe, posta kodu, şirket adı, vergi numarası ekle (firma ise zorunlu)
  - [ ] `paymentMethod`, `couponCode` (opsiyonel), `items` (ürünler)
- [ ] Tüm alanlar için backend validasyonları ekle (firma ise şirket adı ve vergi no zorunlu, e-posta/telefon formatı, vs.)
- [ ] Teslimat notu ve kargo tipi alanlarını sipariş modeline ekle.

## 2. Ödeme Sağlayıcı Entegrasyonu
- [ ] PCI-DSS uyumlu ödeme sağlayıcı paytr ile gerçek entegrasyon
  - [ ] Kredi kartı ödemelerinde kart bilgisi backend'e gelmemeli, sadece ödeme sağlayıcıdan dönen token/backend'e iletilmeli
  - [ ] 3D Secure desteği
  - [ ] Havale/EFT için banka bilgileri API'den dinamik dönmeli
- [ ] Ödeme sağlayıcıdan gelen callback/webhook endpointlerini ekle ve sipariş durumunu güncelle

## 3. Sipariş ve Ödeme Yönetimi
- [ ] Sipariş oluşturulduğunda, sipariş geçmişine ekle
- [ ] Sipariş başarıyla tamamlandığında, kullanıcıya e-posta ile sipariş özeti gönder
- [ ] Sipariş durumlarını (pending, paid, shipped, delivered, cancelled) yönet
- [ ] Kargo takip numarası ve teslimat tarihi desteği ekle

## 4. Kupon ve Kampanya Yönetimi
- [ ] Kupon kodu desteği ekle (kullanıcıdan gelen kodu doğrula, indirim uygula)
- [ ] Kampanya/indirim entegrasyonu (backend'de kurallar ve validasyon)

## 5. Yasal ve Güvenlik Gereklilikleri
- [ ] KVKK/GDPR uyumluluğu için sipariş sırasında açık aydınlatma metni ve onay kutusu desteği
- [ ] Gizlilik politikası ve mesafeli satış sözleşmesi linklerini API'den döndür (isteğe bağlı)
- [ ] SSL zorunluluğu (https)

## 6. Ekstra Özellikler
- [ ] Sipariş geçmişi ve tekrar sipariş desteği
- [ ] Fatura PDF oluşturma ve indirme endpointi
- [ ] Kargo takip entegrasyonu (kargo firması API'si ile)
- [ ] Çoklu dil ve para birimi desteği
- [ ] Guest checkout (misafir olarak sipariş)
- [ ] Adres ve ödeme bilgilerinin otomatik doldurulması için API endpointleri

---

**Not:**
- Frontend ile tam entegre çalışacak şekilde tüm alanlar ve işlevler eksiksiz eklenmeli.
- Eksik olan alanlar için öncelikle mock ile ilerlenebilir, gerçek entegrasyon tamamlandıkça güncellenmeli.
- Güvenlik ve yasal gereklilikler mutlaka sağlanmalı.

---
# Kupon Kodu Backend Geliştirme Notu (Sipariş Oluşturma)

- Frontend, sipariş oluşturulurken (POST /api/orders) body'de `couponCode` alanını gönderiyor.
- Backend, bu kupon kodunu alıp:
  1. Kuponun geçerli ve aktif olup olmadığını kontrol etmeli.
  2. Kuponun siparişe uygulanabilirliğini (minimum tutar, kullanım limiti, kullanıcıya özel, tarih aralığı, vs.) kontrol etmeli.
  3. Kupon geçerliyse, indirim tutarını hesaplayıp sipariş toplamına uygulamalı.
  4. Sipariş kaydında kullanılan kupon kodunu ve uygulanan indirimi saklamalı.
  5. Kupon kodu geçersizse, uygun hata mesajı ile sipariş oluşturmayı reddetmeli.
- Kupon kodu ile ilgili validasyon ve hata mesajları açıkça döndürülmeli.
- Sipariş detayında ve sipariş geçmişinde kullanılan kupon ve indirim bilgisi gösterilebilmeli.

---
# Kupon Kodu Yönetimi - Backend Yapılması Gerekenler

1. `/cart/apply-coupon` ve/veya `/coupons/validate` endpointlerinin kupon kodunu doğrulaması ve indirim bilgisini döndürmesi.
2. Sipariş oluşturulurken kupon kodu ve indirim bilgisini alıp, siparişe uygulaması.
3. Kupon kodu ile ilgili validasyon ve hata mesajlarını açıkça döndürmesi.

---

## 7. PayTR Kredi Kartı ile Ödeme Entegrasyonu (Backend)

- [ ] `/api/payment/paytr/init` endpointi: Sipariş ve müşteri bilgilerini alır, PayTR API’sine istek atar, iframe_token döner.
- [ ] `/api/payment/paytr/callback` endpointi: PayTR’den gelen ödeme sonucunu işler, sipariş durumunu günceller.
- [ ] PayTR API key/secret ve test/live ortam ayarları yapılmalı (env ile yönetilmeli).
- [ ] Kredi kartı bilgisi backend’e asla gelmemeli, sadece PayTR ile iletişimde kullanılmalı.
- [ ] Sipariş DB kaydı ve ödeme durumu güncellemesi yapılmalı.
- [ ] Callback endpointi güvenli olmalı, sadece PayTR IP’lerinden gelen istekler kabul edilmeli.
- [ ] Test ortamında PayTR sandbox ile entegrasyon yapılmalı, canlıya geçişte prod ayarları kontrol edilmeli.
- [ ] Başarılı/başarısız ödeme sonrası frontend’e uygun response dönülmeli.

--- 