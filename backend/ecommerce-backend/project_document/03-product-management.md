# Product Management Modülü

## Genel Bakış

Product Management modülü, ürün CRUD işlemleri, ürün görüntüleme, filtreleme, arama, stok yönetimi ve ürün kategorilendirme işlemlerini yönetir.

## Dosya Yapısı

```
src/
├── controllers/
│   ├── product.js             # Ürün controller
│   └── adminProductController.js # Admin ürün yönetimi
├── routes/
│   └── product.js            # Ürün routes
├── services/
│   └── productService.js     # Ürün business logic
├── models/
│   └── Product.js            # Ürün model
└── validation/
    └── productValidation.js  # Ürün validation schemas
```

## Product Model Schema

```javascript
// models/Product.js
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  slug: {
    type: String,
    unique: true,
    required: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  shortDescription: {
    type: String,
    maxlength: 300
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  discountPrice: {
    type: Number,
    min: 0,
    validate: {
      validator: function(v) {
        return !v || v < this.price;
      },
      message: 'İndirimli fiyat normal fiyattan düşük olmalı'
    }
  },
  sku: {
    type: String,
    unique: true,
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  subcategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  brand: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  images: [{
    url: { type: String, required: true },
    alt: { type: String },
    isPrimary: { type: Boolean, default: false }
  }],
  variants: [{
    name: String, // Renk, Beden, vs.
    value: String,
    price: Number,
    stock: Number,
    sku: String
  }],
  specifications: [{
    name: String,
    value: String
  }],
  stock: {
    quantity: { type: Number, default: 0, min: 0 },
    reserved: { type: Number, default: 0, min: 0 },
    available: { type: Number, default: 0, min: 0 }
  },
  weight: {
    value: Number,
    unit: { type: String, enum: ['g', 'kg'], default: 'g' }
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    unit: { type: String, enum: ['cm', 'm'], default: 'cm' }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  ratings: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0, min: 0 }
  },
  seo: {
    title: String,
    description: String,
    keywords: [String]
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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

// Indexes
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ 'ratings.average': -1 });
productSchema.index({ createdAt: -1 });
```

## API Endpoints

### GET `/api/products`
Ürünleri listeler ve filtreler.

