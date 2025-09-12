# Sepet (Cart) İşlemleri Dökümantasyonu

## 📦 Genel Bakış

Sepet yönetimi, e-ticaret uygulamasında kullanıcıların ürünleri satın almadan önce geçici olarak biriktirdiği alandır. Sepet işlemleri hem frontend (Zustand ile local state) hem de backend (isteğe bağlı API ile) üzerinden yönetilebilir.

Bu projede sepet işlemleri şu an sadece frontend’de Zustand ile yönetilmektedir. Backend ile senkronizasyon ve sepet API’si henüz entegre edilmemiştir.

---

## 🏗️ Sepet State Yapısı

```typescript
interface CartItem {
  id: string;           // Ürün ID
  product: Product;     // Ürün objesi
  quantity: number;     // Sepetteki miktar
}
```

```typescript
interface StoreState {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  // ... diğer state'ler
}
```

- Sepet state’i localStorage’da `ecommerce-store` anahtarı ile saklanır.
- Sepet işlemleri login olup olmamaya bakılmaksızın çalışır.

---

## ⚙️ Sepet Fonksiyonları

### 1. **Ürün Ekle**
```typescript
addToCart(product: Product, quantity = 1)
```
- Sepette ürün yoksa ekler, varsa miktarını artırır.

### 2. **Ürün Çıkar**
```typescript
removeFromCart(productId: string)
```
- Belirtilen ürünü sepetten tamamen çıkarır.

### 3. **Miktar Güncelle**
```typescript
updateQuantity(productId: string, quantity: number)
```
- Miktar sıfır veya altına inerse ürünü sepetten siler.

### 4. **Sepeti Temizle**
```typescript
clearCart()
```
- Sepetteki tüm ürünleri siler.

---

## 🖥️ Kullanım Örneği

```typescript
import { useStore } from '@/lib/store';

const { cart, addToCart, removeFromCart, updateQuantity, clearCart } = useStore();

// Ürün ekleme
addToCart(product, 2);

// Ürün çıkarma
removeFromCart(product.id);

// Miktar güncelleme
updateQuantity(product.id, 5);

// Sepeti temizleme
clearCart();
```

---

## 🚩 Eksikler & İyileştirme Önerileri

- **Backend Sepet API’si**: Kullanıcı login olduğunda sepetin backend ile senkronize edilmesi önerilir.
- **Stok Kontrolü**: Sepete eklerken ve miktar güncellerken stok kontrolü yapılmalı.
- **Kullanıcıya Onay**: Sepeti temizlerken veya ürün silerken kullanıcıdan onay alınmalı.
- **Hata ve Loading State**: Sepet işlemlerinde kullanıcıya feedback verilmeli.
- **Çoklu Cihaz Desteği**: Login kullanıcılar için sepet bulut tabanlı saklanmalı.

---

## 🛠️ Backend Sepet API’si (Öneri)

> Henüz mevcut değil, ileride eklenebilir.

- `GET /cart` – Kullanıcının sepetini getirir
- `POST /cart/add` – Sepete ürün ekler
- `POST /cart/update` – Sepetteki ürün miktarını günceller
- `DELETE /cart/remove/:productId` – Sepetten ürün çıkarır
- `DELETE /cart/clear` – Sepeti temizler

---

## 📚 Kaynaklar

- [Zustand Dokümantasyonu](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [React Query ile Sepet Senkronizasyonu](https://tanstack.com/query/latest/docs/framework/react/overview)
- [E-ticaret Sepet Best Practices](https://www.smashingmagazine.com/2017/06/ecommerce-shopping-cart-ux/)

---

**Not:** Sepet işlemleriyle ilgili geliştirme yaparken, kullanıcı deneyimi ve veri tutarlılığına özellikle dikkat edilmelidir. 