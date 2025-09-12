# Admin Panel Modülü

## Genel Bakış

Admin Panel modülü, yöneticilerin e-ticaret platformunu yönetmek için kullandıkları tüm araçları sağlar. Ürün yönetimi, sipariş takibi, kullanıcı yönetimi, analitik raporlar ve sistem ayarlarını içerir.

## Dosya Yapısı

```
src/
├── controllers/
│   ├── adminController.js           # Genel admin controller
│   ├── adminProductController.js    # Admin ürün yönetimi
│   ├── adminUserController.js       # Admin kullanıcı yönetimi
│   ├── adminOrderController.js      # Admin sipariş yönetimi
│   ├── adminPaymentController.js    # Admin ödeme yönetimi
│   ├── adminReviewController.js     # Admin değerlendirme yönetimi
│   └── adminUploadController.js     # Admin dosya yükleme
├── routes/
│   └── adminRoutes.js              # Admin routes
├── services/
│   └── analyticsService.js         # Analitik servisleri
├── middleware/
│   └── adminAuth.js               # Admin yetkilendirme
└── validation/
    └── adminValidation.js         # Admin validation schemas
```

## Admin Authentication

### Admin Rolleri
```javascript
const ADMIN_ROLES = {
  SUPER_ADMIN: 'super_admin',    // Tam yetki
  ADMIN: 'admin',                // Genel yönetim yetkisi
  MODERATOR: 'moderator',        // Sınırlı yönetim yetkisi
  SUPPORT: 'support'             // Destek yetkisi
};

const PERMISSIONS = {
  // Ürün yönetimi
  PRODUCT_CREATE: 'product:create',
  PRODUCT_READ: 'product:read',
  PRODUCT_UPDATE: 'product:update',
  PRODUCT_DELETE: 'product:delete',
  
  // Kullanıcı yönetimi
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  
  // Sipariş yönetimi
  ORDER_READ: 'order:read',
  ORDER_UPDATE: 'order:update',
  ORDER_CANCEL: 'order:cancel',
  ORDER_REFUND: 'order:refund',
  
  // Analitik
  ANALYTICS_READ: 'analytics:read',
  
  // Sistem ayarları
  SETTINGS_READ: 'settings:read',
  SETTINGS_UPDATE: 'settings:update'
};
```

### Admin Authorization Middleware
```javascript
// middleware/adminAuth.js
const adminAuth = (requiredPermissions = []) => {
  return async (req, res, next) => {
    try {
      // Kullanıcı doğrulaması
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Giriş yapmanız gerekiyor'
          }
        });
      }

      // Admin rolü kontrolü
      const adminRoles = ['super_admin', 'admin', 'moderator', 'support'];
      if (!adminRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Bu işlem için admin yetkisi gerekiyor'
          }
        });
      }

      // İzin kontrolü
      if (requiredPermissions.length > 0) {
        const userPermissions = await getUserPermissions(req.user.role);
        const hasPermission = requiredPermissions.every(permission => 
          userPermissions.includes(permission)
        );

        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'INSUFFICIENT_PERMISSIONS',
              message: 'Bu işlem için yeterli izniniz yok'
            }
          });
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
```

## Dashboard API Endpoints

### GET `/api/admin/dashboard`
Admin dashboard verilerini getirir.

**Response:**
```json
{
  "success": true,
  "data": {
    "dashboard": {
      "stats": {
        "totalUsers": 1247,
        "totalOrders": 3421,
        "totalRevenue": 234567.89,
        "totalProducts": 156
      },
      "recentOrders": [
        {
          "id": "64f8a123456789abcdef",
          "orderNumber": "ORD-202310-000001",
          "customerName": "John Doe",
          "status": "processing",
          "total": 1299.99,
          "createdAt": "2023-10-01T10:00:00.000Z"
        }
      ],
      "topProducts": [
        {
          "id": "64f8a123456789abcdef",
          "name": "iPhone 15 Pro",
          "soldCount": 45,
          "revenue": 2249955
        }
      ],
      "salesChart": {
        "labels": ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs"],
        "data": [12000, 15000, 18000, 22000, 25000]
      },
      "lowStockProducts": [
        {
          "id": "64f8a123456789abcdef",
          "name": "iPhone 15 Pro",
          "stock": 3,
          "threshold": 10
        }
      ]
    }
  }
}
```

