# Cart Management Modülü

## Genel Bakış

Cart Management modülü, kullanıcıların alışveriş sepeti işlemlerini yönetir. Ürün ekleme, çıkarma, miktar güncelleme, sepet hesaplama ve sepet yönetimi işlemlerini içerir.

## Dosya Yapısı

```
src/
├── controllers/
│   └── cart.js              # Sepet controller
├── routes/
│   └── cart.js             # Sepet routes
├── services/
│   └── cartService.js      # Sepet business logic
├── models/
│   └── Cart.js             # Sepet model
└── validation/
    └── cartValidation.js   # Sepet validation schemas
```

## Cart Model Schema

```javascript
// models/Cart.js
const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    variant: {
      id: String, // Variant ID (opsiyonel)
      name: String, // Renk, Beden vs.
      value: String,
      sku: String
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      max: 10 // Maximum sepet miktarı
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    discountPrice: {
      type: Number,
      min: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  totals: {
    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    shipping: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  appliedCoupons: [{
    code: String,
    discount: Number,
    type: { type: String, enum: ['percentage', 'fixed'] }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 gün
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Sepet toplamlarını otomatik hesapla
cartSchema.pre('save', function(next) {
  this.calculateTotals();
  this.updatedAt = new Date();
  next();
});

cartSchema.methods.calculateTotals = function() {
  // Alt toplam hesapla
  this.totals.subtotal = this.items.reduce((sum, item) => {
    const price = item.discountPrice || item.price;
    return sum + (price * item.quantity);
  }, 0);

  // Kupon indirimi hesapla
  this.totals.discount = this.appliedCoupons.reduce((sum, coupon) => {
    if (coupon.type === 'percentage') {
      return sum + (this.totals.subtotal * coupon.discount / 100);
    }
    return sum + coupon.discount;
  }, 0);

  // KDV hesapla (%18)
  this.totals.tax = (this.totals.subtotal - this.totals.discount) * 0.18;

  // Kargo ücreti hesapla
  this.totals.shipping = this.totals.subtotal > 500 ? 0 : 29.99;

  // Toplam hesapla
  this.totals.total = this.totals.subtotal - this.totals.discount + this.totals.tax + this.totals.shipping;
};

// Index
cartSchema.index({ user: 1 });
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
```

## API Endpoints

