# Category Management Modülü

## Genel Bakış

Category Management modülü, ürün kategorilerinin hiyerarşik yapıda yönetilmesini sağlar. Ana kategoriler, alt kategoriler, kategori ağacı ve kategori filtreleme işlemlerini içerir.

## Dosya Yapısı

```
src/
├── controllers/
│   └── category.js           # Kategori controller
├── routes/
│   └── category.js          # Kategori routes
├── services/
│   └── categoryService.js   # Kategori business logic
├── models/
│   └── Category.js          # Kategori model
└── validation/
    └── categoryValidation.js # Kategori validation schemas
```

## Category Model Schema

```javascript
// models/Category.js
const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  slug: {
    type: String,
    unique: true,
    required: true,
    lowercase: true
  },
  description: {
    type: String,
    maxlength: 500
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  children: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  level: {
    type: Number,
    default: 0,
    min: 0,
    max: 3 // Maximum 3 seviye derinlik
  },
  path: {
    type: String, // "/electronics/smartphones/iphone"
    required: true
  },
  image: {
    url: String,
    alt: String
  },
  icon: {
    type: String, // CSS class veya icon name
    default: 'folder'
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  productCount: {
    type: Number,
    default: 0
  },
  seo: {
    title: String,
    description: String,
    keywords: [String]
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

// Slug otomatik oluştur
categorySchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  
  this.updatedAt = new Date();
  next();
});

// Path ve level otomatik hesapla
categorySchema.pre('save', async function(next) {
  if (this.isModified('parent')) {
    if (this.parent) {
      const parentCategory = await this.constructor.findById(this.parent);
      if (parentCategory) {
        this.level = parentCategory.level + 1;
        this.path = `${parentCategory.path}/${this.slug}`;
      }
    } else {
      this.level = 0;
      this.path = `/${this.slug}`;
    }
  }
  next();
});

// Indexes
categorySchema.index({ slug: 1 });
categorySchema.index({ parent: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ level: 1, order: 1 });
categorySchema.index({ path: 1 });
```

## API Endpoints

### GET `/api/categories`
Tüm kategorileri hiyerarşik yapıda getirir.

**Query Parameters:**
- `includeEmpty`: Boş kategorileri dahil et (default: false)
- `activeOnly`: Sadece aktif kategoriler (default: true)
- `level`: Belirli seviyedeki kategoriler
- `featured`: Öne çıkan kategoriler