### GET `/api/admin/analytics`
Detaylı analitik verilerini getirir.

**Query Parameters:**
- `startDate`: Başlangıç tarihi
- `endDate`: Bitiş tarihi
- `type`: Analitik türü (sales, users, products)

**Response:**
```json
{
  "success": true,
  "data": {
    "analytics": {
      "sales": {
        "totalRevenue": 234567.89,
        "totalOrders": 3421,
        "averageOrderValue": 68.54,
        "conversionRate": 2.3,
        "chartData": {
          "daily": [
            {
              "date": "2023-10-01",
              "revenue": 5420.30,
              "orders": 23
            }
          ]
        }
      },
      "users": {
        "totalUsers": 1247,
        "newUsers": 45,
        "activeUsers": 234,
        "userGrowth": 12.5
      },
      "products": {
        "totalProducts": 156,
        "totalViews": 45232,
        "totalSales": 1234,
        "topCategories": [
          {
            "name": "Electronics",
            "count": 45,
            "revenue": 123456
          }
        ]
      }
    }
  }
}
```

## Product Management (Admin)

### GET `/api/admin/products`
Tüm ürünleri yönetim için listeler.

**Query Parameters:**
- `page`: Sayfa numarası
- `limit`: Sayfa başına ürün
- `search`: Arama terimi
- `category`: Kategori filtresi
- `status`: Durum filtresi (active, inactive, out_of_stock)
- `sort`: Sıralama

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "64f8a123456789abcdef",
        "name": "iPhone 15 Pro",
        "sku": "IPHONE15PRO-BLACK",
        "price": 54999,
        "discountPrice": 49999,
        "stock": {
          "quantity": 25,
          "available": 20,
          "reserved": 5
        },
        "category": {
          "name": "Smartphones"
        },
        "status": "active",
        "createdAt": "2023-10-01T10:00:00.000Z",
        "sales": {
          "totalSold": 45,
          "revenue": 2249955
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 12,
      "totalProducts": 156
    },
    "summary": {
      "totalProducts": 156,
      "activeProducts": 142,
      "inactiveProducts": 14,
      "outOfStockProducts": 8
    }
  }
}
```

### PUT `/api/admin/products/:id/status`
Ürün durumunu değiştirir.

**Request Body:**
```json
{
  "status": "inactive",
  "reason": "Stok tükendi"
}
```

### PUT `/api/admin/products/bulk-update`
Toplu ürün güncelleme yapar.

**Request Body:**
```json
{
  "productIds": ["64f8a123456789abcdef", "64f8a123456789abcdeg"],
  "updates": {
    "status": "active",
    "discountPercentage": 10
  }
}
```

## User Management (Admin)

### GET `/api/admin/users`
Tüm kullanıcıları listeler.

**Query Parameters:**
- `page`: Sayfa numarası
- `limit`: Sayfa başına kullanıcı
- `search`: Arama terimi
- `role`: Role filtresi
- `status`: Durum filtresi
- `registrationDate`: Kayıt tarihi filtresi

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "64f8a123456789abcdef",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "user",
        "status": "active",
        "phone": "+90 555 123 45 67",
        "registeredAt": "2023-10-01T10:00:00.000Z",
        "lastLogin": "2023-10-15T14:30:00.000Z",
        "orderCount": 12,
        "totalSpent": 15420.50,
        "emailVerified": true
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 25,
      "totalUsers": 1247
    },
    "summary": {
      "totalUsers": 1247,
      "activeUsers": 1189,
      "blockedUsers": 12,
      "unverifiedUsers": 46
    }
  }
}
```

### PUT `/api/admin/users/:id/status`
Kullanıcı durumunu değiştirir.

**Request Body:**
```json
{
  "status": "blocked",
  "reason": "Spam activity"
}
```

### GET `/api/admin/users/:id/orders`
Kullanıcının sipariş geçmişini getirir.

### GET `/api/admin/users/:id/activity`
Kullanıcı aktivite loglarını getirir.

## Order Management (Admin)

### GET `/api/admin/orders`
Tüm siparişleri listeler.

**Query Parameters:**
- `page`: Sayfa numarası
- `limit`: Sayfa başına sipariş
- `status`: Durum filtresi
- `paymentStatus`: Ödeme durumu filtresi
- `dateRange`: Tarih aralığı
- `search`: Sipariş numarası/müşteri arama

