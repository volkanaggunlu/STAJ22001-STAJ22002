# Shipping & Tracking Modülü

## Genel Bakış

Shipping & Tracking modülü, kargo gönderimi, takip sistemi, teslimat yönetimi ve kargo şirketi entegrasyonlarını yönetir. Basit Kargo entegrasyonu ve çoklu kargo seçenekleri sunar.

## Dosya Yapısı

```
src/
├── controllers/
│   └── shipping.js              # Kargo controller
├── routes/
│   └── shipping.js             # Kargo routes
├── services/
│   ├── shippingService.js      # Kargo business logic
│   └── basitKargoService.js    # Basit Kargo entegrasyonu
├── models/
│   └── Shipment.js             # Kargo modeli
└── validation/
    └── shippingValidation.js   # Kargo validation schemas
```

## Shipment Model Schema

```javascript
// models/Shipment.js
const shipmentSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    unique: true
  },
  trackingNumber: {
    type: String,
    unique: true,
    required: true
  },
  carrier: {
    name: { type: String, required: true }, // "Basit Kargo", "PTT", "MNG"
    code: { type: String, required: true }, // "basit", "ptt", "mng"
    logo: String,
    website: String
  },
  service: {
    type: { type: String, required: true }, // "standard", "express", "overnight"
    name: String, // "Standart Teslimat", "Hızlı Teslimat"
    estimatedDays: Number
  },
  sender: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, default: 'Turkey' }
    }
  },
  recipient: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: String,
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, default: 'Turkey' }
    }
  },
  package: {
    weight: { type: Number, required: true }, // gram
    dimensions: {
      length: Number, // cm
      width: Number,
      height: Number
    },
    value: { type: Number, required: true }, // TL
    description: String,
    contents: [String]
  },
  status: {
    type: String,
    enum: [
      'created',           // Oluşturuldu
      'picked_up',         // Alındı
      'in_transit',        // Yolda
      'out_for_delivery',  // Dağıtımda
      'delivered',         // Teslim edildi
      'returned',          // İade edildi
      'cancelled'          // İptal edildi
    ],
    default: 'created'
  },
  events: [{
    status: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    location: {
      city: String,
      facility: String
    },
    timestamp: {
      type: Date,
      required: true
    },
    updatedBy: String // "system", "carrier", "admin"
  }],
  cost: {
    base: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    insurance: { type: Number, default: 0 },
    total: { type: Number, required: true }
  },
  estimatedDelivery: Date,
  actualDelivery: Date,
  deliveryAttempts: [{
    date: { type: Date, required: true },
    reason: String, // "Alıcı evde değil", "Adres bulunamadı"
    nextAttempt: Date
  }],
  specialInstructions: String,
  isInsured: { type: Boolean, default: false },
  requiresSignature: { type: Boolean, default: true },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Event eklendiğinde status güncelle
shipmentSchema.pre('save', function(next) {
  if (this.events && this.events.length > 0) {
    const latestEvent = this.events[this.events.length - 1];
    this.status = latestEvent.status;
    
    if (latestEvent.status === 'delivered') {
      this.actualDelivery = latestEvent.timestamp;
    }
  }
  
  this.updatedAt = new Date();
  next();
});

// Indexes
shipmentSchema.index({ trackingNumber: 1 });
shipmentSchema.index({ order: 1 });
shipmentSchema.index({ status: 1 });
shipmentSchema.index({ 'carrier.code': 1 });
shipmentSchema.index({ createdAt: -1 });
```

## API Endpoints

### GET `/api/shipping/methods`
Mevcut kargo yöntemlerini listeler.

**Response:**
```json
{
  "success": true,
  "data": {
    "methods": [
      {
        "id": "standard",
        "name": "Standart Teslimat",
        "description": "2-4 iş günü",
        "price": 29.99,
        "estimatedDays": 3,
        "carrier": {
          "name": "Basit Kargo",
          "logo": "https://example.com/logos/basit-kargo.png"
        },
        "features": [
          "Ücretsiz teslimat (500₺ üzeri)",
          "SMS bilgilendirme",
          "Online takip"
        ]
      },
      {
        "id": "express",
        "name": "Hızlı Teslimat",
        "description": "1-2 iş günü",
        "price": 59.99,
        "estimatedDays": 1,
        "carrier": {
          "name": "Express Kargo",
          "logo": "https://example.com/logos/express.png"
        },
        "features": [
          "Hızlı teslimat",
          "SMS + Email bilgilendirme",
          "Canlı takip"
        ]
      }
    ]
  }
}
```

