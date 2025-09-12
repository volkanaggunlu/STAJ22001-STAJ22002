# Açık Atölye E-Ticaret Frontend - Proje Dökümantasyonu (Cursor)

## Genel Bakış
Bu proje, modern bir e-ticaret yönetim paneli ve müşteri arayüzü sunar. Next.js 15, TypeScript, Tailwind CSS ve ShadCN/UI gibi güncel teknolojilerle geliştirilmiştir. Amaç, ürün, kategori, kullanıcı ve sipariş yönetimi gibi e-ticaret operasyonlarını kolayca yönetebilecek, güvenli ve kullanıcı dostu bir arayüz sağlamaktır.

---

## Mimari Yapı
- **Framework:** Next.js 15 (App Router)
- **Dil:** TypeScript
- **Stil:** Tailwind CSS, ShadCN/UI
- **State Management:** TanStack Query, Zustand
- **Form Validasyonu:** Zod, React Hook Form
- **API:** RESTful backend ile tam entegre (Express.js, JWT, MongoDB)
- **UI:** Modüler ve yeniden kullanılabilir component yapısı

---

## Klasör ve Dosya Yapısı

### Kök Dizin
- `README.md`: Proje tanımı, kurulum ve kullanım talimatları
- `package.json`: Bağımlılıklar ve scriptler
- `tailwind.config.ts`, `postcss.config.mjs`: Stil yapılandırmaları
- `.env.local`, `.gitignore`: Ortam değişkenleri ve git ayarları

### app/
Next.js App Router ile sayfa ve layout yönetimi. Ana modüller:
- `admin/`: Yönetici paneli (dashboard, ürünler, kategoriler)
- `urun/`, `kategori/`: Müşteri tarafı ürün ve kategori sayfaları
- `(auth)/`: Giriş, kayıt, şifre sıfırlama, e-posta doğrulama
- `sepet/`, `favorilerim/`, `hesabim/`: Kullanıcıya özel sayfalar
- `layout.tsx`, `globals.css`: Genel layout ve global stiller

### components/
- `ui/`: Tüm temel ve gelişmiş UI bileşenleri (button, input, form, modal, toast, tablo, vs.)
- Ortak kullanılan componentler burada tutulur.

### lib/
- `api/`: API client (`client.ts`), tipler (`types.ts`), servisler (`services/`)
- `store/`: Zustand ile state yönetimi (ör. `cartStore.ts`, `authStore.ts`)
- `hooks/`: Custom React hook'ları (ör. `useProducts`, `useAuth`)
- `validations/`: Zod ile form ve veri validasyon şemaları (ör. `auth.ts`)
- `utils/`: Yardımcı fonksiyonlar ve sabitler (ör. `format.ts`, `constants.ts`)

### public/
Statik dosyalar (resimler, favicon, vs.)

### styles/
Global ve özel CSS dosyaları (Tailwind ile)

### api/
Frontend tarafında model veya mock API ile ilgili dosyalar (geliştiriciye özel)

---

## Temel Modüller ve Akışlar

### Authentication (Kimlik Doğrulama)
- JWT tabanlı, admin rol kontrolü, protected route, token refresh
- Giriş sayfası: `app/(auth)/login/page.tsx`
- Form validasyonu: Zod + React Hook Form
- API entegrasyonu: `lib/hooks/useAuth.ts`, `lib/api/client.ts`

### Admin Paneli
- Dashboard: `app/admin/page.tsx`
- Ürün yönetimi: `app/admin/products/`
  - Listeleme: `app/admin/products/page.tsx`
  - Yeni ürün ekleme: `app/admin/products/new/page.tsx`
  - Ürün düzenleme: `app/admin/products/[id]/page.tsx`
- Kategori yönetimi: `app/admin/categories/`
  - Listeleme: `app/admin/categories/page.tsx`
  - Yeni kategori ekleme: `app/admin/categories/new/page.tsx`

### Müşteri Arayüzü
- Ana sayfa: `app/page.tsx`
- Ürün detay: `app/urun/[slug]/page.tsx`
- Kategori detay: `app/kategori/[slug]/page.tsx`
- Sepet: `app/sepet/`
- Favoriler: `app/favorilerim/`

### UI Bileşenleri
- Tüm formlar, butonlar, modal ve tablolar `components/ui/` altında modüler olarak yazılmıştır.
- Örnekler: `button.tsx`, `input.tsx`, `form.tsx`, `table.tsx`, `toast.tsx`, `modal.tsx`

### State ve API Yönetimi
- API çağrıları: `lib/api/client.ts` ve ilgili servisler
- State yönetimi: `lib/store` (Zustand) ve TanStack Query
- Custom hook'lar: `lib/hooks` (ör. ürün, kategori, auth işlemleri)

### Validasyon ve Yardımcılar
- Form ve veri validasyonu: `lib/validations/`
- Yardımcı fonksiyonlar: `lib/utils/`

---

## Kurulum ve Çalıştırma
1. Bağımlılıkları yükleyin: `npm install` veya `yarn install`
2. Ortam değişkenlerini ayarlayın: `.env.local`
3. Geliştirme sunucusunu başlatın: `npm run dev`
4. Tarayıcıda açın: `http://localhost:3001`

---

## Güvenlik ve Entegrasyon
- JWT ile kimlik doğrulama ve rol bazlı erişim
- XSS koruması, dosya yükleme validasyonu
- Tüm API endpoint'leri RESTful ve güvenli şekilde entegre

---

## Ekstra Bilgi ve Dökümantasyon
- Daha fazla detay için: `README.md`, `API_DOCUMENTATION.md`, `front_doc.md`, `admin_panel.md` dosyalarına bakabilirsiniz.

---

**Bu dosya, Cursor editöründe projeyi hızlıca anlamak ve kodun genel mimarisini kavramak için hazırlanmıştır. Belirli bir modül veya dosya hakkında detay isterseniz belirtmeniz yeterli!** 