**Query Parameters:**
- `page`: Sayfa numarası (default: 1)
- `limit`: Sayfa başına ürün (default: 12)
- `category`: Kategori ID'si
- `minPrice`: Minimum fiyat
- `maxPrice`: Maximum fiyat
- `brand`: Marka filtresi
- `tags`: Tag filtresi (virgülle ayrılmış)
- `sort`: Sıralama (price_asc, price_desc, rating, newest)
- `search`: Arama terimi

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "64f8a123456789abcdef",
        "name": "iPhone 15 Pro",
        "slug": "iphone-15-pro",
        "price": 54999,
        "discountPrice": 49999,
        "images": [
          {
            "url": "https://example.com/images/iphone15-1.jpg",
            "alt": "iPhone 15 Pro",
            "isPrimary": true
          }
        ],
        "category": {
          "id": "64f8a123456789abcdeg",
          "name": "Smartphones"
        },
        "brand": "Apple",
        "ratings": {
          "average": 4.5,
          "count": 128
        },
        "stock": {
          "available": 15
        },
        "isActive": true,
        "isFeatured": true
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalProducts": 58,
      "hasNext": true,
      "hasPrev": false
    },
    "filters": {
      "categories": [
        { "id": "cat1", "name": "Smartphones", "count": 25 }
      ],
      "brands": [
        { "name": "Apple", "count": 12 }
      ],
      "priceRange": {
        "min": 99,
        "max": 99999
      }
    }
  }
}
```

### GET `/api/products/:slug`
Belirli bir ürünün detaylarını getirir.

**Response:**
```json
{
  "success": true,
  "data": {
    "product": {
      "id": "64f8a123456789abcdef",
      "name": "iPhone 15 Pro",
      "slug": "iphone-15-pro",
      "description": "En gelişmiş iPhone modeli...",
      "shortDescription": "A17 Pro çip ile güçlendirilmiş iPhone",
      "price": 54999,
      "discountPrice": 49999,
      "sku": "IPHONE15PRO-128-BLACK",
      "category": {
        "id": "64f8a123456789abcdeg",
        "name": "Smartphones",
        "slug": "smartphones"
      },
      "brand": "Apple",
      "tags": ["smartphone", "ios", "apple", "premium"],
      "images": [
        {
          "url": "https://example.com/images/iphone15-1.jpg",
          "alt": "iPhone 15 Pro Ön Görünüm",
          "isPrimary": true
        }
      ],
      "variants": [
        {
          "name": "Renk",
          "value": "Siyah",
          "price": 54999,
          "stock": 10,
          "sku": "IPHONE15PRO-128-BLACK"
        }
      ],
      "specifications": [
        {
          "name": "İşlemci",
          "value": "A17 Pro"
        },
        {
          "name": "Depolama",
          "value": "128GB"
        }
      ],
      "stock": {
        "quantity": 25,
        "reserved": 5,
        "available": 20
      },
      "ratings": {
        "average": 4.5,
        "count": 128
      },
      "seo": {
        "title": "iPhone 15 Pro - En İyi Fiyatla",
        "description": "iPhone 15 Pro modeli...",
        "keywords": ["iphone", "apple", "smartphone"]
      }
    },
    "relatedProducts": [
      {
        "id": "related1",
        "name": "iPhone 15",
        "price": 44999,
        "image": "https://example.com/images/iphone15.jpg"
      }
    ]
  }
}
```

### POST `/api/products` (Admin)
Yeni ürün oluşturur.

**Request Body:**
```json
{
  "name": "Samsung Galaxy S24",
  "description": "En yeni Samsung flagship telefon",
  "shortDescription": "Snapdragon 8 Gen 3 ile güçlendirilmiş",
  "price": 42999,
  "discountPrice": 39999,
  "sku": "GALAXY-S24-256-BLUE",
  "category": "64f8a123456789abcdeg",
  "brand": "Samsung",
  "tags": ["smartphone", "android", "samsung"],
  "specifications": [
    {
      "name": "İşlemci",
      "value": "Snapdragon 8 Gen 3"
    }
  ],
  "stock": {
    "quantity": 50
  },
  "weight": {
    "value": 167,
    "unit": "g"
  },
  "seo": {
    "title": "Samsung Galaxy S24 - Uygun Fiyat",
    "description": "Samsung Galaxy S24 modeli..."
  }
}
```

### PUT `/api/products/:id` (Admin)
Ürün bilgilerini günceller.

### DELETE `/api/products/:id` (Admin)
Ürünü siler (soft delete).

### PUT `/api/products/:id/stock` (Admin)
Ürün stokunu günceller.

**Request Body:**
```json
{
  "quantity": 100,
  "operation": "set" // "set", "add", "subtract"
}
```

### POST `/api/products/:id/images` (Admin)
Ürüne resim ekler.

**Request:**
- Content-Type: multipart/form-data
- Field: `images` (multiple files)

### PUT `/api/products/:id/featured` (Admin)
Ürünü öne çıkan olarak işaretler.

**Request Body:**
```json
{
  "isFeatured": true
}
```

## Product Service Fonksiyonları

### `getProducts(filters, pagination, sort)`
Filtrelenmiş ürün listesi getirir.

### `getProductBySlug(slug)`
Slug ile ürün detayını getirir.

### `createProduct(productData, userId)`
Yeni ürün oluşturur.

### `updateProduct(productId, updateData)`
Ürün bilgilerini günceller.

### `updateStock(productId, quantity, operation)`
Ürün stokunu günceller.

### `uploadProductImages(productId, files)`
Ürün resimlerini yükler.

### `getRelatedProducts(productId, categoryId)`
İlgili ürünleri getirir.

### `searchProducts(searchTerm, filters)`
Ürün arama yapar.

## Image Upload Middleware

```javascript
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5 // Maximum 5 dosya
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Sadece resim dosyaları kabul edilir'), false);
    }
  }
});

