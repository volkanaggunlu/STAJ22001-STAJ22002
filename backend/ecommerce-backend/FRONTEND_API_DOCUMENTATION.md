# 🚀 E-Ticaret Backend API - Frontend Geliştiriciler Dokümantasyonu

## 📖 Genel Bilgiler

**Base URL**: `http://localhost:8888/api`  
**Authentication**: JWT Bearer Token  
**Content-Type**: `application/json`

---

## 🏷️ 1. ÜRÜN YÖNETİMİ (PRODUCTS)

### 📋 Ürün Modeli Yapısı

```javascript
{
  "_id": "ObjectId",
  "name": "string (3-100 karakter)",
  "description": "string (10-2000 karakter)",
  "price": "string", // "299.90" formatında
  "discountedPrice": "string", // İndirimli fiyat (opsiyonel)
  "slug": "string", // URL dostu isim
  "categories": [
    {
      "category": "ObjectId", // Category referansı
      "rank": "number" // Kategori sırası
    }
  ],
  "images": [
    {
      "filename": "string",
      "url": "string",
      "alt": "string",
      "rank": "number",
      "isThumbnail": "boolean",
      "show": "boolean"
    }
  ],
  "stock": "number", // -1 = sınırsız
  "fakeStock": "number", // FOMO için gösterim stoku
  "enabled": "boolean",
  "type": "simple|variant|bundle",
  "variants": [], // Varyant ürünler için
  "bundle": {}, // Paket ürünler için
  "isSubVariant": "boolean",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

---

### 🔍 1.1 Ürün Listeme

#### **Tüm Ürünleri Getir**
```javascript
// GET /api/products
fetch('http://localhost:8888/api/products')
  .then(response => response.json())
  .then(data => {
    console.log('Ürünler:', data.products);
  });
```

#### **Ana Ürünleri Getir (Sub-varyant olmayanlar)**
```javascript
// GET /api/products/nonSubVariant
fetch('http://localhost:8888/api/products/nonSubVariant')
  .then(response => response.json())
  .then(data => {
    console.log('Ana ürünler:', data.products);
  });
```

#### **Kategoriye Göre Ürün Listele**
```javascript
// GET /api/products/category/:categorySlug
fetch('http://localhost:8888/api/products/category/elektronik')
  .then(response => response.json())
  .then(data => {
    console.log('Elektronik ürünler:', data.products);
  });
```

#### **Tekil Ürün Getir**
```javascript
// ID ile
// GET /api/products/id/:id
fetch('http://localhost:8888/api/products/id/6867f14992e3379770af645c')

// Slug ile (önerilen)
// GET /api/products/slug/:slug
fetch('http://localhost:8888/api/products/slug/arduino-uno-r3-gelistirme-karti')
  .then(response => response.json())
  .then(data => {
    console.log('Ürün detayı:', data.product);
  });
```

---

### ➕ 1.2 Ürün Ekleme

**⚠️ Admin Yetkisi Gerekli**

```javascript
// POST /api/products
const formData = new FormData();

// Temel bilgiler
formData.append('name', 'Yeni Arduino Sensör');
formData.append('description', 'Yüksek hassasiyet temperature sensörü');
formData.append('price', '89.90');
formData.append('discountedPrice', '79.90'); // Opsiyonel

// Kategoriler (JSON string)
const categories = [
  { category: "64f7a1b2c3d4e5f6789abcde", rank: 1 }, // Electronics category ObjectId
  { category: "64f7a1b2c3d4e5f6789abcdf", rank: 2 }  // Arduino category ObjectId
];
formData.append('categories', JSON.stringify(categories));

// Stok bilgileri
formData.append('stock', '25');
formData.append('fakeStock', '8');
formData.append('enabled', 'true');
formData.append('type', 'simple');

// Resim dosyaları
formData.append('images', file1);
formData.append('images', file2);

