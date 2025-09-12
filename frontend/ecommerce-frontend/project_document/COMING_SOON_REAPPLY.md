# coming_soon_reapply.md

## Amaç
Bu döküman, geliştirme süreci tamamlandığında geçici olarak eklenen "coming-soon" (Çok Yakında) sayfası ve ilgili yönlendirme/gizleme kodlarının nasıl kaldırılacağını ve projenin eski haline nasıl döndürüleceğini yazılımcılara rehberlik etmek için hazırlanmıştır.

---

## 1. Ana Sayfa Yönlendirmesini Kaldırma

**Dosya:** `app/page.tsx`

- Şu anda ana sayfa (`/`) otomatik olarak `/coming-soon` sayfasına yönlendirilmekte.
- Geliştirme tamamlandığında, bu dosyadaki yönlendirme kodunu kaldırın ve eski ana sayfa içeriğini geri getirin veya `app/home/page.tsx` içeriğini tekrar ana sayfaya taşıyın.

**Örnek:**
```tsx
// Yönlendirme kodunu kaldırın:
import { redirect } from 'next/navigation';
export default function Home() {
  redirect('/coming-soon');
  return null;
}

// Yerine ana sayfa içeriğini ekleyin:
export { default } from './home/page';
```
veya doğrudan ana sayfa kodunu buraya taşıyın.

---

## 2. coming-soon Sayfasını ve İlgili Kodları Kaldırma

- `app/coming-soon/page.tsx` dosyasını ve varsa ilgili görselleri/projeye özel assetleri silebilirsiniz.
- Eğer başka bir yerde (ör. menüde) bu sayfaya link verildiyse, o linkleri de kaldırın.

---

## 3. Header ve Footer'ın Koşullu Gizlenmesini Kaldırma

**Dosya:** `app/components/ClientProviders.tsx`

- Sadece coming-soon sayfasında Header ve Footer'ı gizlemek için eklenen şu kodu kaldırın:
```tsx
import { usePathname } from 'next/navigation';
const pathname = usePathname();
const hideHeaderFooter = pathname === '/coming-soon';
...
{!hideHeaderFooter && <Header />}
...
{!hideHeaderFooter && <Footer />}
```
- Eski haline döndürün:
```tsx
<Header />
<main>{children}</main>
<Footer />
```

---

## 4. coming-soon ile İlgili Diğer Geçici Kodlar
- Eğer başka bir yerde (ör. özel stil, özel context, vs.) sadece coming-soon sayfasına özel kod eklediyseniz, bunları da temizleyin.

---

## 5. Son Kontrol
- Ana sayfa ve tüm modüller normal şekilde çalışıyor mu kontrol edin.
- coming-soon sayfası ve yönlendirmesi tamamen kaldırılmış olmalı.
- Header ve Footer tüm sayfalarda tekrar görünür olmalı.

---

**Not:**
Bu işlemler tamamlandığında projeniz canlıya alınmaya hazır hale gelir. Geliştirici ekibin, bu dökümandaki adımları uygulayarak geçici geliştirme modunu kaldırması gerekmektedir. 