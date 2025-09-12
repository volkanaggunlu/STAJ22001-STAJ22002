const crypto = require('crypto');
const logger = require('../logger/logger');

/**
 * PayTR Configuration
 */
const PAYTR_CONFIG = {
  merchantId: process.env.PAYTR_MERCHANT_ID,
  merchantKey: process.env.PAYTR_MERCHANT_KEY,
  merchantSalt: process.env.PAYTR_MERCHANT_SALT,
  testMode: process.env.PAYTR_TEST_MODE === 'true',
  timeout: process.env.PAYTR_TIMEOUT_LIMIT || 30,
  maxInstallment: process.env.PAYTR_MAX_INSTALLMENT || 12,
  baseUrl: process.env.PAYTR_TEST_MODE === 'true' 
    ? 'https://www.paytr.com/odeme/test' 
    : 'https://www.paytr.com/odeme',
  apiUrl: process.env.PAYTR_TEST_MODE === 'true'
    ? 'https://www.paytr.com/odeme/api/test'
    : 'https://www.paytr.com/odeme/api',
  currency: 'TL',
  lang: 'tr'
};

/**
 * PayTR Error Codes
 */
const PAYTR_ERROR_CODES = {
  'INVALID_REQUEST': 'Geçersiz istek',
  'INVALID_MERCHANT': 'Geçersiz mağaza bilgisi',
  'INVALID_AMOUNT': 'Geçersiz tutar',
  'INVALID_CURRENCY': 'Geçersiz para birimi',
  'INVALID_INSTALLMENT': 'Geçersiz taksit sayısı',
  'INVALID_HASH': 'Geçersiz hash değeri',
  'EXPIRED_REQUEST': 'İstek süresi dolmuş',
  'PAYMENT_FAILED': 'Ödeme başarısız',
  'INSUFFICIENT_FUNDS': 'Yetersiz bakiye',
  'CARD_BLOCKED': 'Kart bloke',
  'GENERAL_ERROR': 'Genel hata'
};

/**
 * PayTR Payment Status Codes
 */
const PAYTR_STATUS_CODES = {
  'success': 'Ödeme başarılı',
  'failed': 'Ödeme başarısız',
  'waiting': 'Ödeme bekleniyor',
  'cancelled': 'Ödeme iptal edildi',
  'expired': 'Ödeme süresi doldu',
  'refunded': 'İade edildi',
  'partial_refunded': 'Kısmi iade edildi'
};

/**
 * Generate PayTR Hash
 * @param {Object} data - Data to hash
 * @returns {string} Hash string
 */
const generatePayTRHash = (data) => {
  try {
    const {
      merchantId,
      userIp,
      merchantOid,
      email,
      paymentAmount,
      paymentType,
      installmentCount,
      currency,
      testMode,
      noInstallment,
      maxInstallment,
      userBasket,
      userAddress,
      merchantKey,
      merchantSalt
    } = data;

    const hashString = `${merchantId}${userIp}${merchantOid}${email}${paymentAmount}${paymentType}${installmentCount}${currency}${testMode}${noInstallment}${maxInstallment}${userBasket}${userAddress}${merchantKey}${merchantSalt}`;
    
    const hash = crypto.createHash('sha256').update(hashString).digest('base64');
    
    logger.info(`PayTR hash generated for order: ${merchantOid}`);
    return hash;
  } catch (error) {
    logger.error('PayTR hash generation failed:', error);
    throw new Error('Hash oluşturma hatası');
  }
};

/**
 * Verify PayTR Callback Hash
 * @param {Object} data - Callback data
 * @returns {boolean} Hash is valid
 */
const verifyPayTRCallback = (data) => {
  try {
    const {
      merchantOid,
      status,
      totalAmount,
      hash,
      merchantSalt
    } = data;

    const expectedHash = crypto.createHash('sha256')
      .update(`${merchantOid}${merchantSalt}${status}${totalAmount}`)
      .digest('base64');

    const isValid = hash === expectedHash;
    
    if (isValid) {
      logger.info(`PayTR callback hash verified for order: ${merchantOid}`);
    } else {
      logger.error(`PayTR callback hash verification failed for order: ${merchantOid}`);
    }
    
    return isValid;
  } catch (error) {
    logger.error('PayTR callback verification failed:', error);
    return false;
  }
};