### POST `/api/shipping/calculate`
Kargo ücretini hesaplar.

**Request Body:**
```json
{
  "items": [
    {
      "weight": 500,
      "dimensions": {
        "length": 20,
        "width": 15,
        "height": 10
      },
      "value": 1299.99
    }
  ],
  "destination": {
    "city": "İstanbul",
    "state": "İstanbul",
    "zipCode": "34000"
  },
  "service": "standard"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "shipping": {
      "service": "standard",
      "cost": {
        "base": 29.99,
        "tax": 5.40,
        "insurance": 6.50,
        "total": 41.89
      },
      "estimatedDelivery": "2023-10-05T00:00:00.000Z",
      "carrier": "Basit Kargo"
    }
  }
}
```

### POST `/api/shipping/create`
Kargo gönderimi oluşturur.

**Request Body:**
```json
{
  "orderId": "64f8a123456789abcdef",
  "service": "standard",
  "sender": {
    "name": "E-Commerce Mağazası",
    "phone": "+90 212 555 00 00",
    "address": {
      "street": "Merkez Mah. Ticaret Sok. No:1",
      "city": "İstanbul",
      "state": "İstanbul",
      "zipCode": "34000"
    }
  },
  "package": {
    "weight": 500,
    "dimensions": {
      "length": 20,
      "width": 15,
      "height": 10
    },
    "description": "iPhone 15 Pro",
    "contents": ["Akıllı telefon", "Şarj kablosu"]
  },
  "specialInstructions": "Kapıya teslim edilsin",
  "requiresSignature": true,
  "isInsured": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Kargo gönderimi oluşturuldu",
  "data": {
    "shipment": {
      "id": "64f8a123456789abcdef",
      "trackingNumber": "BK123456789TR",
      "carrier": {
        "name": "Basit Kargo",
        "code": "basit"
      },
      "status": "created",
      "estimatedDelivery": "2023-10-05T00:00:00.000Z",
      "cost": {
        "total": 41.89
      }
    }
  }
}
```

### GET `/api/shipping/track/:trackingNumber`
Kargo takip bilgilerini getirir.

**Response:**
```json
{
  "success": true,
  "data": {
    "tracking": {
      "trackingNumber": "BK123456789TR",
      "status": "in_transit",
      "carrier": {
        "name": "Basit Kargo",
        "logo": "https://example.com/logos/basit-kargo.png",
        "website": "https://basit-kargo.com"
      },
      "estimatedDelivery": "2023-10-05T00:00:00.000Z",
      "recipient": {
        "name": "John Doe",
        "city": "Ankara"
      },
      "events": [
        {
          "status": "created",
          "description": "Kargo oluşturuldu",
          "location": {
            "city": "İstanbul",
            "facility": "İstanbul Merkez"
          },
          "timestamp": "2023-10-01T10:00:00.000Z"
        },
        {
          "status": "picked_up",
          "description": "Kargo alındı",
          "location": {
            "city": "İstanbul",
            "facility": "İstanbul Merkez"
          },
          "timestamp": "2023-10-01T14:00:00.000Z"
        },
        {
          "status": "in_transit",
          "description": "Transfer merkezinde",
          "location": {
            "city": "Ankara",
            "facility": "Ankara Transfer"
          },
          "timestamp": "2023-10-02T08:00:00.000Z"
        }
      ],
      "progress": {
        "percentage": 60,
        "currentStep": 2,
        "totalSteps": 4
      }
    }
  }
}
```

### POST `/api/shipping/:id/cancel` (Admin)
Kargo gönderimini iptal eder.

### PUT `/api/shipping/:id/update-status` (Admin/Webhook)
Kargo durumunu günceller.

**Request Body:**
```json
{
  "status": "delivered",
  "description": "Paket teslim edildi",
  "location": {
    "city": "Ankara",
    "facility": "Ankara Dağıtım"
  },
  "deliveryInfo": {
    "receivedBy": "John Doe",
    "signature": "base64_signature_image"
  }
}
```

