# 🛒 Açık Atölye E-Ticaret Projesi - Genel Bakış

## 📋 Proje Tanımı

Bu proje, **Açık Atölye** adlı elektronik komponentler e-ticaret sitesinin **frontend** uygulamasıdır. Modern web teknolojileri kullanılarak geliştirilmiş, tam fonksiyonel bir e-ticaret platformudur.

## 🎯 Proje Amacı

- Elektronik komponentler, Arduino kitleri, 3D baskı malzemeleri satışı
- Kullanıcı dostu alışveriş deneyimi
- Güçlü admin panel ile ürün/kategori yönetimi
- Mobil-first responsive tasarım
- SEO optimizasyonu

## 📊 Proje Durumu

### ✅ Tamamlanan Modüller
- **Authentication & Authorization** - JWT tabanlı güvenli giriş sistemi
- **Dashboard** - İstatistikler, chart'lar ve genel bakış
- **Ürün Yönetimi** - Tam CRUD işlemleri, resim upload, kategori sistemi
- **E-ticaret Özellikleri** - Sepet, ödeme, kullanıcı hesabı
- **Admin Panel** - Tam fonksiyonel admin sistemi

### 🚧 Devam Eden Modüller
- **Kategori Yönetimi** - Geliştirme aşamasında
- **Sipariş Yönetimi** - Temel yapı mevcut

### ⏳ Planlanan Modüller
- **Kullanıcı Yönetimi** - Admin tarafında gelişmiş kullanıcı işlemleri
- **Raporlama Sistemi** - Gelişmiş analitikler
- **İndirim/Kupon Sistemi**

## 🛠️ Teknoloji Stack

### Frontend Core
```
Next.js 15        - React framework (App Router)
TypeScript        - Type safety
Tailwind CSS      - Utility-first CSS framework
ShadCN/UI         - Modern component library
```

### State Management & API
```
TanStack Query    - Server state management
Zustand          - Client state management
React Hook Form  - Form handling
Zod              - Schema validation
Axios            - HTTP client
```

### Development Tools
```
ESLint           - Code linting
Prettier         - Code formatting
TypeScript       - Static type checking
PostCSS          - CSS processing
```

## 📁 Proje Yapısı

```
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth route group
│   ├── admin/             # Admin panel pages
│   ├── components/        # Page-specific components
│   ├── hesabim/           # User account pages
│   ├── kategori/          # Category pages
│   ├── sepet/             # Cart page
│   ├── urun/              # Product detail pages
│   ├── urunler/           # Products listing
│   └── globals.css        # Global styles
├── components/            # Shared components
│   └── ui/                # ShadCN/UI components
├── lib/                   # Utilities and configurations
│   ├── api/               # API client and services
│   ├── hooks/             # Custom React hooks
│   ├── store/             # Zustand stores
│   ├── utils/             # Utility functions
│   └── validations/       # Zod schemas
├── hooks/                 # Global custom hooks
├── public/                # Static assets
└── styles/                # Additional styles
```

## 🔗 Backend Entegrasyonu

- **Backend API**: Express.js + MongoDB
- **Base URL**: `http://localhost:5000/api`
- **Authentication**: JWT Bearer tokens
- **File Upload**: Multipart form data
- **API Documentation**: OpenAPI/Swagger

## 👥 Hedef Kullanıcılar

### End Users (Müşteriler)
- Elektronik hobi meraklıları
- Arduino/Raspberry Pi geliştiricileri
- 3D baskı tutkunları
- Öğrenciler ve eğitmenler

### Admin Users
- Mağaza yöneticileri
- Ürün ekip üyeleri
- Müşteri hizmetleri temsilcileri

## 🎨 Tasarım Sistemi

### Renk Paleti
- **Primary**: Blue (600-700)
- **Secondary**: Purple (600-700)
- **Accent**: Yellow (500-600)
- **Success**: Green (600)
- **Warning**: Orange (500)
- **Error**: Red (600)

### Tipografi
- **Font Family**: Inter (Google Fonts)
- **Heading**: Font weights 600-700
- **Body**: Font weight 400
- **UI Elements**: Font weight 500

## 📱 Responsive Breakpoints

```css
sm:  640px   # Small tablets
md:  768px   # Large tablets
lg:  1024px  # Small laptops
xl:  1280px  # Large laptops
2xl: 1536px  # Desktops
```

## 🔒 Güvenlik Özellikleri

- **JWT Token Management** - Secure storage ve refresh
- **Role-based Access Control** - Admin/User rolleri
- **Input Validation** - Zod schema validation
- **XSS Protection** - React built-in protection
- **CSRF Protection** - Token-based validation
- **File Upload Security** - Type ve size validation

## 📈 Performans Metrikleri

### Target Metrics
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3.5s
- **Cumulative Layout Shift**: < 0.1

### Optimization Strategies
- Image optimization (Next.js Image)
- Code splitting (Route-based)
- Tree shaking
- Bundle analysis
- Caching strategies

## 🧪 Test Stratejisi

### Test Types (Planned)
- **Unit Tests**: Jest + React Testing Library
- **Integration Tests**: Custom hooks ve API calls
- **E2E Tests**: Playwright (planned)
- **Visual Regression**: Chromatic (planned)

## 📦 Deployment

### Environment Support
- **Development**: Local development server
- **Staging**: Test ortamı
- **Production**: Live site

### Hosting Options
- **Vercel** (recommended for Next.js)
- **Netlify**
- **AWS Amplify**
- **Custom VPS**

## 🔄 Version Control

- **Git Flow**: Feature branches
- **Commit Convention**: Conventional Commits
- **Branch Protection**: Main branch protected
- **Code Review**: Required for merges

## 📚 Dokümantasyon

Bu dokümantasyon seti şunları içerir:
- Architecture guide
- Setup instructions
- Component documentation
- API integration guide
- Deployment guide
- Development guidelines

## 🤝 Contributing

### Development Workflow
1. Issue oluştur/seç
2. Feature branch oluştur
3. Development yap
4. Code review al
5. Main branch'e merge

### Code Standards
- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- Meaningful commit messages
- Component documentation

## 📞 İletişim & Support

- **Tech Lead**: [Developer Name]
- **Email**: [developer@email.com]
- **Documentation**: Bu klasördeki dökümanlar
- **Issue Tracking**: GitHub Issues

---

**Son Güncelleme**: Aralık 2024  
**Doküman Versiyonu**: 1.0  
**Proje Versiyonu**: 0.1.0 