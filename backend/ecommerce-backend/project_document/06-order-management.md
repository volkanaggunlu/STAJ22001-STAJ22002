# Order Management Modülü

## Genel Bakış

Order Management modülü, sipariş yaşam döngüsünü yönetir. Sipariş oluşturma, durum takibi, sipariş geçmişi, iptal ve iade işlemlerini kapsar.

## Dosya Yapısı

```
src/
├── controllers/
│   └── order.js              # Sipariş controller
├── routes/
│   └── order.js             # Sipariş routes
├── services/
│   └── orderService.js      # Sipariş business logic
├── models/
│   └── Order.js             # Sipariş model
└── validation/
    └── orderValidation.js   # Sipariş validation schemas
```

## Order Model Schema

```javascript
// models/Order.js
const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    image: { type: String },
    variant: {
      name: String,
      value: String,
      sku: String
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
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
    }
  }],
  pricing: {
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    tax: { type: Number, required: true },
    shipping: { type: Number, required: true },
    total: { type: Number, required: true }
  },
  appliedCoupons: [{
    code: String,
    discount: Number,
    type: { type: String, enum: ['percentage', 'fixed'] }
  }],
  shippingAddress: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true }
  },
  billingAddress: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true }
  },
  payment: {
    method: {
      type: String,
      enum: ['credit_card', 'bank_transfer', 'cash_on_delivery'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
      default: 'pending'
    },
    transactionId: String,
    paidAt: Date,
    amount: { type: Number, required: true }
  },
  shipping: {
    method: {
      type: String,
      enum: ['standard', 'express', 'overnight'],
      default: 'standard'
    },
    cost: { type: Number, required: true },
    trackingNumber: String,
    estimatedDelivery: Date,
    shippedAt: Date,
    deliveredAt: Date,
    carrier: String
  },
  status: {
    type: String,
    enum: [
      'pending',           // Beklemede
      'confirmed',         // Onaylandı
      'processing',        // Hazırlanıyor
      'shipped',          // Kargoya verildi
      'delivered',        // Teslim edildi
      'cancelled',        // İptal edildi
      'returned',         // İade edildi
      'refunded'          // Para iadesi
    ],
    default: 'pending'
  },
  statusHistory: [{
    status: {
      type: String,
      enum: [
        'pending', 'confirmed', 'processing', 'shipped', 
        'delivered', 'cancelled', 'returned', 'refunded'
      ]
    },
    note: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  notes: {
    customer: String,
    admin: String
  },
  cancellation: {
    reason: String,
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    cancelledAt: Date,
    refundAmount: Number
  },
  return: {
    reason: String,
    requestedAt: Date,
    approvedAt: Date,
    items: [{
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantity: Number,
      reason: String
    }]
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

// Sipariş numarası otomatik oluştur
orderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    // Son sipariş numarasını bul
    const lastOrder = await this.constructor
      .findOne({ orderNumber: new RegExp(`^ORD-${year}${month}-`) })
      .sort({ orderNumber: -1 });
    
    let sequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.orderNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }
    
    this.orderNumber = `ORD-${year}${month}-${String(sequence).padStart(6, '0')}`;
  }
  
  this.updatedAt = new Date();
  next();
});

// Status değişikliğinde history güncelle
orderSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      updatedAt: new Date()
    });
  }
  next();
});

// Indexes
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ createdAt: -1 });
```

## API Endpoints

### POST `/api/orders`
Yeni sipariş oluşturur.

