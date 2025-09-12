# 🚀 Kurulum ve Geliştirme Ortamı Kurulumu

## 📋 Sistem Gereksinimleri

### Minimum Gereksinimler
- **Node.js**: v18.17.0 veya üzeri
- **npm**: v9.0.0 veya üzeri (Node.js ile gelir)
- **Git**: v2.30.0 veya üzeri
- **RAM**: Minimum 4GB (8GB önerilen)
- **Storage**: Minimum 2GB boş alan

### Önerilen IDE/Editor
- **Cursor** (Ana geliştirme IDE'si)
- **VS Code** (Alternatif)
- **WebStorm** (JetBrains kullanıcıları için)

### Önerilen Browser
- **Chrome**: v100+ (DevTools için)
- **Firefox**: v100+
- **Safari**: v15+ (macOS kullanıcıları için)

## 🛠️ Kurulum Adımları

### 1. Repository'yi Klonlama
```bash
# HTTPS ile klonlama
git clone https://github.com/[username]/ecommerce-frontend.git
cd ecommerce-frontend

# SSH ile klonlama (önerilen)
git clone git@github.com:[username]/ecommerce-frontend.git
cd ecommerce-frontend
```

### 2. Node.js Bağımlılıklarını Yükleme
```bash
# npm kullanarak
npm install

# yarn kullanarak (alternatif)
yarn install

# pnpm kullanarak (alternatif)
pnpm install
```

### 3. Environment Variables Ayarlama
```bash
# Örnek env dosyasını kopyalama
cp example.env.local .env.local

# .env.local dosyasını düzenleme
nano .env.local  # veya preferred editor
```

#### Environment Variables Açıklaması
```bash
# .env.local dosyası içeriği

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Frontend URL (production için)
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3001

# Environment
NODE_ENV=development

# Optional: Analytics keys (production için)
NEXT_PUBLIC_GA_ID=your-google-analytics-id
NEXT_PUBLIC_GTM_ID=your-google-tag-manager-id

# Optional: Error tracking (production için)
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn

# Optional: Storage keys (production için)
NEXT_PUBLIC_AWS_BUCKET=your-s3-bucket
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloudinary-name
```

### 4. Development Server Başlatma
```bash
# Development mode
npm run dev

# Specific port ile çalıştırma
npm run dev -- --port 3001

# Debug mode ile çalıştırma
NODE_OPTIONS='--inspect' npm run dev
```

## 🔧 IDE Konfigürasyonu

### Cursor IDE Setup

#### 1. Gerekli Extension'lar
```json
// .cursor/extensions.json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-typescript.typescript",
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "MS-vsliveshare.vsliveshare"
  ]
}
```

#### 2. Workspace Settings
```json
// .cursor/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.suggest.autoImports": true,
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "tailwindCSS.includeLanguages": {
    "typescript": "javascript",
    "typescriptreact": "javascript"
  },
  "typescript.preferences.includePackageJsonAutoImports": "auto",
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  }
}
```

### VS Code Setup (Alternatif)

#### 1. Extension'lar
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- TypeScript Importer
- Prettier - Code formatter
- ESLint
- Auto Rename Tag
- Bracket Pair Colorizer 2
- GitLens

#### 2. User Settings
```json
{
  "editor.fontSize": 14,
  "editor.fontFamily": "'Fira Code', Consolas, 'Courier New', monospace",
  "editor.fontLigatures": true,
  "workbench.iconTheme": "material-icon-theme",
  "workbench.colorTheme": "One Dark Pro",
  "terminal.integrated.fontSize": 13
}
```

## 🔗 Backend Bağlantısı

### Backend Requirements
Projenin çalışması için backend API server'ın çalışır durumda olması gerekir:

```bash
# Backend repository'yi klonlama
git clone https://github.com/[username]/ecommerce-backend.git
cd ecommerce-backend

# Backend kurulumu ve çalıştırma
npm install
npm run dev  # Port 5000'de çalışır
```

### API Connection Test
```bash
# Backend API test
curl http://localhost:5000/api/health

# Beklenen response:
# {"status": "ok", "timestamp": "2024-12-..."}
```

## 📝 Development Scripts

### Mevcut NPM Scripts
```bash
# Development server
npm run dev          # http://localhost:3000

# Production build
npm run build        # Build oluşturur
npm run start        # Production server başlatır

# Code quality
npm run lint         # ESLint çalıştırır
npm run lint:fix     # ESLint ile hataları düzeltir

# Type checking
npm run type-check   # TypeScript hata kontrolü
```

### Custom Scripts (package.json'a eklenebilir)
```json
{
  "scripts": {
    "dev:debug": "NODE_OPTIONS='--inspect' next dev",
    "dev:turbo": "next dev --turbo",
    "analyze": "ANALYZE=true npm run build",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

## 🛠️ Development Tools Setup

### 1. Git Hooks (Husky)
```bash
# Husky kurulumu
npm install --save-dev husky
npx husky-init

# Pre-commit hook eklemek
echo "npm run lint" > .husky/pre-commit
echo "npm run type-check" >> .husky/pre-commit
```

### 2. Commitizen Setup
```bash
# Conventional commits için
npm install --save-dev commitizen cz-conventional-changelog

# package.json'a ekle:
{
  "config": {
    "commitizen": {
      "path": "cz-conventional-changelog"
    }
  }
}

# Kullanım:
npm run commit  # veya git cz
```

### 3. Bundle Analyzer
```bash
# Bundle analizi için
npm install --save-dev @next/bundle-analyzer

# next.config.mjs'ye ekle:
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer(nextConfig)

# Çalıştırma:
ANALYZE=true npm run build
```

## 🌐 Browser Development Tools

### Chrome DevTools Extensions
- React Developer Tools
- TanStack Query DevTools (built-in)
- Redux DevTools (eğer Redux kullanırsak)

### Network Tab Kullanımı
```javascript
// API calls monitoring
// Network tab'da filtreleme:
// - XHR/fetch requests
// - Failed requests (4xx, 5xx)
// - Slow requests (>1s)
```

## 🐛 Debugging Setup

### Browser Debugging
```javascript
// Console debugging
console.log('Debug info:', data)
console.table(arrayData)
console.time('operation')
// ... operation
console.timeEnd('operation')

// React DevTools kullanımı
// Components tab'da state inspection
// Profiler tab'da performance analysis
```

### Node.js Debugging
```bash
# Debug mode ile başlatma
NODE_OPTIONS='--inspect' npm run dev

# Chrome'da chrome://inspect açıp Connect
```

### VS Code Debugging
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node",
      "request": "attach",
      "port": 9229,
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "name": "Next.js: debug client-side",
      "type": "pwa-chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

## 🧪 Testing Setup

### Jest Configuration
```bash
# Test dependencies
npm install --save-dev jest @testing-library/react @testing-library/jest-dom

# jest.config.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
}

