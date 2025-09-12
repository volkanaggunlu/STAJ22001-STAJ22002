# Proje Bağlam Rehberi (Context Guide)

Bu rehber, yeni bir mühendisin projeye hızla adapte olmasını, kodu güvenle genişletmesini ve doğru konvansiyonlarla yeni özellikler eklemesini sağlar. Proje: Next.js (App Router) + React 19 + TypeScript + Tailwind + Radix UI + React Query + Zustand + Axios + RHF + Zod.

---

## 1) Hızlı Başlangıç

- Gereksinimler: Node 18+, pnpm/npm
- Kurulum:
  - `pnpm install` veya `npm install`
  - `cp example.env.local .env.local` ve `NEXT_PUBLIC_API_URL` gibi değişkenleri güncelle
  - Geliştirme: `npm run dev` (Next 15, App Router, experimental https)
- Build/Start: `npm run build` → `npm start`

---

## 2) Teknoloji Yığını ve Mimari

- Framework: Next.js 15 (App Router)
- Dil: TypeScript (TS 5)
- UI: Tailwind CSS, Radix UI, class-variance-authority, lucide-react ikonlar
- State: React Query (server-state), Zustand (UI/local state)
- Form: react-hook-form + zod
- HTTP: axios (`lib/api/client.ts`), servisler `lib/api/services/`
- Yardımcılar: `lib/utils/*` (format, constants, auth helper)
- Mağaza: `lib/store/*` (cartStore, authStore, couponStore)

Mimari katmanlar:
- Sayfa yönlendirme ve layout: `app/*`
- Bileşenler: `components/ui`, `components/admin`, `components/checkout`
- İş mantığı/hook: `hooks/*`, `lib/hooks/*`
- API istemci/servis: `lib/api/*`
- Durum: `lib/store/*`
- Validasyon: `lib/validations/*`

---

## 3) Dizin Yapısı (Özet)

- `app/`
  - `layout.tsx`: global layout, provider’lar (`ClientProviders`)
  - `page.tsx`: `/home`’a redirect
  - Önemli route’lar: `home/`, `urun/`, `urunler/`, `sepet/`, `odeme/`, `hesabim/`, `siparislerim/`, `admin/`, `kategori/`, `(auth)/`
  - Ortak app bileşenleri: `app/components/*` (Header, Footer, Drawer, ProtectedRoute, AdminSidebar …)
- `components/`
  - `ui/*`: Radix tabanlı UI atom/molekül seti (button, input, table, dialog, sheet, sidebar, toast, form …)
  - `admin/*`: Admin panel spesifik bileşenler
  - `checkout/*`: Ödeme/checkout süreç bileşenleri
- `hooks/`: Sayfa/özellik bazlı client hook’ları (orders, shipping, addresses, categories…)
- `lib/`
  - `api/client.ts`: axios client, interceptor ve baseURL
  - `api/services/*`: resource bazlı servisler
  - `hooks/*`: paylaşımlı data hook’ları (auth, products, admin*)
  - `store/*`: Zustand mağazaları (cart, auth, coupon)
  - `utils/*`: yardımcılar (constants, format, auth)
  - `validations/*`: zod şemaları (form doğrulama)
- `api/models/*`: Backend model şemalarının referans kopyaları (Order, User, Product…)
- `project_document/*`: Proje dokümantasyonları (index, mimari, ödeme, sepet, …)

---

## 4) Routing ve Layout

- App Router kullanımı: Her klasörde `page.tsx` route’u oluşturur.
- Global metadata ve theme: `app/layout.tsx`
- Yönlendirme: Kök `/` → `/home`
- Dinamik rotalar: `urun/[id]`, `kategori/[slug]`, `siparislerim/[orderId]`, `takip/[id]`, `kargo-takip/[id]`
- Segmentler: `(auth)/*` (login/register/forgot/reset/email-verification)

---

## 5) Durum Yönetimi ve Veri Akışı

- React Query: Server-state; cache key konvansiyonu `['resource', params]`
  - Varsayılan `staleTime` 5 dk, retry kapalı (global)
- Zustand: UI/local state (örn. `cartStore`, `authStore`)
- Akış: API → Service (`lib/api/services`) → Hook (React Query/Zustand) → UI bileşenleri

---

## 6) API Entegrasyonu

- Base URL: `.env.local` → `NEXT_PUBLIC_API_URL`
- İstemci: `lib/api/client.ts` (axios), interceptor’larla auth header ekleme
- Tipler: `lib/api/types.ts`
- Servisler: `lib/api/services/*` (ör. `products`, `orders`, `categories`, `payments` …)
- Örnek kullanım:
  - Sorgu: Hook içinde `useQuery({ queryKey, queryFn: services.products.list })`
  - Mutasyon: `useMutation(services.orders.create)` ve başarı/başarısızlık toast’ları