**Request Body:**
```json
{
  "items": [
    {
      "productId": "64f8a123456789abcdef",
      "quantity": 2,
      "variant": {
        "name": "Renk",
        "value": "Siyah",
        "sku": "IPHONE15PRO-BLACK"
      }
    }
  ],
  "shippingAddress": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+90 555 123 45 67",
    "address": "Atatürk Caddesi No:123",
    "city": "İstanbul",
    "state": "İstanbul",
    "zipCode": "34000",
    "country": "Turkey"
  },
  "billingAddress": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+90 555 123 45 67",
    "address": "Atatürk Caddesi No:123",
    "city": "İstanbul",
    "state": "İstanbul",
    "zipCode": "34000",
    "country": "Turkey"
  },
  "paymentMethod": "credit_card",
  "shippingMethod": "standard",
  "appliedCoupons": ["WELCOME10"],
  "notes": {
    "customer": "Kapıya teslim etmeyin"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sipariş başarıyla oluşturuldu",
  "data": {
    "order": {
      "id": "64f8a123456789abcdef",
      "orderNumber": "ORD-202310-000001",
      "status": "pending",
      "items": [
        {
          "product": "64f8a123456789abcdef",
          "name": "iPhone 15 Pro",
          "sku": "IPHONE15PRO-BLACK",
          "quantity": 2,
          "price": 54999,
          "discountPrice": 49999,
          "total": 99998
        }
      ],
      "pricing": {
        "subtotal": 99998,
        "discount": 5000,
        "tax": 17099.64,
        "shipping": 29.99,
        "total": 112127.63
      },
      "payment": {
        "method": "credit_card",
        "status": "pending",
        "amount": 112127.63
      },
      "createdAt": "2023-10-01T10:00:00.000Z"
    }
  }
}
```

### GET `/api/orders`
Kullanıcının siparişlerini listeler.

**Query Parameters:**
- `page`: Sayfa numarası (default: 1)
- `limit`: Sayfa başına sipariş (default: 10)
- `status`: Durum filtresi
- `startDate`: Başlangıç tarihi
- `endDate`: Bitiş tarihi

**Response:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "64f8a123456789abcdef",
        "orderNumber": "ORD-202310-000001",
        "status": "delivered",
        "itemCount": 3,
        "pricing": {
          "total": 1299.99
        },
        "createdAt": "2023-10-01T10:00:00.000Z",
        "shipping": {
          "estimatedDelivery": "2023-10-05T10:00:00.000Z",
          "deliveredAt": "2023-10-04T14:30:00.000Z"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalOrders": 28
    }
  }
}
```

### GET `/api/orders/:orderNumber`
Belirli siparişin detayını getirir.

**Response:**
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "64f8a123456789abcdef",
      "orderNumber": "ORD-202310-000001",
      "status": "delivered",
      "items": [
        {
          "product": {
            "id": "64f8a123456789abcdef",
            "name": "iPhone 15 Pro",
            "slug": "iphone-15-pro"
          },
          "name": "iPhone 15 Pro",
          "sku": "IPHONE15PRO-BLACK",
          "image": "https://example.com/images/iphone15.jpg",
          "variant": {
            "name": "Renk",
            "value": "Siyah"
          },
          "quantity": 1,
          "price": 54999,
          "discountPrice": 49999,
          "total": 49999
        }
      ],
      "pricing": {
        "subtotal": 49999,
        "discount": 2500,
        "tax": 8549.82,
        "shipping": 29.99,
        "total": 56078.81
      },
      "shippingAddress": {
        "firstName": "John",
        "lastName": "Doe",
        "address": "Atatürk Caddesi No:123",
        "city": "İstanbul",
        "zipCode": "34000",
        "country": "Turkey"
      },
      "payment": {
        "method": "credit_card",
        "status": "paid",
        "paidAt": "2023-10-01T10:15:00.000Z"
      },
      "shipping": {
        "method": "standard",
        "trackingNumber": "TRK123456789",
        "carrier": "Basit Kargo",
        "shippedAt": "2023-10-02T09:00:00.000Z",
        "deliveredAt": "2023-10-04T14:30:00.000Z"
      },
      "statusHistory": [
        {
          "status": "pending",
          "updatedAt": "2023-10-01T10:00:00.000Z"
        },
        {
          "status": "confirmed",
          "updatedAt": "2023-10-01T10:15:00.000Z"
        },
        {
          "status": "processing",
          "updatedAt": "2023-10-01T16:00:00.000Z"
        },
        {
          "status": "shipped",
          "updatedAt": "2023-10-02T09:00:00.000Z"
        },
        {
          "status": "delivered",
          "updatedAt": "2023-10-04T14:30:00.000Z"
        }
      ],
      "createdAt": "2023-10-01T10:00:00.000Z"
    }
  }
}
```

