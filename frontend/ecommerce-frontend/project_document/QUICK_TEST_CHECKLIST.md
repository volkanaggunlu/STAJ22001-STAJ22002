# ⚡ Hızlı Test Checklist

## 🚀 Kritik Testler (5-10 dakika)

### ✅ Coming Soon Sayfası
- [ ] Ana sayfa → `/coming-soon` yönlendirmesi
- [ ] Header/footer gizli
- [ ] `/home` sayfasına direkt erişim

### ✅ Sepet Merge
- [ ] Misafir olarak ürün ekle
- [ ] Giriş yap
- [ ] Console'da debug logları kontrol et
- [ ] Sepet içeriği birleşti mi?

### ✅ Kupon Kodu
- [ ] Sepet sayfasında kupon girişi
- [ ] Geçerli kupon uygula
- [ ] İndirim hesaplanıyor mu?
- [ ] Kuponu kaldır

### ✅ Ödeme Sayfası
- [ ] `/odeme` sayfasına git
- [ ] "Firma" seç
- [ ] Şirket adı/vergi no alanları görünüyor mu?
- [ ] Form validasyonu çalışıyor mu?

### ✅ Adres Yönetimi
- [ ] `/hesabim/adreslerim` sayfasına git
- [ ] "Yeni Adres Ekle" tıkla
- [ ] Teslimat adresi ekle
- [ ] Fatura adresi ekle (şirket bilgileri ile)

### ✅ Sipariş Listesi
- [ ] `/siparislerim` sayfasına git
- [ ] Siparişler listeleniyor mu?
- [ ] Bir siparişe tıkla
- [ ] Detay sayfası açılıyor mu?

---

## 🔧 Debug Kontrolleri

### Console Logları
```javascript
// Development modunda bu logları görmeli:
[DEBUG] Guest cart items: [...]
[DEBUG] Backend cart items: [...]
[DEBUG] Merged cart result: [...]
[DEBUG] API call to /orders took XXXms
```

### Network Tab
- [ ] API çağrıları 200 OK dönüyor mu?
- [ ] JWT token header'da gönderiliyor mu?
- [ ] Refresh token çalışıyor mu?

### LocalStorage
- [ ] Guest cart verisi saklanıyor mu?
- [ ] Token'lar saklanıyor mu?

---

## 🚨 Hata Kontrolleri

### Yaygın Hatalar
- [ ] "jwt expired" hatası var mı?
- [ ] 404 API hataları var mı?
- [ ] Form validasyon hataları görünüyor mu?
- [ ] Loading spinner'lar çalışıyor mu?

### Responsive Kontrol
- [ ] Mobil görünümde sayfa düzeni
- [ ] Tablet görünümde sayfa düzeni
- [ ] Desktop görünümde sayfa düzeni

---

## 📊 Test Sonucu

```
✅ Başarılı: ___ / 10
❌ Başarısız: ___ / 10
⚠️ Dikkat: ___ / 10

Genel Durum: 🟢 Hazır / 🟡 Düzeltme Gerekli / 🔴 Kritik Sorun
```

---

## 🎯 Test Sırası

1. **Coming Soon** (1 dk)
2. **Sepet Merge** (2 dk)
3. **Kupon Kodu** (1 dk)
4. **Ödeme Sayfası** (2 dk)
5. **Adres Yönetimi** (2 dk)
6. **Sipariş Listesi** (1 dk)
7. **Debug Kontrolleri** (1 dk)

**Toplam Süre: ~10 dakika** 