---

## 7) UI ve Tasarım Sistemi

- Tailwind: `tailwind.config.ts` ile theme, renkler ve animasyonlar
- Radix UI: `components/ui/*` sarmalayıcıları ile erişilir (dialog, dropdown, select, table, sheet, sidebar …)
- İkonlar: `lucide-react`
- Stil kompozisyonu: `clsx`, `tailwind-merge`, `class-variance-authority`

---

## 8) Formlar ve Doğrulama

- RHF + Zod: `@hookform/resolvers/zod` ile form şemaları
- Ortak form bileşenleri: `components/ui/form.tsx` ve `components/ui/input|select|textarea`
- Bildirim: `sonner` toaster ve `hooks/use-toast`

---

## 9) Güvenlik ve Konfigürasyon

- `next.config.mjs`: build hatalarını yok sayma (dev), remote image patterns
- HTTPS dev: `npm run dev -- --experimental-https`
- Env değişkenleri: `example.env.local` şablon; public prefix `NEXT_PUBLIC_*`
- Auth: `lib/utils/auth.ts` yardımcıları; client tarafı koruma: `app/components/ProtectedRoute.tsx`

---

## 10) Test ve Kalite

- Test araçları: Jest + RTL (kurulu), scriptler README’de
- Lint/format: ESLint 9 + Prettier 3
- Kod standartları: TS strict, erken dönüşler, anlaşılır isimlendirme, 2-3 seviye nested sınırı

---

## 11) Geliştirme Rehberi (Yeni Özellik Ekleme)

- Yeni sayfa:
  1) `app/<route>/page.tsx` oluştur
  2) Gerekli servis çağrılarını `lib/api/services/*` altına ekle
  3) UI bileşenlerini `components/ui` veya özelleştirilmiş dizinde kullan
  4) Gerekirse Zustand store veya React Query kullan (cache key tanımla)
- Yeni API resource:
  1) `lib/api/services/<resource>.ts` + tipler `lib/api/types.ts`
  2) İlgili hook: `lib/hooks/use<Resource>.ts`
  3) UI: tablo/form sayfaları ve validasyon şeması
- Yeni form:
  1) Zod şeması `lib/validations/*`
  2) RHF + `components/ui/form.tsx` ile render
  3) Mutasyon sonrası toast ve invalid alanlarda hata gösterimi

---

## 12) Performans ve İzleme

- React Query cache ve `staleTime` ayarları
- Lazy load ve `loading.tsx` şablonları (liste sayfalarında mevcut)
- Görseller: `next/image` remotePatterns ile optimize (şimdilik unoptimized=true)

---

## 13) Dağıtım ve Ortamlar

- Dev: `.env.local` ve localhost API
- Prod: Build → `next start` (Docker/Nginx entegrasyonu README’de)
- CDN/Görsel domain whitelist: `next.config.mjs` `remotePatterns`

---

## 14) Güvenlik Politikaları

- Yetkilendirme: Admin route’ları için `ProtectedRoute`
- Gizli bilgiler: `.env` ve hiçbir gizli bilgi repo’ya eklenmez
- Log’larda PII maskeleme (toast ve UI’da gösterme)

---

## 15) Route Ağacı (Özet)

- `/home`, `/urun/[id]`, `/urunler`, `/sepet`, `/odeme`, `/hesabim`, `/siparislerim`, `/kategori/[slug]`, `/takip/[id]`, `/kargo-takip/[id]`
- Auth segment: `/login`, `/register`, `/forgot-password`, `/reset-password`, `/email-verification`
- Admin: `/admin/*` (dashboard, products, orders, categories, email, shipping)

---

## 16) Sözlük ve SSS

- Server state: Sunucudan gelen verinin önbellek yönetimi
- Local/UI state: Bileşen etkileşimi ve geçici durum
- Query key: React Query’de cache anahtarı
- Mutation: Veri değiştirme işlemleri (POST/PUT/DELETE)

---

## 17) Bağlantılar

- Ana README: `README.md`
- Doküman indeksi: `project_document/00_DOCUMENTATION_INDEX.md`
- API ana dokümanı: `project_document/API_MAIN_DOCUMENTATION.md`
- Ödeme: `project_document/PAYMENT_*`
- Sepet: `project_document/CART_*`

---

Bu rehber düzenli güncellenecek canlı bir dokümandır. Yeni modüller eklendiğinde ilgili bölümlere kısa özet ve referans bağlantı ekleyin. 

---

## 15.1) Route Ağacı (Detaylı Tablo)