### PUT `/api/orders/:orderNumber/cancel`
Siparişi iptal eder.

**Request Body:**
```json
{
  "reason": "Artık ihtiyacım yok",
  "refundRequested": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sipariş başarıyla iptal edildi",
  "data": {
    "order": {
      "status": "cancelled",
      "cancellation": {
        "reason": "Artık ihtiyacım yok",
        "cancelledAt": "2023-10-01T12:00:00.000Z",
        "refundAmount": 56078.81
      }
    }
  }
}
```

### POST `/api/orders/:orderNumber/return`
Ürün iade talebi oluşturur.

**Request Body:**
```json
{
  "items": [
    {
      "productId": "64f8a123456789abcdef",
      "quantity": 1,
      "reason": "Ürün hasarlı geldi"
    }
  ],
  "reason": "Ürün beklediğim gibi değil"
}
```

### GET `/api/orders/:orderNumber/track`
Sipariş takip bilgilerini getirir.

**Response:**
```json
{
  "success": true,
  "data": {
    "tracking": {
      "orderNumber": "ORD-202310-000001",
      "status": "shipped",
      "trackingNumber": "TRK123456789",
      "carrier": "Basit Kargo",
      "estimatedDelivery": "2023-10-05T10:00:00.000Z",
      "timeline": [
        {
          "status": "confirmed",
          "description": "Siparişiniz onaylandı",
          "timestamp": "2023-10-01T10:15:00.000Z"
        },
        {
          "status": "processing",
          "description": "Siparişiniz hazırlanıyor",
          "timestamp": "2023-10-01T16:00:00.000Z"
        },
        {
          "status": "shipped",
          "description": "Siparişiniz kargoya verildi",
          "timestamp": "2023-10-02T09:00:00.000Z"
        }
      ]
    }
  }
}
```

## Order Service Fonksiyonları

### `createOrder(userId, orderData)`
Yeni sipariş oluşturur.

### `getOrdersByUser(userId, filters, pagination)`
Kullanıcının siparişlerini getirir.

### `getOrderByNumber(orderNumber, userId)`
Sipariş detayını getirir.

### `updateOrderStatus(orderId, status, note, updatedBy)`
Sipariş durumunu günceller.

### `cancelOrder(orderId, reason, userId)`
Siparişi iptal eder.

### `createReturnRequest(orderId, returnData)`
İade talebi oluşturur.

### `calculateOrderPricing(items, coupons, shippingMethod)`
Sipariş fiyatını hesaplar.

### `validateOrderItems(items)`
Sipariş öğelerini doğrular (stok, fiyat vs.).

## Order Status Management

```javascript
// services/orderService.js
const ORDER_STATUS_FLOW = {
  'pending': ['confirmed', 'cancelled'],
  'confirmed': ['processing', 'cancelled'],
  'processing': ['shipped', 'cancelled'],
  'shipped': ['delivered', 'returned'],
  'delivered': ['returned'],
  'cancelled': [],
  'returned': ['refunded'],
  'refunded': []
};

class OrderService {
  async updateOrderStatus(orderId, newStatus, note = '', updatedBy = null) {
    const order = await Order.findById(orderId);
    
    if (!order) {
      throw new Error('Sipariş bulunamadı');
    }

    // Durum geçişi kontrolü
    const allowedStatuses = ORDER_STATUS_FLOW[order.status] || [];
    if (!allowedStatuses.includes(newStatus)) {
      throw new Error(`${order.status} durumundan ${newStatus} durumuna geçiş yapılamaz`);
    }

    // Duruma özel işlemler
    switch (newStatus) {
      case 'confirmed':
        await this.reserveStock(order.items);
        await this.sendConfirmationEmail(order);
        break;
        
      case 'shipped':
        order.shipping.shippedAt = new Date();
        await this.sendShippingEmail(order);
        break;
        
      case 'delivered':
        order.shipping.deliveredAt = new Date();
        await this.releaseReservedStock(order.items);
        await this.sendDeliveryEmail(order);
        break;
        
      case 'cancelled':
        await this.releaseReservedStock(order.items);
        await this.processCancellationRefund(order);
        break;
    }

    // Durum güncelle
    order.status = newStatus;
    
    // History güncelle
    order.statusHistory.push({
      status: newStatus,
      note,
      updatedBy,
      updatedAt: new Date()
    });

    await order.save();
    
    // Webhook/event gönder
    await this.sendStatusWebhook(order);
    
    return order;
  }

  async reserveStock(items) {
    for (const item of items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: {
          'stock.available': -item.quantity,
          'stock.reserved': item.quantity
        }
      });
    }
  }

  async releaseReservedStock(items) {
    for (const item of items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: {
          'stock.reserved': -item.quantity
        }
      });
    }
  }
}
```