// API çağrısı
fetch('http://localhost:8888/api/products', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${jwtToken}`
    // Content-Type eklemeyin! FormData otomatik ekler
  },
  body: formData
})
.then(response => response.json())
.then(data => {
  console.log('Ürün oluşturuldu:', data.product);
});
```

---

### ✏️ 1.3 Ürün Güncelleme

```javascript
// POST /api/products/update
const updateData = {
  slug: 'arduino-uno-r3-gelistirme-karti',
  description: 'Güncellenmiş açıklama',
  price: '329.90',
  discountedPrice: '299.90'
};

fetch('http://localhost:8888/api/products/update', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${jwtToken}`
  },
  body: JSON.stringify(updateData)
})
.then(response => response.json())
.then(data => {
  console.log('Ürün güncellendi:', data.product);
});
```

---

### 🗑️ 1.4 Ürün Silme

```javascript
// ID ile silme
// DELETE /api/products/id/:id
fetch('http://localhost:8888/api/products/id/6867f14992e3379770af645c', {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${jwtToken}`
  }
});

// Slug ile silme (önerilen)
// DELETE /api/products/slug/:slug
fetch('http://localhost:8888/api/products/slug/arduino-uno-r3-gelistirme-karti', {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${jwtToken}`
  }
})
.then(response => response.json())
.then(data => {
  console.log('Ürün silindi:', data.product);
});
```

---

## 🏷️ 2. KATEGORİ YÖNETİMİ (CATEGORIES)

### 📋 Kategori Modeli Yapısı

```javascript
{
  "_id": "ObjectId",
  "name": "string (2-50 karakter)",
  "slug": "string",
  "description": "string (max 500 karakter)",
  "parent": "ObjectId", // Üst kategori (null = ana kategori)
  "level": "number", // Hiyerarşi seviyesi
  "enabled": "boolean",
  "sortOrder": "number",
  "seoTitle": "string",
  "seoDescription": "string",
  "image": {
    "filename": "string",
    "url": "string",
    "alt": "string"
  }
}
```

### 🔍 2.1 Kategori İşlemleri

```javascript
// Ana kategorileri getir
// GET /api/categories
fetch('http://localhost:8888/api/categories')

// Slug ile kategori getir  
// GET /api/categories/:slug
fetch('http://localhost:8888/api/categories/elektronik')

// Kategori oluştur (Admin)
// POST /api/categories
const categoryData = {
  name: 'Elektronik',
  description: 'Elektronik ürünler kategorisi',
  parent: null, // Ana kategori
  enabled: true,
  sortOrder: 1
};

fetch('http://localhost:8888/api/categories', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${jwtToken}`
  },
  body: JSON.stringify(categoryData)
});
```

---

## 👤 3. KULLANICI YÖNETİMİ (AUTH)

### 📝 3.1 Kullanıcı Kaydı

```javascript
// POST /api/auth/register
const registerData = {
  name: 'Ahmet',
  surname: 'Yılmaz',
  email: 'ahmet@example.com',
  password: 'password123',
  phone: '+905551234567'
};

fetch('http://localhost:8888/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(registerData)
})
.then(response => response.json())
.then(data => {
  console.log('Kayıt başarılı:', data.user);
  console.log('JWT Token:', data.token);
  // Token'ı localStorage'a kaydet
  localStorage.setItem('authToken', data.token);
});
```

### 🔐 3.2 Kullanıcı Girişi

```javascript
// POST /api/auth/login
const loginData = {
  email: 'ahmet@example.com',
  password: 'password123'
};

fetch('http://localhost:8888/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(loginData)
})
.then(response => response.json())
.then(data => {
  localStorage.setItem('authToken', data.token);
});
```

### 👤 3.3 Kullanıcı Bilgileri

```javascript
// GET /api/auth/user
fetch('http://localhost:8888/api/auth/user', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
  }
})
.then(response => response.json())
.then(data => {
  console.log('Kullanıcı bilgileri:', data.user);
});
```

---

## 🛒 4. SEPET YÖNETİMİ (CART)

### 🔍 4.1 Sepet İşlemleri

```javascript
// Sepet bilgileri
// GET /api/cart
fetch('http://localhost:8888/api/cart', {
  headers: {
    'Authorization': `Bearer ${authToken}`
  }
});

// Sepete ürün ekle
// POST /api/cart/add
const cartItem = {
  productId: '6867f14992e3379770af645c',
  quantity: 2
};

fetch('http://localhost:8888/api/cart/add', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`
  },
  body: JSON.stringify(cartItem)
});

// Sepet güncelle
// PUT /api/cart/update
const updateCart = {
  productId: '6867f14992e3379770af645c',
  quantity: 3
};

// Sepetten ürün çıkar
// DELETE /api/cart/remove
const removeItem = {
  productId: '6867f14992e3379770af645c'
};
```

---

## 📦 5. SİPARİŞ YÖNETİMİ (ORDERS)

### 📋 5.1 Sipariş İşlemleri

```javascript
// Siparişleri listele
// GET /api/order
fetch('http://localhost:8888/api/order', {
  headers: {
    'Authorization': `Bearer ${authToken}`
  }
});