| Segment | Yol | Açıklama |
|---|---|---|
| Root | `/` | `/home`’a yönlendirir |
| Home | `/home` | Ana sayfa |
| Ürün | `/urun/[id]` | Ürün detay |
| Ürünler | `/urunler` | Ürün listesi + `loading.tsx` |
| Kategori | `/kategori/[slug]` | Kategori liste |
| Sepet | `/sepet` | Sepet sayfası |
| Ödeme | `/odeme` | Ödeme akışı (alt: `components`, `hooks`, `utils`, `types`, `stores`, `basarili`) |
| Hesabım | `/hesabim` | Profil ve adresler (alt: `adreslerim/`) |
| Siparişlerim | `/siparislerim` | Sipariş listesi (alt: `/[orderId]` detay) |
| Favorilerim | `/favorilerim` | Favori ürünler (loading mevcut) |
| Kargo Takip | `/kargo-takip` | Kargo takip ekranı |
| Bundle | `/bundle/[id]` | Paket/Bundle sayfası |
| Auth | `/(auth)/*` | `login`, `register`, `forgot-password`, `reset-password`, `email-verification` |
| Admin | `/admin/*` | Dashboard, `products/`, `orders/`, `categories/`, `email/`, `shipping/` |

---

## 5.1) Hook Envanteri (Özet)

| Konum | Hook | Amaç |
|---|---|---|
| `hooks/` | `useOrders` | Sipariş listeleme/filtreleme |
| `hooks/` | `useOrderDetail` | Sipariş detayını getirir |
| `hooks/` | `useShipping` | Kargo şirketleri, ücret, servis seçimi |
| `hooks/` | `useUserAddresses` | Kullanıcı adreslerini yönetir |
| `hooks/` | `useInvoiceAddresses` | Fatura adreslerini yönetir |
| `hooks/` | `useUserFavorites` | Favori ürünleri yönetir |
| `hooks/` | `useCategories` | Kategorileri getirir |
| `hooks/` | `useCampaigns` | Kampanya verileri |
| `hooks/` | `usePaymentMethods` | Ödeme yöntemleri |
| `hooks/` | `useEmailStatus`/`useEmailTest` | E-posta test/status |
| `hooks/` | `useBankAccounts` | Banka hesapları |
| `hooks/` | `useKvkkText`/`useLegalLinks` | KVKK ve yasal linkler |
| `lib/hooks/` | `useAuth` | Oturum ve kullanıcı bilgisi |
| `lib/hooks/` | `useProducts` | Ürün liste/detay/arama |
| `lib/hooks/` | `useAdminProducts` | Admin ürün operasyonları |
| `lib/hooks/` | `useAdminCategories` | Admin kategori operasyonları |

---

## 6.1) Service Katmanı (Resource Bazlı)

| Dosya | Resource | Örnek Operasyonlar |
|---|---|---|
| `lib/api/services/auth.ts` | Auth | `login`, `register`, `profile`, `verifyEmail`, `resetPassword` |
| `lib/api/services/products.ts` | Products | `list`, `getById`, `search`, `createReview` |
| `lib/api/services/categories.ts` | Categories | `list`, `tree`, `getBySlug` |
| `lib/api/services/shipping.ts` | Shipping | `carriers`, `quote`, `track`, `zones` |
| `lib/api/services/admin.ts` | Admin | `productsCRUD`, `ordersCRUD`, `categoriesCRUD`, `emails`, `shippingAdmin` |

Notlar:
- Base client: `lib/api/client.ts` (axios, interceptor)
- Tipler: `lib/api/types.ts`
- Cache anahtarları: `['products']`, `['orders', params]` gibi tutarlı isimlendirme önerilir.

---

## 5.2) Store (Zustand) Özeti

| Store | Durum | Seçiciler/Metodlar (örnek) |
|---|---|---|
| `lib/store/cartStore.ts` | Sepet kalemleri, miktar, toplam | `addItem`, `removeItem`, `clear`, `applyCoupon` |
| `lib/store/authStore.ts` | Token, kullanıcı, roller | `setToken`, `setUser`, `logout`, `isAuthorized` |
| `lib/store/couponStore.ts` | Kupon kodu/durumu | `setCoupon`, `clearCoupon` |

---

## 6.2) Validasyon Şemaları (Zod)

| Dosya | Amaç |
|---|---|
| `lib/validations/auth.ts` | Login/register/şifre reset formları şemaları |

---

## 7.1) UI Bileşen Kataloğu (Kısa)

`components/ui/*` altında Radix tabanlı kapsamlı bir set vardır: `button`, `input`, `select`, `dialog`, `dropdown-menu`, `sheet`, `sidebar`, `table`, `toast`, `form`, `calendar`, `carousel`, `chart` vb.

Kullanım ilkesi: Önce `ui/*` sarmalayıcılarını tercih edin, özel ihtiyaç varsa bileşeni genişletin. 