## Validation Schemas

### Create Order Validation
```javascript
const createOrderSchema = Joi.object({
  items: Joi.array().items(
    Joi.object({
      productId: Joi.string().hex().length(24).required(),
      quantity: Joi.number().min(1).max(10).required(),
      variant: Joi.object({
        name: Joi.string(),
        value: Joi.string(),
        sku: Joi.string()
      })
    })
  ).min(1).required(),
  
  shippingAddress: Joi.object({
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^\+90\s\d{3}\s\d{3}\s\d{2}\s\d{2}$/).required(),
    address: Joi.string().min(10).max(200).required(),
    city: Joi.string().min(2).max(50).required(),
    state: Joi.string().min(2).max(50).required(),
    zipCode: Joi.string().pattern(/^\d{5}$/).required(),
    country: Joi.string().min(2).max(50).required()
  }).required(),
  
  billingAddress: Joi.object({
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^\+90\s\d{3}\s\d{3}\s\d{2}\s\d{2}$/).required(),
    address: Joi.string().min(10).max(200).required(),
    city: Joi.string().min(2).max(50).required(),
    state: Joi.string().min(2).max(50).required(),
    zipCode: Joi.string().pattern(/^\d{5}$/).required(),
    country: Joi.string().min(2).max(50).required()
  }).required(),
  
  paymentMethod: Joi.string().valid('credit_card', 'bank_transfer', 'cash_on_delivery').required(),
  shippingMethod: Joi.string().valid('standard', 'express', 'overnight').default('standard'),
  appliedCoupons: Joi.array().items(Joi.string()),
  notes: Joi.object({
    customer: Joi.string().max(500)
  })
});
```

## Frontend Entegrasyonu