## Basit Kargo Service Integration

```javascript
// services/basitKargoService.js
const axios = require('axios');
const config = require('../config/environment');

class BasitKargoService {
  constructor() {
    this.apiKey = config.BASIT_KARGO_API_KEY;
    this.username = config.BASIT_KARGO_USERNAME;
    this.password = config.BASIT_KARGO_PASSWORD;
    this.baseURL = 'https://api.basit-kargo.com/v1';
  }

  async authenticate() {
    try {
      const response = await axios.post(`${this.baseURL}/auth/login`, {
        username: this.username,
        password: this.password
      });
      return response.data.token;
    } catch (error) {
      throw new Error(`Basit Kargo authentication failed: ${error.message}`);
    }
  }

  async createShipment(shipmentData) {
    try {
      const token = await this.authenticate();
      
      const payload = {
        sender: {
          name: shipmentData.sender.name,
          phone: shipmentData.sender.phone,
          address: {
            street: shipmentData.sender.address.street,
            city: shipmentData.sender.address.city,
            district: shipmentData.sender.address.state,
            postalCode: shipmentData.sender.address.zipCode
          }
        },
        receiver: {
          name: shipmentData.recipient.name,
          phone: shipmentData.recipient.phone,
          address: {
            street: shipmentData.recipient.address.street,
            city: shipmentData.recipient.address.city,
            district: shipmentData.recipient.address.state,
            postalCode: shipmentData.recipient.address.zipCode
          }
        },
        package: {
          weight: shipmentData.package.weight,
          dimensions: shipmentData.package.dimensions,
          value: shipmentData.package.value,
          description: shipmentData.package.description,
          contents: shipmentData.package.contents
        },
        service: shipmentData.service.type,
        instructions: shipmentData.specialInstructions,
        insurance: shipmentData.isInsured,
        signature: shipmentData.requiresSignature
      };

      const response = await axios.post(`${this.baseURL}/shipments`, payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        trackingNumber: response.data.trackingNumber,
        estimatedDelivery: new Date(response.data.estimatedDelivery),
        cost: response.data.cost,
        label: response.data.label // PDF label URL
      };
    } catch (error) {
      throw new Error(`Basit Kargo shipment creation failed: ${error.message}`);
    }
  }

  async trackShipment(trackingNumber) {
    try {
      const token = await this.authenticate();
      
      const response = await axios.get(`${this.baseURL}/shipments/${trackingNumber}/track`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return {
        status: this.mapStatus(response.data.status),
        events: response.data.events.map(event => ({
          status: this.mapStatus(event.status),
          description: event.description,
          location: {
            city: event.location.city,
            facility: event.location.facility
          },
          timestamp: new Date(event.timestamp)
        })),
        estimatedDelivery: new Date(response.data.estimatedDelivery)
      };
    } catch (error) {
      throw new Error(`Basit Kargo tracking failed: ${error.message}`);
    }
  }

  async cancelShipment(trackingNumber) {
    try {
      const token = await this.authenticate();
      
      await axios.post(`${this.baseURL}/shipments/${trackingNumber}/cancel`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return true;
    } catch (error) {
      throw new Error(`Basit Kargo cancellation failed: ${error.message}`);
    }
  }

  mapStatus(basitKargoStatus) {
    const statusMap = {
      'CREATED': 'created',
      'PICKED_UP': 'picked_up',
      'IN_TRANSIT': 'in_transit',
      'OUT_FOR_DELIVERY': 'out_for_delivery',
      'DELIVERED': 'delivered',
      'RETURNED': 'returned',
      'CANCELLED': 'cancelled'
    };
    
    return statusMap[basitKargoStatus] || 'created';
  }

  async calculateCost(shipmentData) {
    try {
      const token = await this.authenticate();
      
      const response = await axios.post(`${this.baseURL}/shipping/calculate`, {
        weight: shipmentData.package.weight,
        dimensions: shipmentData.package.dimensions,
        value: shipmentData.package.value,
        destination: shipmentData.destination,
        service: shipmentData.service
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return {
        base: response.data.basePrice,
        tax: response.data.tax,
        insurance: response.data.insurance,
        total: response.data.totalPrice
      };
    } catch (error) {
      throw new Error(`Basit Kargo cost calculation failed: ${error.message}`);
    }
  }
}

module.exports = new BasitKargoService();
```

