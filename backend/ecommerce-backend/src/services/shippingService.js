const axios = require('axios');
const logger = require('../logger/logger');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { ValidationError } = require('../errors/errors');
const { 
  BASITKARGO_API_KEY,
  BASITKARGO_USERNAME,
  BASITKARGO_PASSWORD,
  BASITKARGO_BASE_URL,
  BASITKARGO_TEST_MODE,
  FREE_SHIPPING_LIMIT,
  STANDARD_SHIPPING_COST
} = require('../config/environment');

class ShippingService {
  constructor() {
    this.baseURL = BASITKARGO_BASE_URL || 'https://api.basitkargo.com/v1';
    this.apiKey = BASITKARGO_API_KEY;
    this.username = BASITKARGO_USERNAME;
    this.password = BASITKARGO_PASSWORD;
    this.testMode = BASITKARGO_TEST_MODE || false;
  }

  /**
   * BasitKargo API'ye authentication request gönderir
   */
  async getAuthToken() {
    try {
      if (this.testMode) {
        logger.info('BasitKargo test mode - using mock token');
        return 'mock_token_for_testing';
      }

      const response = await axios.post(`${this.baseURL}/auth/login`, {
        username: this.username,
        password: this.password,
        api_key: this.apiKey
      });

      return response.data.token;
    } catch (error) {
      logger.error('BasitKargo authentication failed:', error);
      throw new ValidationError('Kargo API ile bağlantı kurulamadı');
    }
  }

