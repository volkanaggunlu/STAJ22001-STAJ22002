const axios = require('axios');

const { KOLAYBI_CHANNEL } = require('../../config/environment');
const { getToken } = require('./getToken');
const { API_URL } = require('./constants');

const { KDV } = require('../../config/environment')

const logger = require('../../logger/logger')

const MAX_RETRIES = 4;

/**
 * Creates products for billing based on order cart
 * 
 * @param {Object} order - Order information containing cart products
 * @returns {Promise<Array>} Array of created product responses
 */
const createProduct = async (product) => {
  try {
    const token = await getToken();

    // Create all products in parallel
    const _product = await makeProductRequest(product, token)

    logger.debug('_product:', _product)

    return _product
  } catch (error) {
    if (error.response) {
      console.error('Error creating products:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
    throw error;
  }
};

const createFormData = (product) => {
  logger.debug('kolaybi createProduct createFormData Product: ' + JSON.stringify(product))
  const formData = new FormData();
  if (product.slug !== 'kargo' && product.categories.some(category => category.category === 'setler')) {
    formData.append('code', product.slug + '-orgu-ipi-seti-site');
  } else {
    formData.append('code', product.slug + '-site');
  }

  if (product.slug === 'kargo' || product.slug === 'hediye-paketi' || product.slug === 'kedi-otu') {
    formData.append('name', product.name);
    formData.append('VAT', product.vat ?? 20)
  } else {
    if (product.categories.some((category) => category.category === "hazir-amigurumi")) {
      formData.append('name', product.name + ' Peluş');
      formData.append('VAT', product.vat ?? 20) // FIXED KDV/VAT - FIXED KDV VAT - FIXED VAT - FIXED VAT/KDV, AS PELUŞ OYUNCAK/PELUS OYUNCAK
    } else {
      formData.append('name', product.name + ' Örgü İpi Seti');
      formData.append('VAT', product.vat ?? Number(KDV))
    }
  }

  formData.append('price', product.discountedPrice ? Number(product.discountedPrice).toFixed(2) : Number(product.price)?.toFixed(2))
  formData.append('type', 'good')
  formData.append('tags[0]', '252349')
  formData.append('discountType', 'numeric')
  return formData;
};

const makeProductRequest = async (product, token, attempt = 1) => {
  const formData = createFormData(product)

  try {
    const response = await axios({
      method: 'post',
      url: `${API_URL}/products`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Channel': KOLAYBI_CHANNEL,
        'Content-Type': "multipart/form-data"
      },
      data: formData
    });

    return response.data.data;
  } catch (error) {
    if (error.response?.status === 401 && attempt < MAX_RETRIES) {
      const newToken = await getToken(true); // Force token refresh
      return makeProductRequest(product, newToken, attempt + 1);
    }
    throw error;
  }
};

module.exports = { createProduct };