**Response:**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "64f8a123456789abcdef",
        "name": "Elektronik",
        "slug": "elektronik",
        "description": "Elektronik ürünler ve aksesuarlar",
        "level": 0,
        "path": "/elektronik",
        "image": {
          "url": "https://example.com/images/electronics.jpg",
          "alt": "Elektronik Kategorisi"
        },
        "icon": "laptop",
        "productCount": 156,
        "isActive": true,
        "isFeatured": true,
        "children": [
          {
            "id": "64f8a123456789abcdeg",
            "name": "Akıllı Telefonlar",
            "slug": "akilli-telefonlar",
            "level": 1,
            "path": "/elektronik/akilli-telefonlar",
            "productCount": 45,
            "children": []
          }
        ]
      }
    ]
  }
}
```

### GET `/api/categories/tree`
Kategori ağacını tam hiyerarşik yapıda getirir.

**Response:**
```json
{
  "success": true,
  "data": {
    "tree": [
      {
        "id": "64f8a123456789abcdef",
        "name": "Elektronik",
        "slug": "elektronik",
        "level": 0,
        "children": [
          {
            "id": "64f8a123456789abcdeg",
            "name": "Akıllı Telefonlar",
            "slug": "akilli-telefonlar",
            "level": 1,
            "children": [
              {
                "id": "64f8a123456789abcdeh",
                "name": "iPhone",
                "slug": "iphone",
                "level": 2,
                "children": []
              }
            ]
          }
        ]
      }
    ]
  }
}
```

### GET `/api/categories/:slug`
Belirli kategorinin detaylarını getirir.

**Response:**
```json
{
  "success": true,
  "data": {
    "category": {
      "id": "64f8a123456789abcdef",
      "name": "Akıllı Telefonlar",
      "slug": "akilli-telefonlar",
      "description": "En yeni akıllı telefon modelleri",
      "parent": {
        "id": "64f8a123456789abcdeg",
        "name": "Elektronik",
        "slug": "elektronik"
      },
      "level": 1,
      "path": "/elektronik/akilli-telefonlar",
      "image": {
        "url": "https://example.com/images/smartphones.jpg",
        "alt": "Akıllı Telefonlar"
      },
      "productCount": 45,
      "children": [
        {
          "id": "64f8a123456789abcdeh",
          "name": "iPhone",
          "slug": "iphone",
          "productCount": 12
        }
      ],
      "breadcrumb": [
        {
          "name": "Ana Sayfa",
          "slug": "",
          "url": "/"
        },
        {
          "name": "Elektronik",
          "slug": "elektronik",
          "url": "/kategori/elektronik"
        },
        {
          "name": "Akıllı Telefonlar",
          "slug": "akilli-telefonlar",
          "url": "/kategori/akilli-telefonlar"
        }
      ]
    }
  }
}
```

### POST `/api/categories` (Admin)
Yeni kategori oluşturur.

**Request Body:**
```json
{
  "name": "Tablet",
  "description": "Tablet bilgisayarlar ve aksesuarları",
  "parent": "64f8a123456789abcdef",
  "image": {
    "url": "https://example.com/images/tablets.jpg",
    "alt": "Tablet Kategorisi"
  },
  "icon": "tablet",
  "order": 2,
  "seo": {
    "title": "Tablet Bilgisayarlar - En Uygun Fiyatlar",
    "description": "Tablet bilgisayar modelleri ve aksesuarları",
    "keywords": ["tablet", "ipad", "android tablet"]
  }
}
```

### PUT `/api/categories/:id` (Admin)
Kategori bilgilerini günceller.

### DELETE `/api/categories/:id` (Admin)
Kategoriyi siler (alt kategoriler varsa önce onları taşır veya siler).

### PUT `/api/categories/:id/move` (Admin)
Kategoriyi başka bir kategorinin altına taşır.

**Request Body:**
```json
{
  "newParent": "64f8a123456789abcdeg",
  "order": 1
}
```

### GET `/api/categories/:slug/products`
Kategoriye ait ürünleri getirir.

**Query Parameters:**
- `page`: Sayfa numarası
- `limit`: Sayfa başına ürün
- `sort`: Sıralama
- `includeSubcategories`: Alt kategorilerdeki ürünleri dahil et

## Category Service Fonksiyonları

### `getAllCategories(options)`
Tüm kategorileri hiyerarşik yapıda getirir.

### `getCategoryTree()`
Kategori ağacını oluşturur.

### `getCategoryBySlug(slug)`
Slug ile kategori detayını getirir.

### `createCategory(categoryData)`
Yeni kategori oluşturur.

### `updateCategory(categoryId, updateData)`
Kategori bilgilerini günceller.

### `deleteCategory(categoryId)`
Kategoriyi siler.

### `moveCategory(categoryId, newParentId, order)`
Kategoriyi taşır.

### `buildBreadcrumb(category)`
Kategori için breadcrumb oluşturur.

### `updateProductCounts()`
Tüm kategorilerin ürün sayısını günceller.

## Category Tree Builder

```javascript
// services/categoryService.js
class CategoryService {
  async buildCategoryTree(parentId = null, level = 0) {
    const categories = await Category.find({
      parent: parentId,
      isActive: true
    }).sort({ order: 1, name: 1 });

    const tree = [];

    for (const category of categories) {
      const categoryNode = {
        id: category._id,
        name: category.name,
        slug: category.slug,
        level: category.level,
        path: category.path,
        productCount: category.productCount,
        icon: category.icon,
        image: category.image,
        children: []
      };

      // Alt kategorileri recursive olarak ekle
      if (level < 3) { // Maximum 3 seviye
        categoryNode.children = await this.buildCategoryTree(category._id, level + 1);
      }

      tree.push(categoryNode);
    }

    return tree;
  }

  async buildBreadcrumb(category) {
    const breadcrumb = [
      { name: 'Ana Sayfa', slug: '', url: '/' }
    ];

    if (!category) return breadcrumb;

    const path = category.path.split('/').filter(Boolean);
    let currentPath = '';

    for (const slug of path) {
      currentPath += `/${slug}`;
      const cat = await Category.findOne({ path: currentPath });
      if (cat) {
        breadcrumb.push({
          name: cat.name,
          slug: cat.slug,
          url: `/kategori${currentPath}`
        });
      }
    }

    return breadcrumb;
  }