  /**
   * Kargo şirketleri listesini getirir
   */
  async getCarriers() {
    try {
      if (this.testMode) {
        return [
          { code: 'aras', name: 'Aras Kargo', isActive: true },
          { code: 'mng', name: 'MNG Kargo', isActive: true },
          { code: 'yurtici', name: 'Yurtiçi Kargo', isActive: true },
          { code: 'ptt', name: 'PTT Kargo', isActive: true },
          { code: 'ups', name: 'UPS', isActive: true },
          { code: 'dhl', name: 'DHL', isActive: true }
        ];
      }

      const token = await this.getAuthToken();
      const response = await axios.get(`${this.baseURL}/carriers`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      return response.data.carriers;
    } catch (error) {
      logger.error('Get carriers failed:', error);
      throw new ValidationError('Kargo şirketleri alınamadı');
    }
  }

  /**
   * Kargo gönderisi oluşturur
   */
  async createShipment(shipmentData) {
    try {
      const {
        orderId,
        carrier,
        service,
        weight,
        dimensions,
        insuranceValue,
        specialInstructions,
        senderInfo,
        receiverInfo
      } = shipmentData;

      if (this.testMode) {
        const mockTrackingNumber = `TEST${Date.now()}`;
        logger.info(`Mock shipment created: ${mockTrackingNumber}`);
        
        return {
          trackingNumber: mockTrackingNumber,
          estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 gün sonra
          labelUrl: `${this.baseURL}/labels/${mockTrackingNumber}.pdf`,
          cost: 25.00
        };
      }

      const token = await this.getAuthToken();
      
      const payload = {
        carrier,
        service: service || 'standard',
        sender: senderInfo,
        receiver: receiverInfo,
        package: {
          weight,
          dimensions,
          insuranceValue: insuranceValue || 0,
          description: 'E-ticaret siparişi',
          specialInstructions
        },
        reference: orderId
      };

      const response = await axios.post(`${this.baseURL}/shipments`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      logger.info(`Shipment created successfully: ${response.data.trackingNumber}`);
      
      return {
        trackingNumber: response.data.trackingNumber,
        estimatedDelivery: response.data.estimatedDelivery,
        labelUrl: response.data.labelUrl,
        cost: response.data.cost
      };
    } catch (error) {
      logger.error('Create shipment failed:', error);
      throw new ValidationError('Kargo gönderisi oluşturulamadı: ' + (error.response?.data?.message || error.message));
    }
  }

  /**
   * Kargo takip bilgilerini getirir
   */
  async trackShipment(carrier, trackingNumber) {
    try {
      if (this.testMode) {
        return {
          trackingNumber,
          status: 'in_transit',
          lastUpdate: new Date().toISOString(),
          estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          events: [
            {
              date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
              status: 'picked_up',
              location: 'İstanbul',
              description: 'Gönderi kargo şubesinden alındı'
            },
            {
              date: new Date().toISOString(),
              status: 'in_transit',
              location: 'Ankara',
              description: 'Gönderi transit halinde'
            }
          ]
        };
      }

      const token = await this.getAuthToken();
      
      const response = await axios.get(`${this.baseURL}/track/${carrier}/${trackingNumber}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      return response.data;
    } catch (error) {
      logger.error('Track shipment failed:', error);
      throw new ValidationError('Kargo takip bilgisi alınamadı');
    }
  }

  /**
   * Kargo etiketi indirir
   */
  async downloadLabel(carrier, trackingNumber) {
    try {
      if (this.testMode) {
        // Mock PDF data - gerçek implementasyonda PDF buffer dönecek
        throw new ValidationError('Test modunda etiket indirme desteklenmiyor');
      }

      const token = await this.getAuthToken();
      
      const response = await axios.get(`${this.baseURL}/labels/${carrier}/${trackingNumber}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'arraybuffer'
      });

      return response.data;
    } catch (error) {
      logger.error('Download label failed:', error);
      throw new ValidationError('Kargo etiketi indirilemedi');
    }
  }

  /**
   * Kargo ücretlerini hesaplar
   */
  async calculateRates(rateData) {
    try {
      const { from, to, weight, dimensions, carrier } = rateData;

      if (this.testMode) {
        return [
          {
            carrier: 'aras',
            service: 'standard',
            cost: 25.00,
            estimatedDays: '2-3',
            currency: 'TRY'
          },
          {
            carrier: 'mng',
            service: 'standard',
            cost: 27.50,
            estimatedDays: '1-2',
            currency: 'TRY'
          }
        ];
      }

      const token = await this.getAuthToken();
      
      const payload = {
        origin: from,
        destination: to,
        package: {
          weight,
          dimensions
        }
      };

      if (carrier) {
        payload.carrier = carrier;
      }

      const response = await axios.post(`${this.baseURL}/rates`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      return response.data.rates;
    } catch (error) {
      logger.error('Calculate rates failed:', error);
      throw new ValidationError('Kargo ücretleri hesaplanamadı');
    }
  }

  /**
   * Sipariş için ücretsiz kargo kontrolü yapar
   */
  calculateShippingCost(subtotal) {
    const freeShippingLimit = FREE_SHIPPING_LIMIT || 200;
    const standardShippingCost = STANDARD_SHIPPING_COST || 25;
    
    return subtotal >= freeShippingLimit ? 0 : standardShippingCost;
  }

  /**
   * Kargo durumunu günceller (webhook için)
   */
  async updateShipmentStatus(trackingNumber, carrier, status, location) {
    try {
      // Tracking number ile siparişi bul
      const order = await Order.findOne({
        'tracking.trackingNumber': trackingNumber,
        'tracking.carrier': carrier
      });

      if (!order) {
        logger.warn(`Order not found for tracking: ${trackingNumber}`);
        return;
      }

      // Sipariş durumunu güncelle
      const updateData = {
        'tracking.status': status,
        'tracking.updatedAt': new Date()
      };

      // Eğer teslim edildiyse
      if (status === 'delivered') {
        updateData['tracking.actualDelivery'] = new Date();
        updateData['status'] = 'delivered';
      }

      await Order.findByIdAndUpdate(order._id, updateData);

      logger.info(`Shipment status updated: ${trackingNumber} -> ${status}`);
    } catch (error) {
      logger.error('Update shipment status failed:', error);
      throw error;
    }
  }
}

// Singleton instance
let shippingServiceInstance = null;

function getShippingService() {
  if (!shippingServiceInstance) {
    shippingServiceInstance = new ShippingService();
  }
  return shippingServiceInstance;
}

module.exports = getShippingService(); 
module.exports = new ShippingService(); 