/**
 * Generate PayTR Iframe Token
 * @param {Object} orderData - Order data
 * @returns {Object} PayTR iframe data
 */
const generatePayTRIframe = (orderData) => {
  try {
    const {
      orderId,
      userIp,
      email,
      amount,
      userBasket,
      userAddress,
      installmentCount = 0,
      currency = 'TL'
    } = orderData;

    const merchantOid = `ORDER_${orderId}_${Date.now()}`;
    const paymentAmount = Math.round(amount * 100); // PayTR kuruş cinsinden bekler

    const iframeData = {
      merchant_id: PAYTR_CONFIG.merchantId,
      user_ip: userIp,
      merchant_oid: merchantOid,
      email: email,
      payment_amount: paymentAmount,
      payment_type: 'card',
      installment_count: installmentCount,
      currency: currency,
      test_mode: PAYTR_CONFIG.testMode ? 1 : 0,
      no_installment: installmentCount === 0 ? 1 : 0,
      max_installment: PAYTR_CONFIG.maxInstallment,
      user_basket: userBasket,
      user_address: userAddress,
      merchant_ok_url: `${process.env.FRONTEND_URL}/payment/success`,
      merchant_fail_url: `${process.env.FRONTEND_URL}/payment/failure`,
      timeout_limit: PAYTR_CONFIG.timeout,
      debug_on: PAYTR_CONFIG.testMode ? 1 : 0,
      lang: PAYTR_CONFIG.lang
    };

    // Hash oluştur
    const hashData = {
      ...iframeData,
      merchantKey: PAYTR_CONFIG.merchantKey,
      merchantSalt: PAYTR_CONFIG.merchantSalt
    };

    iframeData.paytr_token = generatePayTRHash(hashData);

    logger.info(`PayTR iframe generated for order: ${orderId}`);
    
    return {
      iframeData,
      merchantOid,
      iframeUrl: PAYTR_CONFIG.baseUrl
    };
  } catch (error) {
    logger.error('PayTR iframe generation failed:', error);
    throw new Error('PayTR iframe oluşturma hatası');
  }
};

/**
 * Create PayTR User Basket String
 * @param {Array} items - Cart items
 * @returns {string} User basket string
 */
const createUserBasket = (items) => {
  try {
    const basketItems = items.map(item => [
      item.name,
      item.price.toFixed(2),
      item.quantity
    ]);

    return JSON.stringify(basketItems);
  } catch (error) {
    logger.error('PayTR user basket creation failed:', error);
    throw new Error('Sepet verisi oluşturma hatası');
  }
};

/**
 * Create PayTR User Address String
 * @param {Object} address - User address
 * @returns {string} User address string
 */
const createUserAddress = (address) => {
  try {
    const addressString = `${address.firstName} ${address.lastName}|${address.address}|${address.city}|${address.district}|${address.country}|${address.phone}`;
    
    return addressString;
  } catch (error) {
    logger.error('PayTR user address creation failed:', error);
    throw new Error('Adres verisi oluşturma hatası');
  }
};

/**
 * Get PayTR Error Message
 * @param {string} errorCode - Error code
 * @returns {string} Error message
 */
const getPayTRErrorMessage = (errorCode) => {
  return PAYTR_ERROR_CODES[errorCode] || 'Bilinmeyen hata';
};

/**
 * Get PayTR Status Message
 * @param {string} statusCode - Status code
 * @returns {string} Status message
 */
const getPayTRStatusMessage = (statusCode) => {
  return PAYTR_STATUS_CODES[statusCode] || 'Bilinmeyen durum';
};

/**
 * Validate PayTR Configuration
 * @returns {boolean} Configuration is valid
 */
const validatePayTRConfig = () => {
  const requiredFields = ['merchantId', 'merchantKey', 'merchantSalt'];
  
  for (const field of requiredFields) {
    if (!PAYTR_CONFIG[field]) {
      logger.error(`PayTR configuration error: ${field} is required`);
      return false;
    }
  }
  
  return true;
};

module.exports = {
  PAYTR_CONFIG,
  PAYTR_ERROR_CODES,
  PAYTR_STATUS_CODES,
  generatePayTRHash,
  verifyPayTRCallback,
  generatePayTRIframe,
  createUserBasket,
  createUserAddress,
  getPayTRErrorMessage,
  getPayTRStatusMessage,
  validatePayTRConfig
}; 