## Shipping Service

```javascript
// services/shippingService.js
const Shipment = require('../models/Shipment');
const basitKargoService = require('./basitKargoService');

class ShippingService {
  async getShippingMethods(destination) {
    const methods = [
      {
        id: 'standard',
        name: 'Standart Teslimat',
        description: '2-4 iş günü',
        price: 29.99,
        estimatedDays: 3,
        carrier: {
          name: 'Basit Kargo',
          code: 'basit',
          logo: '/images/carriers/basit-kargo.png'
        },
        features: [
          'Ücretsiz teslimat (500₺ üzeri)',
          'SMS bilgilendirme',
          'Online takip'
        ]
      },
      {
        id: 'express',
        name: 'Hızlı Teslimat',
        description: '1-2 iş günü',
        price: 59.99,
        estimatedDays: 1,
        carrier: {
          name: 'Express Kargo',
          code: 'express',
          logo: '/images/carriers/express.png'
        },
        features: [
          'Hızlı teslimat',
          'SMS + Email bilgilendirme',
          'Canlı takip'
        ]
      }
    ];

    return methods;
  }

  async calculateShippingCost(items, destination, service = 'standard') {
    try {
      // Toplam ağırlık ve hacim hesapla
      const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
      const totalValue = items.reduce((sum, item) => sum + item.value, 0);

      // Basit Kargo API ile hesapla
      const cost = await basitKargoService.calculateCost({
        package: {
          weight: totalWeight,
          value: totalValue
        },
        destination,
        service
      });

      // Ücretsiz kargo kontrolü
      if (totalValue >= 500 && service === 'standard') {
        cost.base = 0;
        cost.total = cost.tax + cost.insurance;
      }

      return {
        service,
        cost,
        estimatedDelivery: this.calculateEstimatedDelivery(service),
        carrier: service === 'standard' ? 'Basit Kargo' : 'Express Kargo'
      };
    } catch (error) {
      // Fallback hesaplama
      return this.fallbackCostCalculation(items, destination, service);
    }
  }

  async createShipment(order, shippingData) {
    try {
      // Kargo şirketi API'sine gönder
      const carrierResponse = await basitKargoService.createShipment({
        sender: shippingData.sender,
        recipient: order.shippingAddress,
        package: shippingData.package,
        service: { type: shippingData.service },
        specialInstructions: shippingData.specialInstructions,
        isInsured: shippingData.isInsured,
        requiresSignature: shippingData.requiresSignature
      });

      // Veritabanında shipment oluştur
      const shipment = new Shipment({
        order: order._id,
        trackingNumber: carrierResponse.trackingNumber,
        carrier: {
          name: 'Basit Kargo',
          code: 'basit',
          logo: '/images/carriers/basit-kargo.png',
          website: 'https://basit-kargo.com'
        },
        service: {
          type: shippingData.service,
          name: shippingData.service === 'standard' ? 'Standart Teslimat' : 'Hızlı Teslimat',
          estimatedDays: shippingData.service === 'standard' ? 3 : 1
        },
        sender: shippingData.sender,
        recipient: {
          name: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
          phone: order.shippingAddress.phone,
          email: order.shippingAddress.email,
          address: {
            street: order.shippingAddress.address,
            city: order.shippingAddress.city,
            state: order.shippingAddress.state,
            zipCode: order.shippingAddress.zipCode,
            country: order.shippingAddress.country
          }
        },
        package: shippingData.package,
        cost: carrierResponse.cost,
        estimatedDelivery: carrierResponse.estimatedDelivery,
        specialInstructions: shippingData.specialInstructions,
        isInsured: shippingData.isInsured,
        requiresSignature: shippingData.requiresSignature,
        events: [{
          status: 'created',
          description: 'Kargo oluşturuldu',
          location: {
            city: shippingData.sender.address.city,
            facility: 'Merkez'
          },
          timestamp: new Date(),
          updatedBy: 'system'
        }]
      });

      await shipment.save();

      return shipment;
    } catch (error) {
      throw new Error(`Shipment creation failed: ${error.message}`);
    }
  }

  async trackShipment(trackingNumber) {
    try {
      const shipment = await Shipment.findOne({ trackingNumber })
        .populate('order', 'orderNumber user');

      if (!shipment) {
        throw new Error('Kargo bulunamadı');
      }

      // Kargo şirketinden güncel bilgileri al
      let carrierTracking;
      try {
        carrierTracking = await basitKargoService.trackShipment(trackingNumber);
        
        // Yeni eventler varsa ekle
        this.updateShipmentEvents(shipment, carrierTracking.events);
      } catch (error) {
        // Kargo şirketi API'si çalışmıyorsa mevcut bilgileri döndür
        console.warn('Carrier API unavailable, using local data:', error.message);
      }

      return {
        trackingNumber: shipment.trackingNumber,
        status: shipment.status,
        carrier: shipment.carrier,
        estimatedDelivery: shipment.estimatedDelivery,
        actualDelivery: shipment.actualDelivery,
        recipient: {
          name: shipment.recipient.name,
          city: shipment.recipient.address.city
        },
        events: shipment.events.sort((a, b) => b.timestamp - a.timestamp),
        progress: this.calculateProgress(shipment.events, shipment.status)
      };
    } catch (error) {
      throw new Error(`Tracking failed: ${error.message}`);
    }
  }

  updateShipmentEvents(shipment, newEvents) {
    const existingTimestamps = shipment.events.map(e => e.timestamp.getTime());
    
    for (const event of newEvents) {
      const eventTime = new Date(event.timestamp).getTime();
      
      if (!existingTimestamps.includes(eventTime)) {
        shipment.events.push({
          status: event.status,
          description: event.description,
          location: event.location,
          timestamp: new Date(event.timestamp),
          updatedBy: 'carrier'
        });
      }
    }
    
    shipment.save();
  }

  calculateProgress(events, currentStatus) {
    const statusOrder = [
      'created', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered'
    ];
    
    const currentIndex = statusOrder.indexOf(currentStatus);
    const percentage = currentIndex >= 0 ? 
      Math.round(((currentIndex + 1) / statusOrder.length) * 100) : 0;
    
    return {
      percentage,
      currentStep: currentIndex + 1,
      totalSteps: statusOrder.length
    };
  }

  calculateEstimatedDelivery(service) {
    const today = new Date();
    const estimatedDays = service === 'express' ? 1 : 3;
    
    today.setDate(today.getDate() + estimatedDays);
    return today;
  }

  fallbackCostCalculation(items, destination, service) {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    const totalValue = items.reduce((sum, item) => sum + item.value, 0);
    
    let basePrice = 29.99;
    if (service === 'express') basePrice = 59.99;
    if (totalWeight > 1000) basePrice += 10; // 1kg üzeri ek ücret
    
    const tax = basePrice * 0.18;
    const insurance = totalValue > 1000 ? totalValue * 0.005 : 0;
    
    // Ücretsiz kargo
    if (totalValue >= 500 && service === 'standard') {
      basePrice = 0;
    }
    
    return {
      service,
      cost: {
        base: basePrice,
        tax,
        insurance,
        total: basePrice + tax + insurance
      },
      estimatedDelivery: this.calculateEstimatedDelivery(service),
      carrier: 'Basit Kargo'
    };
  }
}

module.exports = new ShippingService();
```

