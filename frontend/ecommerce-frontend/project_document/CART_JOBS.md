# Sepet (Cart) İşlemleri - Görev ve Eksiklikler

## 🛠️ Yapılacaklar & Bilinen Eksikler

1. **Backend Sepet API Entegrasyonu**
   - Kullanıcı login olduğunda sepetin backend ile senkronize edilmesi
   - Misafir ve login sepetlerinin birleştirilmesi
2. **Stok Kontrolü**
   - Sepete eklerken ve miktar güncellerken stok kontrolü yapılmalı
3. **Kullanıcıya Onay**
   - Sepeti temizlerken veya ürün silerken kullanıcıdan onay alınmalı
4. **Hata ve Loading State**
   - Sepet işlemlerinde kullanıcıya feedback verilmeli
5. **Çoklu Cihaz ve Oturum Desteği**
   - Login kullanıcılar için sepet bulut tabanlı saklanmalı
6. **Sepet API Testleri**
   - Sepet işlemleri için unit ve entegrasyon testleri yazılmalı

---

## 🐞 Bilinen Hatalar / Senaryolar

- **Login kullanıcı ile sepete ürün ekledim, çıkış yaptım, misafir modda sepete ürün ekledim, tekrar login oldum:**
  - Sadece login olarak eklediğim ürünler geldi, misafir moddaki ürünler ile varolan sepet merge edilmedi.
  - Beklenen: Login olunca misafir sepeti ile kullanıcı sepeti birleştirilmeli veya kullanıcıya seçenek sunulmalı.

---

**Not:** Sepet işlemlerinde veri kaybı ve kullanıcı deneyimi için merge ve senkronizasyon kritik önemdedir. 