### Order Hook (React)
```javascript
import { useState, useEffect } from 'react';

export const useOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  const createOrder = async (orderData) => {
    setLoading(true);
    try {
      const response = await api.post('/orders', orderData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getOrders = async (filters = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams(filters);
      const response = await api.get(`/orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data.data.orders);
      return response.data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getOrder = async (orderNumber) => {
    try {
      const response = await api.get(`/orders/${orderNumber}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data.order;
    } catch (error) {
      throw error;
    }
  };

  const cancelOrder = async (orderNumber, reason) => {
    try {
      const response = await api.put(`/orders/${orderNumber}/cancel`, {
        reason,
        refundRequested: true
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const trackOrder = async (orderNumber) => {
    try {
      const response = await api.get(`/orders/${orderNumber}/track`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data.tracking;
    } catch (error) {
      throw error;
    }
  };

  return {
    orders,
    loading,
    createOrder,
    getOrders,
    getOrder,
    cancelOrder,
    trackOrder
  };
};
```

### Order Tracking Component
```javascript
import React, { useState, useEffect } from 'react';
import { useOrders } from '../hooks/useOrders';

const OrderTracking = ({ orderNumber }) => {
  const { trackOrder } = useOrders();
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTracking = async () => {
      try {
        const trackingData = await trackOrder(orderNumber);
        setTracking(trackingData);
      } catch (error) {
        console.error('Tracking fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTracking();
  }, [orderNumber]);

  if (loading) return <div>Yükleniyor...</div>;
  if (!tracking) return <div>Takip bilgisi bulunamadı</div>;

  const getStatusIcon = (status) => {
    const icons = {
      'confirmed': '✅',
      'processing': '📦',
      'shipped': '🚚',
      'delivered': '✅'
    };
    return icons[status] || '⏳';
  };

  return (
    <div className="order-tracking">
      <h3>Sipariş Takibi</h3>
      
      <div className="tracking-info">
        <div className="order-number">
          Sipariş No: <strong>{tracking.orderNumber}</strong>
        </div>
        
        {tracking.trackingNumber && (
          <div className="tracking-number">
            Takip No: <strong>{tracking.trackingNumber}</strong>
          </div>
        )}
        
        <div className="current-status">
          Durum: <span className={`status ${tracking.status}`}>
            {getStatusIcon(tracking.status)} {tracking.status}
          </span>
        </div>
        
        {tracking.estimatedDelivery && (
          <div className="estimated-delivery">
            Tahmini Teslimat: {new Date(tracking.estimatedDelivery).toLocaleDateString('tr-TR')}
          </div>
        )}
      </div>

      <div className="tracking-timeline">
        <h4>Sipariş Durumu</h4>
        <div className="timeline">
          {tracking.timeline.map((event, index) => (
            <div key={index} className="timeline-item">
              <div className="timeline-icon">
                {getStatusIcon(event.status)}
              </div>
              <div className="timeline-content">
                <div className="timeline-title">{event.description}</div>
                <div className="timeline-date">
                  {new Date(event.timestamp).toLocaleString('tr-TR')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

## Email Notifications

### Email Templates
```javascript
// services/emailService.js
const orderEmailTemplates = {
  orderConfirmed: (order) => ({
    subject: `Siparişiniz Onaylandı - ${order.orderNumber}`,
    template: 'order-confirmed',
    data: {
      orderNumber: order.orderNumber,
      customerName: order.shippingAddress.firstName,
      items: order.items,
      total: order.pricing.total,
      estimatedDelivery: order.shipping.estimatedDelivery
    }
  }),

  orderShipped: (order) => ({
    subject: `Siparişiniz Kargoya Verildi - ${order.orderNumber}`,
    template: 'order-shipped',
    data: {
      orderNumber: order.orderNumber,
      trackingNumber: order.shipping.trackingNumber,
      carrier: order.shipping.carrier,
      estimatedDelivery: order.shipping.estimatedDelivery
    }
  }),

  orderDelivered: (order) => ({
    subject: `Siparişiniz Teslim Edildi - ${order.orderNumber}`,
    template: 'order-delivered',
    data: {
      orderNumber: order.orderNumber,
      deliveredAt: order.shipping.deliveredAt
    }
  })
};
```

## Error Handling

### Order Errors
```javascript
// Sipariş bulunamadı
{
  "success": false,
  "error": {
    "code": "ORDER_NOT_FOUND",
    "message": "Sipariş bulunamadı"
  }
}

// Stok yetersiz
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Ürün stokta yeterli değil",
    "data": {
      "productId": "64f8a123456789abcdef",
      "requested": 5,
      "available": 3
    }
  }
}

// Geçersiz durum geçişi
{
  "success": false,
  "error": {
    "code": "INVALID_STATUS_TRANSITION",
    "message": "Bu durumdan belirtilen duruma geçiş yapılamaz"
  }
}
```

## Test Örnekleri

```javascript
describe('Order Management', () => {
  test('should create order successfully', async () => {
    const orderData = {
      items: [{ productId: productId, quantity: 1 }],
      shippingAddress: testShippingAddress,
      billingAddress: testBillingAddress,
      paymentMethod: 'credit_card'
    };

    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send(orderData);

    expect(response.status).toBe(201);
    expect(response.body.data.order.orderNumber).toMatch(/^ORD-\d{6}-\d{6}$/);
  });

  test('should cancel order', async () => {
    const response = await request(app)
      .put(`/api/orders/${orderNumber}/cancel`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ reason: 'Test cancellation' });

    expect(response.status).toBe(200);
    expect(response.body.data.order.status).toBe('cancelled');
  });
});
```

---

**Son Güncelleme**: `{new Date().toLocaleDateString('tr-TR')}` 