module.exports = createJestConfig(customJestConfig)
```

## 🚀 Performance Optimization

### Development Performance
```bash
# Turbo mode (Next.js 13+)
npm run dev -- --turbo

# Memory optimization
NODE_OPTIONS="--max-old-space-size=4096" npm run dev
```

### Build Performance
```javascript
// next.config.mjs optimizations
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: {
      // Turbo pack configurations
    },
  },
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Development optimizations
      config.devtool = 'eval-cheap-module-source-map'
    }
    return config
  },
}
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Port 3000 kullanımda ise
lsof -ti:3000 | xargs kill -9

# Farklı port kullanma
npm run dev -- --port 3001
```

#### 2. Node Modules Issues
```bash
# Cache temizleme
npm cache clean --force

# Node modules silip yeniden kurma
rm -rf node_modules package-lock.json
npm install
```

#### 3. TypeScript Errors
```bash
# TypeScript cache temizleme
rm -rf .next
npm run build
```

#### 4. Environment Variables Not Loading
```bash
# .env.local dosyasını kontrol et
cat .env.local

# Restart development server
# CTRL+C ile durdur, npm run dev ile başlat
```

## 📚 Additional Resources

### Faydalı Linkler
- [Next.js Documentation](https://nextjs.org/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [ShadCN/UI Documentation](https://ui.shadcn.com)
- [TanStack Query Documentation](https://tanstack.com/query)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

### Community Resources
- [Next.js GitHub Discussions](https://github.com/vercel/next.js/discussions)
- [React TypeScript Cheatsheets](https://github.com/typescript-cheatsheets/react)
- [TailwindCSS Components](https://tailwindui.com)

---

**Son Güncelleme**: Aralık 2024  
**Doküman Versiyonu**: 1.0 