## Frontend Entegrasyonu

### Shipping Hook (React)
```javascript
import { useState } from 'react';

export const useShipping = () => {
  const [loading, setLoading] = useState(false);

  const getShippingMethods = async (destination) => {
    setLoading(true);
    try {
      const response = await api.get('/shipping/methods', {
        params: destination
      });
      return response.data.data.methods;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const calculateShipping = async (items, destination, service) => {
    setLoading(true);
    try {
      const response = await api.post('/shipping/calculate', {
        items,
        destination,
        service
      });
      return response.data.data.shipping;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const trackPackage = async (trackingNumber) => {
    try {
      const response = await api.get(`/shipping/track/${trackingNumber}`);
      return response.data.data.tracking;
    } catch (error) {
      throw error;
    }
  };

  return {
    loading,
    getShippingMethods,
    calculateShipping,
    trackPackage
  };
};
```

### Package Tracking Component
```javascript
import React, { useState, useEffect } from 'react';
import { useShipping } from '../hooks/useShipping';

const PackageTracking = ({ trackingNumber }) => {
  const { trackPackage } = useShipping();
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTracking = async () => {
      try {
        const data = await trackPackage(trackingNumber);
        setTracking(data);
      } catch (error) {
        console.error('Tracking fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (trackingNumber) {
      fetchTracking();
      
      // Her 5 dakikada bir güncelle
      const interval = setInterval(fetchTracking, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [trackingNumber]);

  if (loading) return <div>Takip bilgileri yükleniyor...</div>;
  if (!tracking) return <div>Takip bilgisi bulunamadı</div>;

  return (
    <div className="package-tracking">
      <div className="tracking-header">
        <h3>Kargo Takibi</h3>
        <div className="tracking-number">
          Takip No: <strong>{tracking.trackingNumber}</strong>
        </div>
        <div className="carrier-info">
          <img src={tracking.carrier.logo} alt={tracking.carrier.name} />
          <span>{tracking.carrier.name}</span>
        </div>
      </div>

      <div className="tracking-progress">
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${tracking.progress.percentage}%` }}
          ></div>
        </div>
        <div className="progress-text">
          {tracking.progress.currentStep} / {tracking.progress.totalSteps} tamamlandı
        </div>
      </div>

      <div className="delivery-info">
        <div className="recipient">
          Alıcı: <strong>{tracking.recipient.name}</strong>
        </div>
        <div className="destination">
          Teslimat Adresi: <strong>{tracking.recipient.city}</strong>
        </div>
        {tracking.estimatedDelivery && (
          <div className="estimated-delivery">
            Tahmini Teslimat: <strong>
              {new Date(tracking.estimatedDelivery).toLocaleDateString('tr-TR')}
            </strong>
          </div>
        )}
      </div>

      <div className="tracking-events">
        <h4>Kargo Hareketleri</h4>
        <div className="events-timeline">
          {tracking.events.map((event, index) => (
            <div key={index} className={`event ${event.status}`}>
              <div className="event-icon">
                {getEventIcon(event.status)}
              </div>
              <div className="event-content">
                <div className="event-description">{event.description}</div>
                <div className="event-location">
                  {event.location.city} - {event.location.facility}
                </div>
                <div className="event-time">
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

const getEventIcon = (status) => {
  const icons = {
    'created': '📦',
    'picked_up': '🚚',
    'in_transit': '🛣️',
    'out_for_delivery': '🚛',
    'delivered': '✅',
    'returned': '↩️',
    'cancelled': '❌'
  };
  return icons[status] || '📦';
};
```

## Webhook Handling

```javascript
// routes/shipping.js - Webhook endpoint
router.post('/webhook/basit-kargo', async (req, res) => {
  try {
    const { trackingNumber, status, description, location, timestamp } = req.body;
    
    // Webhook signature doğrula
    const signature = req.headers['x-basit-kargo-signature'];
    if (!verifyWebhookSignature(req.body, signature)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    const shipment = await Shipment.findOne({ trackingNumber });
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }
    
    // Yeni event ekle
    shipment.events.push({
      status: mapBasitKargoStatus(status),
      description,
      location,
      timestamp: new Date(timestamp),
      updatedBy: 'carrier'
    });
    
    await shipment.save();
    
    // Customer'a bildirim gönder
    await sendTrackingNotification(shipment);
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});
```

## Test Örnekleri

```javascript
describe('Shipping & Tracking', () => {
  test('should calculate shipping cost', async () => {
    const items = [{ weight: 500, value: 100 }];
    const destination = { city: 'Ankara', zipCode: '06000' };
    
    const response = await request(app)
      .post('/api/shipping/calculate')
      .send({ items, destination, service: 'standard' });
    
    expect(response.status).toBe(200);
    expect(response.body.data.shipping.cost.total).toBeGreaterThan(0);
  });

  test('should track package', async () => {
    const response = await request(app)
      .get('/api/shipping/track/BK123456789TR');
    
    expect(response.status).toBe(200);
    expect(response.body.data.tracking.trackingNumber).toBe('BK123456789TR');
  });
});
```

---

**Son Güncelleme**: `{new Date().toLocaleDateString('tr-TR')}` 