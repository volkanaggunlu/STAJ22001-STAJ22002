# Kategori ve Ürün Veri Ekleme Kılavuzu

Bu döküman, e-ticaret sistemine örnek kategori ve ürün verilerinin nasıl ekleneceğini açıklar.

## API Endpoint'leri

### Kategori İşlemleri

#### 1. Kategori Oluşturma
```http
POST http://localhost:3000/api/categories
Content-Type: multipart/form-data
Authorization: Bearer {token}

Form Data:
- name: string (required)
- description: string
- parent: ObjectId
- level: number
- isActive: boolean
- isVisible: boolean
- isFeatured: boolean
- showInMenu: boolean
- showInFooter: boolean
- sortOrder: number
- image: file
- seo[title]: string
- seo[description]: string
- seo[keywords]: array
```

#### 2. Tüm Kategorileri Listeleme
```http
GET http://localhost:3000/api/categories
```

#### 3. Kategori Detayı
```http
GET http://localhost:3000/api/categories/{id}
```

### Ürün İşlemleri

#### 1. Ürün Oluşturma
```http
POST http://localhost:3000/api/products
Content-Type: multipart/form-data
Authorization: Bearer {token}

Form Data:
- name: string (required)
- description: string (required)
- shortDescription: string
- price: number (required)
- originalPrice: number
- category: ObjectId (required)
- subCategories: ObjectId[]
- brand: string (required)
- sku: string (required)
- images: file[]
- stock[quantity]: number
- stock[lowStockThreshold]: number
- stock[trackStock]: boolean
- specifications: array
- features: array
- type: enum['product', 'bundle']
- bundleItems: array (required if type is bundle)
- bundleType: enum['kit', 'set', 'package', 'bundle']
- itemCount: number
- seo[title]: string
- seo[description]: string
- seo[keywords]: array
```

#### 2. Tüm Ürünleri Listeleme
```http
GET http://localhost:3000/api/products
```

#### 3. Kategoriye Göre Ürünleri Listeleme
```http
GET http://localhost:3000/api/products/category/{categoryId}
```

## Örnek Veriler

### 1. Ana Kategoriler

```json
{
  "name": "Elektronik",
  "description": "Elektronik ürünler ve komponentler",
  "isActive": true,
  "isVisible": true,
  "showInMenu": true,
  "sortOrder": 1,
  "seo": {
    "title": "Elektronik Ürünler",
    "description": "Arduino, Raspberry Pi ve elektronik komponentler",
    "keywords": ["elektronik", "arduino", "raspberry pi"]
  }
}

{
  "name": "Kitler",
  "description": "Eğitim ve hobi kitleri",
  "isActive": true,
  "isVisible": true,
  "showInMenu": true,
  "sortOrder": 2,
  "seo": {
    "title": "Eğitim ve Hobi Kitleri",
    "description": "STEM eğitim kitleri ve hobi setleri",
    "keywords": ["kit", "eğitim", "hobi", "stem"]
  }
}
```

### 2. Alt Kategoriler

```json
{
  "name": "Arduino",
  "description": "Arduino geliştirme kartları ve modülleri",
  "parent": "{Elektronik_ID}",
  "isActive": true,
  "isVisible": true,
  "showInMenu": true,
  "sortOrder": 1,
  "seo": {
    "title": "Arduino Ürünleri",
    "description": "Arduino kartları ve shield'ler",
    "keywords": ["arduino", "geliştirme kartı", "shield"]
  }
}

{
  "name": "Robotik",
  "description": "Robotik eğitim kitleri",
  "parent": "{Kitler_ID}",
  "isActive": true,
  "isVisible": true,
  "showInMenu": true,
  "sortOrder": 1,
  "seo": {
    "title": "Robotik Eğitim Kitleri",
    "description": "Robotik kodlama ve STEM eğitim setleri",
    "keywords": ["robotik", "eğitim", "stem"]
  }
}
```

### 3. Örnek Ürünler

```json
{
  "name": "Arduino Uno R3",
  "description": "Arduino Uno R3 geliştirme kartı, ATmega328P mikrodenetleyici tabanlı",
  "shortDescription": "Arduino'nun en popüler geliştirme kartı",
  "price": 249.90,
  "originalPrice": 299.90,
  "category": "{Arduino_ID}",
  "brand": "Arduino",
  "sku": "ARD-UNO-R3",
  "stock": {
    "quantity": 100,
    "lowStockThreshold": 10,
    "trackStock": true
  },
  "specifications": [
    {
      "key": "Mikrodenetleyici",
      "value": "ATmega328P"
    },
    {
      "key": "Çalışma Voltajı",
      "value": "5V"
    }
  ],
  "features": [
    "14 dijital I/O pini",
    "6 analog giriş",
    "16MHz kristal osilatör"
  ],
  "type": "product",
  "seo": {
    "title": "Arduino Uno R3 Geliştirme Kartı",
    "description": "Orijinal Arduino Uno R3, ATmega328P mikrodenetleyici",
    "keywords": ["arduino", "uno", "geliştirme kartı"]
  }
}

{
  "name": "Başlangıç Robotik Seti",
  "description": "Robotik kodlamaya başlamak için temel elektronik komponentler ve Arduino içeren set",
  "shortDescription": "Robotik kodlamaya başlangıç seti",
  "price": 999.90,
  "originalPrice": 1299.90,
  "category": "{Robotik_ID}",
  "brand": "RoboKid",
  "sku": "ROB-START-KIT",
  "stock": {
    "quantity": 50,
    "lowStockThreshold": 5,
    "trackStock": true
  },
  "type": "bundle",
  "bundleType": "kit",
  "itemCount": 15,
  "bundleItems": [
    {
      "productId": "{Arduino_Uno_ID}",
      "name": "Arduino Uno R3",
      "quantity": 1,
      "price": 249.90
    },
    {
      "productId": "{Breadboard_ID}",
      "name": "Breadboard",
      "quantity": 1,
      "price": 49.90
    }
  ],
  "seo": {
    "title": "Robotik Kodlama Başlangıç Seti",
    "description": "Arduino ve temel elektronik komponentler içeren robotik eğitim seti",
    "keywords": ["robotik", "kodlama", "eğitim", "arduino"]
  }
}
```

## Veri Ekleme Sırası

1. Önce ana kategorileri ekleyin
2. Ana kategorilerin ID'lerini kullanarak alt kategorileri ekleyin
3. Alt kategorilerin ID'lerini kullanarak normal ürünleri ekleyin
4. Normal ürünlerin ID'lerini kullanarak bundle ürünleri ekleyin

## Notlar

- Tüm ID'ler MongoDB ObjectId formatındadır
- Resim yüklemelerinde multipart/form-data kullanılmalıdır
- Bundle ürünler için önce bundle'da kullanılacak ürünlerin eklenmiş olması gerekir
- SEO alanları opsiyoneldir ama önerilir
- Fiyatlar TL cinsindendir ve kuruş hassasiyeti vardır 