const processProductImages = async (req, res, next) => {
  if (!req.files || req.files.length === 0) return next();

  try {
    const processedImages = [];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const filename = `product-${Date.now()}-${i + 1}.jpeg`;
      
      // Ana resim (800x800)
      await sharp(file.buffer)
        .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 90 })
        .toFile(`public/images/products/${filename}`);

      // Thumbnail (200x200)
      await sharp(file.buffer)
        .resize(200, 200, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toFile(`public/images/products/thumbs/${filename}`);

      processedImages.push({
        url: `/images/products/${filename}`,
        thumb: `/images/products/thumbs/${filename}`,
        alt: req.body.name || 'Ürün resmi',
        isPrimary: i === 0 // İlk resim ana resim
      });
    }

    req.processedImages = processedImages;
    next();
  } catch (error) {
    next(error);
  }
};
```

## Validation Schemas

### Product Creation Validation
```javascript
const createProductSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  description: Joi.string().min(10).max(2000).required(),
  shortDescription: Joi.string().max(300),
  price: Joi.number().min(0).required(),
  discountPrice: Joi.number().min(0),
  sku: Joi.string().required(),
  category: Joi.string().hex().length(24).required(),
  subcategory: Joi.string().hex().length(24),
  brand: Joi.string().max(50),
  tags: Joi.array().items(Joi.string()),
  specifications: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      value: Joi.string().required()
    })
  ),
  stock: Joi.object({
    quantity: Joi.number().min(0).required()
  }),
  weight: Joi.object({
    value: Joi.number().positive(),
    unit: Joi.string().valid('g', 'kg')
  }),
  seo: Joi.object({
    title: Joi.string().max(60),
    description: Joi.string().max(160),
    keywords: Joi.array().items(Joi.string())
  })
});
```

### Product Filter Validation
```javascript
const filterSchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(50).default(12),
  category: Joi.string().hex().length(24),
  minPrice: Joi.number().min(0),
  maxPrice: Joi.number().min(0),
  brand: Joi.string(),
  tags: Joi.string(), // Comma separated
  sort: Joi.string().valid('price_asc', 'price_desc', 'rating', 'newest', 'oldest'),
  search: Joi.string().min(2).max(100)
});
```

## Caching Strategy

```javascript
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);

// Ürün detayını cache'le
const cacheProduct = async (product) => {
  const key = `product:${product.slug}`;
  await redis.setex(key, 3600, JSON.stringify(product)); // 1 saat
};

// Cache'den ürün getir
const getCachedProduct = async (slug) => {
  const key = `product:${slug}`;
  const cached = await redis.get(key);
  return cached ? JSON.parse(cached) : null;
};

// Ürün listesi cache'i
const cacheProductList = async (filters, products) => {
  const key = `products:${Buffer.from(JSON.stringify(filters)).toString('base64')}`;
  await redis.setex(key, 1800, JSON.stringify(products)); // 30 dakika
};
```

## Search & Filtering

### Text Search
```javascript
const searchProducts = async (searchTerm, filters = {}) => {
  const pipeline = [];

  // Text search
  if (searchTerm) {
    pipeline.push({
      $match: {
        $text: { $search: searchTerm },
        isActive: true
      }
    });
    
    // Relevance score ekleme
    pipeline.push({
      $addFields: {
        score: { $meta: 'textScore' }
      }
    });
  }

  // Category filter
  if (filters.category) {
    pipeline.push({
      $match: { category: new mongoose.Types.ObjectId(filters.category) }
    });
  }

  // Price range filter
  if (filters.minPrice || filters.maxPrice) {
    const priceMatch = {};
    if (filters.minPrice) priceMatch.$gte = filters.minPrice;
    if (filters.maxPrice) priceMatch.$lte = filters.maxPrice;
    
    pipeline.push({
      $match: {
        $expr: {
          $and: [
            { $gte: [{ $ifNull: ['$discountPrice', '$price'] }, priceMatch.$gte || 0] },
            { $lte: [{ $ifNull: ['$discountPrice', '$price'] }, priceMatch.$lte || Infinity] }
          ]
        }
      }
    });
  }

  // Sorting
  const sortStage = getSortStage(filters.sort);
  if (sortStage) pipeline.push(sortStage);

  return Product.aggregate(pipeline);
};