**Response:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "64f8a123456789abcdef",
        "orderNumber": "ORD-202310-000001",
        "customer": {
          "id": "64f8a123456789abcdeg",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "status": "processing",
        "payment": {
          "status": "paid",
          "method": "credit_card"
        },
        "pricing": {
          "total": 1299.99
        },
        "itemCount": 3,
        "createdAt": "2023-10-01T10:00:00.000Z",
        "shippingAddress": {
          "city": "İstanbul",
          "country": "Turkey"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 34,
      "totalOrders": 3421
    },
    "summary": {
      "totalOrders": 3421,
      "pendingOrders": 45,
      "processingOrders": 123,
      "shippedOrders": 234,
      "deliveredOrders": 2987,
      "cancelledOrders": 32
    }
  }
}
```

### PUT `/api/admin/orders/:id/status`
Sipariş durumunu günceller.

**Request Body:**
```json
{
  "status": "shipped",
  "note": "Kargoya verildi",
  "trackingNumber": "TRK123456789",
  "carrier": "Basit Kargo"
}
```

### POST `/api/admin/orders/:id/refund`
Sipariş iadesi işlemi yapar.

**Request Body:**
```json
{
  "amount": 1299.99,
  "reason": "Müşteri talebi",
  "refundType": "full"
}
```

## Analytics Service

### Sales Analytics
```javascript
// services/analyticsService.js
class AnalyticsService {
  async getSalesAnalytics(startDate, endDate) {
    const pipeline = [
      {
        $match: {
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          },
          status: { $nin: ['cancelled', 'refunded'] }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          totalRevenue: { $sum: '$pricing.total' },
          orderCount: { $sum: 1 },
          avgOrderValue: { $avg: '$pricing.total' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ];

    const results = await Order.aggregate(pipeline);
    
    return {
      chartData: results.map(item => ({
        date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
        revenue: item.totalRevenue,
        orders: item.orderCount,
        avgOrderValue: item.avgOrderValue
      })),
      totals: {
        revenue: results.reduce((sum, item) => sum + item.totalRevenue, 0),
        orders: results.reduce((sum, item) => sum + item.orderCount, 0)
      }
    };
  }

  async getTopProducts(limit = 10) {
    const pipeline = [
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.total' }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: limit }
    ];

    return await Order.aggregate(pipeline);
  }

  async getUserGrowth(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const pipeline = [
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          newUsers: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ];

    return await User.aggregate(pipeline);
  }
}
```

## Frontend Admin Panel (React)

### Admin Dashboard Hook
```javascript
import { useState, useEffect } from 'react';

export const useAdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboardData(response.data.data.dashboard);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters);
      const response = await api.get(`/admin/analytics?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data.analytics;
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return {
    dashboardData,
    loading,
    fetchAnalytics,
    refetch: fetchDashboard
  };
};
```

### Admin Product Management Component
```javascript
import React, { useState, useEffect } from 'react';

const AdminProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: '',
    category: '',
    status: 'all'
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(filters);
      const response = await api.get(`/admin/products?${params}`);
      setProducts(response.data.data.products);
    } catch (error) {
      console.error('Products fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProductStatus = async (productId, status) => {
    try {
      await api.put(`/admin/products/${productId}/status`, { status });
      fetchProducts(); // Refresh list
    } catch (error) {
      alert('Durum güncellenirken hata oluştu');
    }
  };

  const bulkUpdateProducts = async (productIds, updates) => {
    try {
      await api.put('/admin/products/bulk-update', {
        productIds,
        updates
      });
      fetchProducts(); // Refresh list
    } catch (error) {
      alert('Toplu güncelleme başarısız');
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const StatusBadge = ({ status }) => {
    const statusColors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800',
      out_of_stock: 'bg-yellow-100 text-yellow-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs ${statusColors[status]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="admin-products">
      <div className="page-header">
        <h1>Ürün Yönetimi</h1>
        <button className="btn btn-primary">Yeni Ürün Ekle</button>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Ürün ara..."
          value={filters.search}
          onChange={(e) => setFilters({...filters, search: e.target.value})}
        />
        
        <select
          value={filters.status}
          onChange={(e) => setFilters({...filters, status: e.target.value})}
        >
          <option value="all">Tüm Durumlar</option>
          <option value="active">Aktif</option>
          <option value="inactive">Pasif</option>
          <option value="out_of_stock">Stokta Yok</option>
        </select>
      </div>

      <div className="products-table">
        <table>
          <thead>
            <tr>
              <th>Ürün</th>
              <th>SKU</th>
              <th>Fiyat</th>
              <th>Stok</th>
              <th>Durum</th>
              <th>Satış</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id}>
                <td>
                  <div className="product-info">
                    <img src={product.images?.[0]?.url} alt={product.name} />
                    <div>
                      <div className="product-name">{product.name}</div>
                      <div className="product-category">{product.category.name}</div>
                    </div>
                  </div>
                </td>
                <td>{product.sku}</td>
                <td>
                  <div className="price">
                    {product.discountPrice && (
                      <span className="discount-price">
                        ₺{product.discountPrice.toLocaleString('tr-TR')}
                      </span>
                    )}
                    <span className={product.discountPrice ? 'original-price' : 'current-price'}>
                      ₺{product.price.toLocaleString('tr-TR')}
                    </span>
                  </div>
                </td>
                <td>
                  <div className="stock-info">
                    <div>Toplam: {product.stock.quantity}</div>
                    <div>Mevcut: {product.stock.available}</div>
                    <div>Rezerve: {product.stock.reserved}</div>
                  </div>
                </td>
                <td>
                  <StatusBadge status={product.status} />
                </td>
                <td>
                  <div className="sales-info">
                    <div>Satılan: {product.sales.totalSold}</div>
                    <div>Gelir: ₺{product.sales.revenue.toLocaleString('tr-TR')}</div>
                  </div>
                </td>
                <td>
                  <div className="actions">
                    <button className="btn btn-sm">Düzenle</button>
                    <button 
                      className="btn btn-sm"
                      onClick={() => updateProductStatus(
                        product.id, 
                        product.status === 'active' ? 'inactive' : 'active'
                      )}
                    >
                      {product.status === 'active' ? 'Pasifleştir' : 'Aktifleştir'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
```

## System Settings

### GET `/api/admin/settings`
Sistem ayarlarını getirir.

### PUT `/api/admin/settings`
Sistem ayarlarını günceller.

**Request Body:**
```json
{
  "general": {
    "siteName": "E-Commerce Store",
    "siteDescription": "Modern e-ticaret platformu",
    "currency": "TRY",
    "timezone": "Europe/Istanbul"
  },
  "payments": {
    "paytr": {
      "enabled": true,
      "merchantId": "xxxxx"
    },
    "bankTransfer": {
      "enabled": true,
      "accountInfo": "TR00 0000 0000 0000 0000 000000"
    }
  },
  "shipping": {
    "freeShippingThreshold": 500,
    "standardShippingCost": 29.99,
    "expressShippingCost": 59.99
  },
  "email": {
    "smtpHost": "smtp.gmail.com",
    "smtpPort": 587,
    "fromEmail": "noreply@example.com"
  }
}
```

## Validation Schemas

### Admin Product Update
```javascript
const adminProductUpdateSchema = Joi.object({
  name: Joi.string().min(3).max(100),
  description: Joi.string().min(10).max(2000),
  price: Joi.number().min(0),
  discountPrice: Joi.number().min(0),
  stock: Joi.object({
    quantity: Joi.number().min(0)
  }),
  status: Joi.string().valid('active', 'inactive'),
  isFeatured: Joi.boolean()
});
```

### User Status Update
```javascript
const userStatusUpdateSchema = Joi.object({
  status: Joi.string().valid('active', 'blocked', 'suspended').required(),
  reason: Joi.string().max(200)
});
```

## Error Handling

### Admin Errors
```javascript
// Yetkisiz erişim
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Bu işlem için admin yetkisi gerekiyor"
  }
}

// Yetersiz izin
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "Bu işlem için yeterli izniniz yok"
  }
}
```

## Test Örnekleri

```javascript
describe('Admin Panel', () => {
  test('should get dashboard data (admin)', async () => {
    const response = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.dashboard.stats).toBeDefined();
  });

  test('should update product status (admin)', async () => {
    const response = await request(app)
      .put(`/api/admin/products/${productId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'inactive' });

    expect(response.status).toBe(200);
  });
});
```

---

**Son Güncelleme**: `{new Date().toLocaleDateString('tr-TR')}` 