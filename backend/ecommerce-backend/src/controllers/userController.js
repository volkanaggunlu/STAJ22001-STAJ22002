const userService = require('../services/userService');
const authService = require('../services/authService');
const logger = require('../logger/logger');

/**
 * Get user profile
 * GET /api/users/profile
 */
const getProfile = async (req, res, next) => {
  try {
    logger.verbose('Entering getProfile controller');
    
    const user = await authService.getProfile(req.user._id);
    
    logger.info(`Profile retrieved successfully: ${req.user._id}`);
    
    res.status(200).json({
      success: true,
      message: 'Profil başarıyla getirildi',
      data: {
        user
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get profile failed:', error);
    next(error);
  }
};

/**
 * Update user profile
 * PUT /api/users/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    logger.verbose('Entering updateProfile controller');
    
    const updatedUser = await authService.updateProfile(req.user._id, req.body);
    
    logger.info(`Profile updated successfully: ${req.user._id}`);
    
    res.status(200).json({
      success: true,
      message: 'Profil başarıyla güncellendi',
      data: {
        user: updatedUser
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Profile update failed:', error);
    next(error);
  }
};

/**
 * Change password
 * POST /api/users/change-password
 */
const changePassword = async (req, res, next) => {
  try {
    logger.verbose('Entering changePassword controller');
    
    const { currentPassword, newPassword } = req.body;
    const result = await authService.changePassword(req.user._id, currentPassword, newPassword);
    
    logger.info(`Password changed successfully: ${req.user._id}`);
    
    res.status(200).json({
      success: true,
      message: result.message,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Password change failed:', error);
    next(error);
  }
};

/**
 * Get user addresses
 * GET /api/users/addresses
 */
const getAddresses = async (req, res, next) => {
  try {
    logger.verbose('Entering getAddresses controller');
    const user = await userService.getUserById(req.user._id);
    const addresses = user && user.addresses ? user.addresses : [];
    res.status(200).json({
      success: true,
      data: { addresses },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get addresses failed:', error);
    res.status(200).json({
      success: true,
      data: { addresses: [] },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Add new address
 * POST /api/users/addresses
 */
const addAddress = async (req, res, next) => {
  try {
    logger.verbose('Entering addAddress controller');
    
    const address = await userService.addAddress(req.user._id, req.body);
    
    logger.info(`Address added successfully: ${req.user._id}`);
    
    res.status(201).json({
      success: true,
      message: 'Adres başarıyla eklendi',
      data: {
        address
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Add address failed:', error);
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Update address
 * PUT /api/users/addresses/:id
 */
const updateAddress = async (req, res, next) => {
  try {
    logger.verbose('Entering updateAddress controller');
    
    const addressId = req.params.id;
    const address = await userService.updateAddress(req.user._id, addressId, req.body);
    
    logger.info(`Address updated successfully: ${req.user._id}`);
    
    res.status(200).json({
      success: true,
      message: 'Adres başarıyla güncellendi',
      data: {
        address
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Update address failed:', error);
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Delete address
 * DELETE /api/users/addresses/:id
 */
const deleteAddress = async (req, res, next) => {
  try {
    logger.verbose('Entering deleteAddress controller');
    
    const addressId = req.params.id;
    await userService.deleteAddress(req.user._id, addressId);
    
    logger.info(`Address deleted successfully: ${req.user._id}`);
    
    res.status(200).json({
      success: true,
      message: 'Adres başarıyla silindi',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Delete address failed:', error);
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Set default address
 * PUT /api/users/addresses/:id/default
 */
const setDefaultAddress = async (req, res, next) => {
  try {
    logger.verbose('Entering setDefaultAddress controller');
    
    const addressId = req.params.id;
    const address = await userService.setDefaultAddress(req.user._id, addressId);
    
    logger.info(`Default address set successfully: ${req.user._id}`);
    
    res.status(200).json({
      success: true,
      message: 'Varsayılan adres başarıyla ayarlandı',
      data: {
        address
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Set default address failed:', error);
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get user favorites
 * GET /api/users/favorites
 */
const getFavorites = async (req, res, next) => {
  try {
    logger.verbose('Entering getFavorites controller');
    
    const { page = 1, limit = 20 } = req.query;
    const favorites = await userService.getFavorites(req.user._id, { page, limit });
    
    logger.info(`Favorites retrieved successfully: ${req.user._id}`);
    
    res.status(200).json({
      success: true,
      message: 'Favori ürünler başarıyla getirildi',
      data: {
        favorites: favorites.products,
        pagination: favorites.pagination
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get favorites failed:', error);
    next(error);
  }
};

/**
 * Add product to favorites
 * POST /api/users/favorites/:productId
 */
const addToFavorites = async (req, res, next) => {
  try {
    logger.verbose('Entering addToFavorites controller');
    
    const productId = req.params.productId;
    await userService.addToFavorites(req.user._id, productId);
    
    logger.info(`Product added to favorites: ${req.user._id}, ${productId}`);
    
    res.status(200).json({
      success: true,
      message: 'Ürün favorilere eklendi',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Add to favorites failed:', error);
    next(error);
  }
};

/**
 * Remove product from favorites
 * DELETE /api/users/favorites/:productId
 */
const removeFromFavorites = async (req, res, next) => {
  try {
    logger.verbose('Entering removeFromFavorites controller');
    
    const productId = req.params.productId;
    await userService.removeFromFavorites(req.user._id, productId);
    
    logger.info(`Product removed from favorites: ${req.user._id}, ${productId}`);
    
    res.status(200).json({
      success: true,
      message: 'Ürün favorilerden çıkarıldı',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Remove from favorites failed:', error);
    next(error);
  }
};

/**
 * Clear all favorites for user
 * DELETE /api/users/favorites
 */
const clearAllFavorites = async (req, res, next) => {
  try {
    logger.verbose('Entering clearAllFavorites controller');
    
    const result = await userService.clearAllFavorites(req.user.id || req.user._id);
    
    logger.info(`All favorites cleared: ${req.user.id || req.user._id}, removed: ${result.removedCount}`);
    
    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        removedCount: result.removedCount
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Clear all favorites failed:', error);
    next(error);
  }
};

/**
 * Get user orders
 * GET /api/users/orders
 */
const getOrders = async (req, res, next) => {
  try {
    logger.verbose('Entering getOrders controller');
    
    const { page = 1, limit = 10, status } = req.query;
    const orders = await userService.getOrders(req.user._id, { page, limit, status });
    
    logger.info(`Orders retrieved successfully: ${req.user._id}`);
    
    res.status(200).json({
      success: true,
      message: 'Siparişler başarıyla getirildi',
      data: {
        orders: orders.orders,
        pagination: orders.pagination
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get orders failed:', error);
    next(error);
  }
};

/**
 * Get user statistics
 * GET /api/users/statistics
 */
const getStatistics = async (req, res, next) => {
  try {
    logger.verbose('Entering getStatistics controller');
    
    const statistics = await userService.getStatistics(req.user._id);
    
    logger.info(`Statistics retrieved successfully: ${req.user._id}`);
    
    res.status(200).json({
      success: true,
      message: 'İstatistikler başarıyla getirildi',
      data: {
        statistics
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get statistics failed:', error);
    next(error);
  }
};

/**
 * Get user invoice addresses
 * GET /api/users/invoice-addresses
 */
const getInvoiceAddresses = async (req, res, next) => {
  try {
    logger.verbose('Entering getInvoiceAddresses controller');
    const user = await userService.getUserById(req.user._id);
    const invoiceAddresses = user && user.invoiceAddresses ? user.invoiceAddresses : [];
    res.status(200).json({
      success: true,
      data: { invoiceAddresses },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get invoice addresses failed:', error);
    res.status(200).json({
      success: true,
      data: { invoiceAddresses: [] },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Add invoice address
 * POST /api/users/invoice-addresses
 */
const addInvoiceAddress = async (req, res, next) => {
  try {
    logger.verbose('Entering addInvoiceAddress controller');
    
    const invoiceAddress = await userService.addInvoiceAddress(req.user._id, req.body);
    
    logger.info(`Invoice address added successfully: ${req.user._id}`);
    
    res.status(201).json({
      success: true,
      message: 'Fatura adresi başarıyla eklendi',
      data: { invoiceAddress },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Add invoice address failed:', error);
    next(error);
  }
};

/**
 * Update invoice address
 * PUT /api/users/invoice-addresses/:id
 */
const updateInvoiceAddress = async (req, res, next) => {
  try {
    logger.verbose('Entering updateInvoiceAddress controller');
    
    const { id } = req.params;
    const invoiceAddress = await userService.updateInvoiceAddress(req.user._id, id, req.body);
    
    logger.info(`Invoice address updated successfully: ${req.user._id}`);
    
    res.status(200).json({
      success: true,
      message: 'Fatura adresi başarıyla güncellendi',
      data: { invoiceAddress },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Update invoice address failed:', error);
    next(error);
  }
};

/**
 * Delete invoice address
 * DELETE /api/users/invoice-addresses/:id
 */
const deleteInvoiceAddress = async (req, res, next) => {
  try {
    logger.verbose('Entering deleteInvoiceAddress controller');
    
    const { id } = req.params;
    await userService.deleteInvoiceAddress(req.user._id, id);
    
    logger.info(`Invoice address deleted successfully: ${req.user._id}`);
    
    res.status(200).json({
      success: true,
      message: 'Fatura adresi başarıyla silindi',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Delete invoice address failed:', error);
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getFavorites,
  addToFavorites,
  removeFromFavorites,
  clearAllFavorites,
  getOrders,
  getStatistics,
  getInvoiceAddresses,
  addInvoiceAddress,
  updateInvoiceAddress,
  deleteInvoiceAddress
}; 