const getSortStage = (sortType) => {
  switch (sortType) {
    case 'price_asc':
      return { $sort: { price: 1 } };
    case 'price_desc':
      return { $sort: { price: -1 } };
    case 'rating':
      return { $sort: { 'ratings.average': -1, 'ratings.count': -1 } };
    case 'newest':
      return { $sort: { createdAt: -1 } };
    case 'oldest':
      return { $sort: { createdAt: 1 } };
    default:
      return { $sort: { createdAt: -1 } };
  }
};
```

## Frontend Entegrasyonu

### Product List Hook
```javascript
import { useState, useEffect } from 'react';

export const useProducts = (initialFilters = {}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState(initialFilters);

  const fetchProducts = async (newFilters = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ ...filters, ...newFilters });
      const response = await api.get(`/products?${params}`);
      
      setProducts(response.data.data.products);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Products fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  return {
    products,
    loading,
    pagination,
    filters,
    updateFilters,
    refetch: fetchProducts
  };
};
```

### Product Card Component
```javascript
import React from 'react';

const ProductCard = ({ product, onAddToCart }) => {
  const finalPrice = product.discountPrice || product.price;
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;

  return (
    <div className="product-card">
      <div className="product-image">
        <img 
          src={product.images[0]?.url} 
          alt={product.images[0]?.alt || product.name}
          loading="lazy"
        />
        {hasDiscount && (
          <div className="discount-badge">
            %{Math.round((1 - product.discountPrice / product.price) * 100)}
          </div>
        )}
      </div>
      
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <div className="product-rating">
          <span className="stars">⭐ {product.ratings.average}</span>
          <span className="count">({product.ratings.count})</span>
        </div>
        
        <div className="product-price">
          <span className="current-price">₺{finalPrice.toLocaleString('tr-TR')}</span>
          {hasDiscount && (
            <span className="original-price">₺{product.price.toLocaleString('tr-TR')}</span>
          )}
        </div>
        
        <button 
          className="add-to-cart-btn"
          onClick={() => onAddToCart(product)}
          disabled={product.stock.available === 0}
        >
          {product.stock.available > 0 ? 'Sepete Ekle' : 'Stokta Yok'}
        </button>
      </div>
    </div>
  );
};
```

## Performance Optimizations

1. **Database Indexing**: Text search, category, price indexleri
2. **Image Optimization**: Sharp ile otomatik resize ve format dönüşümü
3. **Caching**: Redis ile ürün detay ve liste cache'i
4. **Pagination**: Büyük ürün listelerinde sayfalama
5. **Lazy Loading**: Frontend'de lazy image loading
6. **CDN**: Statik dosyalar için CDN kullanımı

## Test Örnekleri

```javascript
describe('Product Management', () => {
  test('should get products with filters', async () => {
    const response = await request(app)
      .get('/api/products?category=smartphones&minPrice=1000&maxPrice=5000');
    
    expect(response.status).toBe(200);
    expect(response.body.data.products).toBeInstanceOf(Array);
    expect(response.body.data.pagination).toBeDefined();
  });

  test('should create new product (admin)', async () => {
    const productData = {
      name: 'Test Product',
      description: 'Test description',
      price: 999,
      sku: 'TEST-001',
      category: categoryId
    };
    
    const response = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(productData);
    
    expect(response.status).toBe(201);
    expect(response.body.data.product.slug).toBeDefined();
  });
});
```

---

**Son Güncelleme**: `{new Date().toLocaleDateString('tr-TR')}` 