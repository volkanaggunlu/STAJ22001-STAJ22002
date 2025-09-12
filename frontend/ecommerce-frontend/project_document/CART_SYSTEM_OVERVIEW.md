# 🛒 Sepet Sistemi Genel Bakış

## 📋 İçindekiler
1. [Sistem Genel Bakış](#sistem-genel-bakış)
2. [State Yönetimi](#state-yönetimi)
3. [API Endpoint'leri](#api-endpointleri)
4. [Frontend Implementasyonu](#frontend-implementasyonu)
5. [Test Senaryoları](#test-senaryoları)
6. [Gelecek Geliştirmeler](#gelecek-geliştirmeler)

---

## 🏗️ Sistem Genel Bakış

Sepet yönetimi, e-ticaret uygulamasında kullanıcıların ürünleri satın almadan önce geçici olarak biriktirdiği alandır. Sistem hem frontend (Zustand ile local state) hem de backend (API ile) üzerinden yönetilebilir.

### Mevcut Durum
- ✅ Frontend sepet yönetimi (Zustand)
- ✅ LocalStorage entegrasyonu
- ✅ Ürün ekleme/çıkarma
- ✅ Miktar güncelleme
- ⏳ Backend API entegrasyonu (planlanıyor)

### Sistem Özellikleri
- 🛒 Ürün ekleme/çıkarma
- 📊 Miktar güncelleme
- 💾 LocalStorage saklama
- 🔄 Otomatik senkronizasyon
- 🧹 Sepet temizleme

---

## 🔄 State Yönetimi

### Zustand Store Yapısı
```typescript
interface CartItem {
  id: string;           // Ürün ID
  product: Product;     // Ürün objesi
  quantity: number;     // Sepetteki miktar
  price: number;        // Birim fiyat
  totalPrice: number;   // Toplam fiyat
}

interface StoreState {
  cart: CartItem[];
  cartTotal: number;
  cartCount: number;
  
  // Actions
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
}
```

### LocalStorage Entegrasyonu
```typescript
// Sepet verisi localStorage'da saklanır
const CART_STORAGE_KEY = 'ecommerce-cart';

// Sepet verilerini localStorage'dan yükle
const loadCartFromStorage = (): CartItem[] => {
  if (typeof window === 'undefined') return [];
  
  const stored = localStorage.getItem(CART_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

// Sepet verilerini localStorage'a kaydet
const saveCartToStorage = (cart: CartItem[]) => {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
};
```

---

## 🔌 API Endpoint'leri

### 1. Sepet İçeriğini Getir
```http
GET /api/cart
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "665f8a123456789abcde111",
        "product": {
          "_id": "665f8a123456789abcde111",
          "name": "Arduino Uno R3",
          "price": 249.99,
          "image": "https://cdn.site.com/arduino.jpg",
          "sku": "ARDUINO-001"
        },
        "quantity": 2,
        "price": 249.99,
        "totalPrice": 499.98
      }
    ],
    "total": 499.98,
    "itemCount": 1
  }
}
```

### 2. Sepete Ürün Ekle
```http
POST /api/cart/add
```

**Request Body:**
```json
{
  "productId": "665f8a123456789abcde111",
  "quantity": 2
}
```

**Response:**
```json
{
  "success": true,
  "message": "Ürün sepete eklendi",
  "data": {
    "item": {
      "id": "665f8a123456789abcde111",
      "product": {
        "_id": "665f8a123456789abcde111",
        "name": "Arduino Uno R3",
        "price": 249.99,
        "image": "https://cdn.site.com/arduino.jpg"
      },
      "quantity": 2,
      "price": 249.99,
      "totalPrice": 499.98
    },
    "cartTotal": 499.98,
    "cartCount": 1
  }
}
```

### 3. Sepetten Ürün Çıkar
```http
DELETE /api/cart/remove/{productId}
```

**Response:**
```json
{
  "success": true,
  "message": "Ürün sepetten çıkarıldı",
  "data": {
    "removedProductId": "665f8a123456789abcde111",
    "cartTotal": 0,
    "cartCount": 0
  }
}
```

### 4. Ürün Miktarını Güncelle
```http
PUT /api/cart/update
```

**Request Body:**
```json
{
  "productId": "665f8a123456789abcde111",
  "quantity": 3
}
```

**Response:**
```json
{
  "success": true,
  "message": "Ürün miktarı güncellendi",
  "data": {
    "item": {
      "id": "665f8a123456789abcde111",
      "quantity": 3,
      "totalPrice": 749.97
    },
    "cartTotal": 749.97,
    "cartCount": 1
  }
}
```

### 5. Sepeti Temizle
```http
DELETE /api/cart/clear
```

**Response:**
```json
{
  "success": true,
  "message": "Sepet temizlendi",
  "data": {
    "cartTotal": 0,
    "cartCount": 0
  }
}
```

---

## 🖥️ Frontend Implementasyonu

### Zustand Store Kullanımı
```typescript
import { useStore } from '@/lib/store';

const CartComponent = () => {
  const { 
    cart, 
    cartTotal, 
    cartCount,
    addToCart, 
    removeFromCart, 
    updateQuantity, 
    clearCart 
  } = useStore();

  // Ürün ekleme
  const handleAddToCart = (product: Product) => {
    addToCart(product, 1);
  };

  // Ürün çıkarma
  const handleRemoveFromCart = (productId: string) => {
    removeFromCart(productId);
  };

  // Miktar güncelleme
  const handleUpdateQuantity = (productId: string, quantity: number) => {
    updateQuantity(productId, quantity);
  };

  return (
    <div>
      <h2>Sepet ({cartCount} ürün)</h2>
      <p>Toplam: {cartTotal.toFixed(2)} TL</p>
      
      {cart.map(item => (
        <CartItem 
          key={item.id}
          item={item}
          onRemove={handleRemoveFromCart}
          onUpdateQuantity={handleUpdateQuantity}
        />
      ))}
      
      <button onClick={clearCart}>Sepeti Temizle</button>
    </div>
  );
};
```

### Sepet Bileşeni
```typescript
interface CartItemProps {
  item: CartItem;
  onRemove: (productId: string) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
}

const CartItem: React.FC<CartItemProps> = ({ item, onRemove, onUpdateQuantity }) => {
  return (
    <div className="cart-item">
      <img src={item.product.image} alt={item.product.name} />
      <div className="item-details">
        <h3>{item.product.name}</h3>
        <p>{item.price.toFixed(2)} TL</p>
        
        <div className="quantity-controls">
          <button 
            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
            disabled={item.quantity <= 1}
          >
            -
          </button>
          <span>{item.quantity}</span>
          <button 
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
          >
            +
          </button>
        </div>
        
        <p>Toplam: {item.totalPrice.toFixed(2)} TL</p>
        
        <button onClick={() => onRemove(item.id)}>
          Kaldır
        </button>
      </div>
    </div>
  );
};
```

---

## 🧪 Test Senaryoları

### 1. Sepete Ürün Ekleme Testi
```javascript
// Test senaryosu: Sepete ürün ekleme
const testAddToCart = {
  product: {
    id: "TEST-PRODUCT-001",
    name: "Test Ürün",
    price: 100.00
  },
  quantity: 2,
  expectedCartCount: 1,
  expectedCartTotal: 200.00
};
```

### 2. Sepetten Ürün Çıkarma Testi
```javascript
// Test senaryosu: Sepetten ürün çıkarma
const testRemoveFromCart = {
  productId: "TEST-PRODUCT-001",
  expectedCartCount: 0,
  expectedCartTotal: 0.00
};
```

### 3. Miktar Güncelleme Testi
```javascript
// Test senaryosu: Ürün miktarını güncelleme
const testUpdateQuantity = {
  productId: "TEST-PRODUCT-001",
  newQuantity: 5,
  expectedQuantity: 5,
  expectedTotalPrice: 500.00
};
```

### 4. Sepet Temizleme Testi
```javascript
// Test senaryosu: Sepeti temizleme
const testClearCart = {
  expectedCartCount: 0,
  expectedCartTotal: 0.00
};
```

---

## 📊 Sepet Durumları

| Durum | Açıklama | Aksiyon |
|-------|----------|---------|
| `empty` | Sepet boş | "Sepetiniz boş" mesajı göster |
| `loading` | Yükleniyor | Loading spinner göster |
| `error` | Hata oluştu | Hata mesajı göster |
| `ready` | Hazır | Sepet içeriğini göster |

---

## 🔧 Sorun Giderme

### Yaygın Sorunlar

#### 1. LocalStorage Erişim Hatası
```javascript
// Çözüm: SSR kontrolü ekle
const isClient = typeof window !== 'undefined';
if (isClient) {
  // LocalStorage işlemleri
}
```

#### 2. State Senkronizasyon Hatası
```javascript
// Çözüm: useEffect ile localStorage kontrolü
useEffect(() => {
  const savedCart = loadCartFromStorage();
  if (savedCart.length > 0) {
    setCart(savedCart);
  }
}, []);
```

#### 3. Performans Sorunu
```javascript
// Çözüm: Debounce ile localStorage güncelleme
const debouncedSave = useCallback(
  debounce((cart) => saveCartToStorage(cart), 500),
  []
);
```

---

## 🚀 Gelecek Geliştirmeler

### Planlanan Özellikler
- [ ] **Backend API Entegrasyonu**: Kullanıcı login olduğunda sepetin backend ile senkronize edilmesi
- [ ] **Stok Kontrolü**: Sepete eklerken ve miktar güncellerken stok kontrolü
- [ ] **Kullanıcı Onayı**: Sepeti temizlerken veya ürün silerken kullanıcıdan onay alma
- [ ] **Hata ve Loading State**: Sepet işlemlerinde kullanıcıya feedback verme
- [ ] **Çoklu Cihaz Desteği**: Login kullanıcılar için sepet bulut tabanlı saklama
- [ ] **Sepet Kaydetme**: Kullanıcıların sepetlerini kaydetme özelliği
- [ ] **Sepet Paylaşma**: Sepet linkini paylaşma özelliği

### Teknik İyileştirmeler
- [ ] **TypeScript Strict Mode**: Daha sıkı tip kontrolü
- [ ] **Error Boundary**: Hata yakalama mekanizması
- [ ] **Unit Tests**: Kapsamlı test coverage
- [ ] **Performance Optimization**: React.memo ve useMemo kullanımı
- [ ] **Accessibility**: ARIA etiketleri ve klavye navigasyonu

---

## 📚 Ek Kaynaklar

- [Zustand Dokümantasyonu](https://github.com/pmndrs/zustand)
- [LocalStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [React Hooks](https://react.dev/reference/react/hooks)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## 🤝 Katkıda Bulunma

Bu dökümantasyonu güncellemek için:
1. Değişiklikleri `project_document/` klasörüne ekleyin
2. Test senaryolarını kontrol edin
3. TypeScript tip tanımlarını güncelleyin 