  async updateProductCounts() {
    const categories = await Category.find();
    
    for (const category of categories) {
      // Bu kategorideki ürün sayısı
      const directCount = await Product.countDocuments({
        category: category._id,
        isActive: true
      });

      // Alt kategorilerdeki ürün sayısı
      const childCategories = await Category.find({
        path: new RegExp(`^${category.path}/`)
      });

      const childCategoryIds = childCategories.map(cat => cat._id);
      const childCount = await Product.countDocuments({
        category: { $in: childCategoryIds },
        isActive: true
      });

      category.productCount = directCount + childCount;
      await category.save();
    }
  }
}
```

## Validation Schemas

### Category Creation Validation
```javascript
const createCategorySchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  description: Joi.string().max(500),
  parent: Joi.string().hex().length(24),
  image: Joi.object({
    url: Joi.string().uri().required(),
    alt: Joi.string().max(100)
  }),
  icon: Joi.string().max(50),
  order: Joi.number().min(0).max(999),
  seo: Joi.object({
    title: Joi.string().max(60),
    description: Joi.string().max(160),
    keywords: Joi.array().items(Joi.string().max(50))
  })
});
```

## Frontend Entegrasyonu

### Category Hook (React)
```javascript
import { useState, useEffect } from 'react';

export const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await api.get('/categories');
      setCategories(response.data.data.categories);
    } catch (error) {
      console.error('Categories fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryTree = async () => {
    try {
      const response = await api.get('/categories/tree');
      setTree(response.data.data.tree);
    } catch (error) {
      console.error('Category tree fetch error:', error);
    }
  };

  const getCategoryBySlug = async (slug) => {
    try {
      const response = await api.get(`/categories/${slug}`);
      return response.data.data.category;
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchCategoryTree();
  }, []);

  return {
    categories,
    tree,
    loading,
    getCategoryBySlug,
    refetch: fetchCategories
  };
};
```

### Category Navigation Component
```javascript
import React from 'react';
import { useCategories } from '../hooks/useCategories';

const CategoryNavigation = () => {
  const { tree, loading } = useCategories();

  const renderCategoryNode = (category, level = 0) => {
    return (
      <li key={category.id} className={`category-item level-${level}`}>
        <a 
          href={`/kategori${category.path}`}
          className="category-link"
        >
          <i className={`icon ${category.icon}`}></i>
          <span className="category-name">{category.name}</span>
          <span className="product-count">({category.productCount})</span>
        </a>
        
        {category.children && category.children.length > 0 && (
          <ul className="subcategories">
            {category.children.map(child => 
              renderCategoryNode(child, level + 1)
            )}
          </ul>
        )}
      </li>
    );
  };

  if (loading) return <div>Kategoriler yükleniyor...</div>;

  return (
    <nav className="category-navigation">
      <ul className="category-tree">
        {tree.map(category => renderCategoryNode(category))}
      </ul>
    </nav>
  );
};
```

### Category Breadcrumb Component
```javascript
import React from 'react';

const CategoryBreadcrumb = ({ breadcrumb }) => {
  if (!breadcrumb || breadcrumb.length <= 1) return null;

  return (
    <nav className="breadcrumb">
      <ol className="breadcrumb-list">
        {breadcrumb.map((item, index) => (
          <li key={index} className="breadcrumb-item">
            {index < breadcrumb.length - 1 ? (
              <a href={item.url} className="breadcrumb-link">
                {item.name}
              </a>
            ) : (
              <span className="breadcrumb-current">{item.name}</span>
            )}
            {index < breadcrumb.length - 1 && (
              <span className="breadcrumb-separator">›</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};
```

## Caching Strategy

```javascript
// Category cache management
const cacheCategoryTree = async () => {
  const tree = await categoryService.buildCategoryTree();
  await cacheService.set('category:tree', tree, 3600); // 1 saat
};

const getCachedCategoryTree = async () => {
  let tree = await cacheService.get('category:tree');
  if (!tree) {
    tree = await categoryService.buildCategoryTree();
    await cacheCategoryTree();
  }
  return tree;
};
```

## Test Örnekleri

```javascript
describe('Category Management', () => {
  test('should get category tree', async () => {
    const response = await request(app)
      .get('/api/categories/tree');
    
    expect(response.status).toBe(200);
    expect(response.body.data.tree).toBeInstanceOf(Array);
  });

  test('should create new category (admin)', async () => {
    const categoryData = {
      name: 'Test Kategori',
      description: 'Test açıklaması'
    };
    
    const response = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(categoryData);
    
    expect(response.status).toBe(201);
    expect(response.body.data.category.slug).toBe('test-kategori');
  });
});
```

---

**Son Güncelleme**: `{new Date().toLocaleDateString('tr-TR')}` 