// Sipariş oluştur
// POST /api/order
const orderData = {
  items: [
    {
      product: '6867f14992e3379770af645c',
      quantity: 2,
      price: '299.90'
    }
  ],
  shippingAddress: {
    address: 'Atatürk Cad. No:123',
    city: 'İstanbul',
    district: 'Kadıköy',
    postalCode: '34710'
  },
  paymentMethod: 'credit_card'
};

// Sipariş detayı
// GET /api/order/:id
fetch('http://localhost:8888/api/order/6867f14992e3379770af645c');
```

---

## ⭐ 6. ÜRÜN DEĞERLENDİRME (REVIEWS)

```javascript
// Ürün yorumları
// GET /api/review/:productId
fetch('http://localhost:8888/api/review/6867f14992e3379770af645c');

// Yorum ekle
// POST /api/review
const reviewData = {
  product: '6867f14992e3379770af645c',
  rating: 5,
  comment: 'Harika bir ürün!'
};

// Yorum güncelle
// PUT /api/review/:id

// Yorum sil  
// DELETE /api/review/:id
```

---

## 🖼️ 7. RESİM YÖNETİMİ

### 📤 7.1 Ürün Resmi Ekleme

```javascript
// POST /api/products/images/:slug
const formData = new FormData();
formData.append('image', imageFile);

fetch('http://localhost:8888/api/products/images/arduino-uno-r3', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${authToken}`
  },
  body: formData
});
```

---

## ⚠️ 8. HATA YÖNETİMİ

### 📋 HTTP Status Kodları

- **200**: Başarılı
- **201**: Oluşturuldu  
- **400**: Geçersiz istek
- **401**: Yetkisiz erişim
- **403**: Yasaklı
- **404**: Bulunamadı
- **500**: Sunucu hatası

### 🔍 Hata Response Formatı

```javascript
{
  "error": {
    "message": "Hata açıklaması",
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

---

## 🔧 9. KURULUM VE BAŞLANGIÇ

### 📥 Gerekli Kategorileri Oluşturma

**⚠️ Önemli**: Ürün eklemeden önce kategoriler oluşturulmalı!

```javascript
// Sample kategoriler oluştur
const categories = [
  { name: 'Elektronik', slug: 'elektronik' },
  { name: 'Arduino', slug: 'arduino', parent: 'elektronik_id' },
  { name: '3D Yazıcı', slug: '3d-yazici' },
  { name: 'Hobi Malzemeleri', slug: 'hobi-malzemeleri' }
];

// Her birini oluştur
categories.forEach(async (cat) => {
  await fetch('http://localhost:8888/api/categories', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify(cat)
  });
});
```

---

## 🎯 10. FRONTEND COMPONENT ÖRNEKLERİ

### 📦 React Ürün Listesi

```jsx
import React, { useState, useEffect } from 'react';

function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8888/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data.products);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Yükleniyor...</div>;

  return (
    <div className="product-grid">
      {products.map(product => (
        <div key={product._id} className="product-card">
          <img src={product.images[0]?.url} alt={product.name} />
          <h3>{product.name}</h3>
          <p>{product.price} ₺</p>
          <button>Sepete Ekle</button>
        </div>
      ))}
    </div>
  );
}
```

### 📝 Ürün Ekleme Formu

```jsx
function ProductForm() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: 0
  });
  const [images, setImages] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const data = new FormData();
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('price', formData.price);
    data.append('stock', formData.stock);
    
    images.forEach(image => {
      data.append('images', image);
    });

    const response = await fetch('http://localhost:8888/api/products', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: data
    });

    if (response.ok) {
      alert('Ürün başarıyla eklendi!');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="text" 
        placeholder="Ürün Adı"
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
      />
      <textarea 
        placeholder="Açıklama"
        value={formData.description}
        onChange={(e) => setFormData({...formData, description: e.target.value})}
      />
      <input 
        type="text" 
        placeholder="Fiyat"
        value={formData.price}
        onChange={(e) => setFormData({...formData, price: e.target.value})}
      />
      <input 
        type="file" 
        multiple 
        onChange={(e) => setImages([...e.target.files])}
      />
      <button type="submit">Ürün Ekle</button>
    </form>
  );
}
```

---

## 📞 11. DESTEK VE KAYNAKLAR

- **API Base URL**: `http://localhost:8888/api`
- **Database UI**: `http://localhost:34366` 
- **Log Dosyaları**: `src/logs/`
- **Test Dosyaları**: `tests/`

**🎉 Bu dokümantasyon ile frontend uygulamanızı kolayca geliştirebilirsiniz!** 