### GET `/api/cart`
Kullanıcının sepetini getirir.

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cart": {
      "id": "64f8a123456789abcdef",
      "user": "64f8a123456789abcdeg",
      "items": [
        {
          "id": "item1",
          "product": {
            "id": "64f8a123456789abcdeh",
            "name": "iPhone 15 Pro",
            "slug": "iphone-15-pro",
            "images": [
              {
                "url": "https://example.com/images/iphone15.jpg",
                "alt": "iPhone 15 Pro"
              }
            ],
            "stock": {
              "available": 15
            }
          },
          "variant": {
            "name": "Renk",
            "value": "Siyah",
            "sku": "IPHONE15PRO-BLACK"
          },
          "quantity": 2,
          "price": 54999,
          "discountPrice": 49999,
          "total": 99998,
          "addedAt": "2023-10-01T10:00:00.000Z"
        }
      ],
      "totals": {
        "subtotal": 99998,
        "discount": 5000,
        "tax": 17099.64,
        "shipping": 0,
        "total": 112097.64
      },
      "appliedCoupons": [
        {
          "code": "WELCOME10",
          "discount": 5000,
          "type": "fixed"
        }
      ],
      "itemCount": 2,
      "createdAt": "2023-10-01T10:00:00.000Z",
      "updatedAt": "2023-10-01T12:00:00.000Z"
    }
  }
}
```

### POST `/api/cart/items`
Sepete ürün ekler.

**Request Body:**
```json
{
  "productId": "64f8a123456789abcdeh",
  "quantity": 1,
  "variant": {
    "name": "Renk",
    "value": "Siyah",
    "sku": "IPHONE15PRO-BLACK"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Ürün sepete eklendi",
  "data": {
    "item": {
      "id": "item1",
      "product": {
        "id": "64f8a123456789abcdeh",
        "name": "iPhone 15 Pro",
        "price": 54999,
        "discountPrice": 49999
      },
      "quantity": 1,
      "total": 49999
    },
    "cart": {
      "itemCount": 1,
      "totals": {
        "total": 58998.82
      }
    }
  }
}
```

### PUT `/api/cart/items/:itemId`
Sepetteki ürün miktarını günceller.

**Request Body:**
```json
{
  "quantity": 3
}
```

### DELETE `/api/cart/items/:itemId`
Sepetten ürün çıkarır.

**Response:**
```json
{
  "success": true,
  "message": "Ürün sepetten çıkarıldı",
  "data": {
    "cart": {
      "itemCount": 0,
      "totals": {
        "total": 0
      }
    }
  }
}
```

### POST `/api/cart/coupon`
Sepete kupon kodu uygular.

**Request Body:**
```json
{
  "code": "WELCOME10"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Kupon başarıyla uygulandı",
  "data": {
    "coupon": {
      "code": "WELCOME10",
      "discount": 5000,
      "type": "fixed"
    },
    "cart": {
      "totals": {
        "subtotal": 99998,
        "discount": 5000,
        "total": 112097.64
      }
    }
  }
}
```

### DELETE `/api/cart/coupon/:code`
Sepetten kupon kaldırır.

### DELETE `/api/cart`
Sepeti tamamen temizler.

**Response:**
```json
{
  "success": true,
  "message": "Sepet temizlendi",
  "data": {
    "cart": {
      "itemCount": 0,
      "totals": {
        "total": 0
      }
    }
  }
}
```

### GET `/api/cart/summary`
Sepet özeti getirir (checkout öncesi).

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "itemCount": 2,
      "totals": {
        "subtotal": 99998,
        "discount": 5000,
        "tax": 17099.64,
        "shipping": 0,
        "total": 112097.64
      },
      "items": [
        {
          "name": "iPhone 15 Pro",
          "quantity": 2,
          "price": 49999,
          "total": 99998
        }
      ],
      "coupons": [
        {
          "code": "WELCOME10",
          "discount": 5000
        }
      ]
    }
  }
}
```

## Cart Service Fonksiyonları

### `getCart(userId)`
Kullanıcının sepetini getirir, yoksa oluşturur.

### `addToCart(userId, productId, quantity, variant)`
Sepete ürün ekler veya mevcut ürünün miktarını artırır.

### `updateCartItem(userId, itemId, quantity)`
Sepetteki ürün miktarını günceller.

### `removeFromCart(userId, itemId)`
Sepetten ürün çıkarır.

### `applyCoupon(userId, couponCode)`
Sepete kupon uygular.

### `removeCoupon(userId, couponCode)`
Sepetten kupon kaldırır.

### `clearCart(userId)`
Sepeti tamamen temizler.

### `validateCartItems(cart)`
Sepetteki ürünlerin stok durumunu kontrol eder.

### `mergeGuestCart(userId, guestCartItems)`
Misafir sepetini kullanıcı sepeti ile birleştirir.

## Validation Schemas

### Add to Cart Validation
```javascript
const addToCartSchema = Joi.object({
  productId: Joi.string().hex().length(24).required(),
  quantity: Joi.number().min(1).max(10).required(),
  variant: Joi.object({
    name: Joi.string().required(),
    value: Joi.string().required(),
    sku: Joi.string()
  })
});
```

### Update Cart Item Validation
```javascript
const updateCartItemSchema = Joi.object({
  quantity: Joi.number().min(1).max(10).required()
});
```

### Apply Coupon Validation
```javascript
const applyCouponSchema = Joi.object({
  code: Joi.string().min(3).max(20).required()
});
```

## Cart Middleware

### Cart Validation Middleware
```javascript
const validateCartAccess = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    
    if (!cart) {
      // Boş sepet oluştur
      const newCart = new Cart({ user: req.user.id });
      await newCart.save();
      req.cart = newCart;
    } else {
      req.cart = cart;
    }
    
    next();
  } catch (error) {
    next(error);
  }
};
```

### Stock Validation Middleware
```javascript
const validateStock = async (req, res, next) => {
  try {
    const { productId, quantity, variant } = req.body;
    
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: 'Ürün bulunamadı veya aktif değil'
        }
      });
    }

    // Stok kontrolü
    let availableStock = product.stock.available;
    
    if (variant && variant.sku) {
      const productVariant = product.variants.find(v => v.sku === variant.sku);
      if (productVariant) {
        availableStock = productVariant.stock;
      }
    }

    if (quantity > availableStock) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_STOCK',
          message: `Yetersiz stok. Mevcut: ${availableStock}`,
          data: { availableStock }
        }
      });
    }

    req.product = product;
    req.availableStock = availableStock;
    next();
  } catch (error) {
    next(error);
  }
};
```

## Frontend Entegrasyonu

### Cart Hook (React)
```javascript
import { useState, useEffect, useContext, createContext } from 'react';

const CartContext = createContext();

export const useCart = () => {
  return useContext(CartContext);
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user, token } = useAuth();

  const fetchCart = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await api.get('/cart', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCart(response.data.data.cart);
    } catch (error) {
      console.error('Cart fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, quantity = 1, variant = null) => {
    try {
      const response = await api.post('/cart/items', {
        productId,
        quantity,
        variant
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setCart(response.data.data.cart);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const updateCartItem = async (itemId, quantity) => {
    try {
      const response = await api.put(`/cart/items/${itemId}`, {
        quantity
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setCart(response.data.data.cart);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      const response = await api.delete(`/cart/items/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setCart(response.data.data.cart);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const applyCoupon = async (code) => {
    try {
      const response = await api.post('/cart/coupon', { code }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setCart(response.data.data.cart);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      await api.delete('/cart', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setCart(null);
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    if (user && token) {
      fetchCart();
    }
  }, [user, token]);

  const value = {
    cart,
    loading,
    addToCart,
    updateCartItem,
    removeFromCart,
    applyCoupon,
    clearCart,
    refetch: fetchCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
```

### Cart Component
```javascript
import React from 'react';
import { useCart } from '../hooks/useCart';

const CartPage = () => {
  const { cart, updateCartItem, removeFromCart, applyCoupon } = useCart();
  const [couponCode, setCouponCode] = useState('');

  const handleQuantityChange = async (itemId, newQuantity) => {
    try {
      await updateCartItem(itemId, newQuantity);
    } catch (error) {
      alert('Miktar güncellenirken hata oluştu');
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await removeFromCart(itemId);
    } catch (error) {
      alert('Ürün çıkarılırken hata oluştu');
    }
  };

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    try {
      await applyCoupon(couponCode);
      setCouponCode('');
      alert('Kupon başarıyla uygulandı');
    } catch (error) {
      alert('Kupon uygulanırken hata oluştu');
    }
  };

  if (!cart || cart.items.length === 0) {
    return <div className="empty-cart">Sepetiniz boş</div>;
  }

  return (
    <div className="cart-page">
      <h1>Alışveriş Sepeti</h1>
      
      <div className="cart-items">
        {cart.items.map(item => (
          <div key={item.id} className="cart-item">
            <img 
              src={item.product.images[0]?.url} 
              alt={item.product.name}
              className="item-image"
            />
            
            <div className="item-details">
              <h3>{item.product.name}</h3>
              {item.variant && (
                <p className="variant">{item.variant.name}: {item.variant.value}</p>
              )}
              
              <div className="quantity-controls">
                <button 
                  onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                >
                  -
                </button>
                <span>{item.quantity}</span>
                <button 
                  onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                  disabled={item.quantity >= 10}
                >
                  +
                </button>
              </div>
              
              <div className="item-price">
                ₺{item.total.toLocaleString('tr-TR')}
              </div>
              
              <button 
                onClick={() => handleRemoveItem(item.id)}
                className="remove-btn"
              >
                Çıkar
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="cart-summary">
        <div className="coupon-section">
          <form onSubmit={handleApplyCoupon}>
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="Kupon kodu"
            />
            <button type="submit">Uygula</button>
          </form>
        </div>
        
        <div className="totals">
          <div className="subtotal">
            Ara Toplam: ₺{cart.totals.subtotal.toLocaleString('tr-TR')}
          </div>
          {cart.totals.discount > 0 && (
            <div className="discount">
              İndirim: -₺{cart.totals.discount.toLocaleString('tr-TR')}
            </div>
          )}
          <div className="tax">
            KDV: ₺{cart.totals.tax.toLocaleString('tr-TR')}
          </div>
          <div className="shipping">
            Kargo: ₺{cart.totals.shipping.toLocaleString('tr-TR')}
          </div>
          <div className="total">
            Toplam: ₺{cart.totals.total.toLocaleString('tr-TR')}
          </div>
        </div>
        
        <button className="checkout-btn">
          Ödemeye Geç
        </button>
      </div>
    </div>
  );
};
```

## Caching Strategy

```javascript
// Sepet cache'leme
const cacheCart = async (cart) => {
  const key = `cart:${cart.user}`;
  await redis.setex(key, 1800, JSON.stringify(cart)); // 30 dakika
};

// Cache'den sepet getirme
const getCachedCart = async (userId) => {
  const key = `cart:${userId}`;
  const cached = await redis.get(key);
  return cached ? JSON.parse(cached) : null;
};
```

## Error Handling

### Cart Errors
```javascript
// Ürün stokta yok
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Yetersiz stok",
    "data": { "availableStock": 5 }
  }
}

// Geçersiz kupon
{
  "success": false,
  "error": {
    "code": "INVALID_COUPON",
    "message": "Kupon geçersiz veya süresi dolmuş"
  }
}

// Sepet boş
{
  "success": false,
  "error": {
    "code": "EMPTY_CART",
    "message": "Sepetiniz boş"
  }
}
```

## Test Örnekleri

```javascript
describe('Cart Management', () => {
  test('should add product to cart', async () => {
    const response = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        productId: productId,
        quantity: 2
      });
    
    expect(response.status).toBe(200);
    expect(response.body.data.item.quantity).toBe(2);
  });

  test('should apply coupon to cart', async () => {
    const response = await request(app)
      .post('/api/cart/coupon')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ code: 'TESTCOUPON' });
    
    expect(response.status).toBe(200);
    expect(response.body.data.cart.totals.discount).toBeGreaterThan(0);
  });
});
```

---

**Son Güncelleme**: `{new Date().toLocaleDateString('tr-TR')}` 