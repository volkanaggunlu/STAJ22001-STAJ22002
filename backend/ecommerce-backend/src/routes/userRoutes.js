const express = require('express');
const {
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
  bulkRemoveFromFavorites,
  clearAllFavorites,
  getOrders,
  getStatistics,
  getInvoiceAddresses,
  addInvoiceAddress,
  updateInvoiceAddress,
  deleteInvoiceAddress
} = require('../controllers/userController');

const { auth, } = require('../middleware/auth');
const { 
  validateProfileUpdate,
  validateChangePassword
} = require('../validations/authValidation');
const { 
  validateAddress,
  validateInvoiceAddress
} = require('../validations/userValidation');
const { apiLimiter } = require('../middleware/rateLimiter');

const logger = require('../logger/logger');
const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Apply rate limiting to all routes
router.use(apiLimiter);

// Profile Management Routes

/**
 * @route   GET /api/users/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', getProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', validateProfileUpdate, updateProfile);

/**
 * @route   POST /api/users/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password', validateChangePassword, changePassword);

// Address Management Routes

/**
 * @route   GET /api/users/addresses
 * @desc    Get user addresses
 * @access  Private
 */
router.get('/addresses', getAddresses);

/**
 * @route   POST /api/users/addresses
 * @desc    Add new address
 * @access  Private
 */
router.post('/addresses', validateAddress, addAddress);

/**
 * @route   PUT /api/users/addresses/:id
 * @desc    Update address
 * @access  Private
 */
router.put('/addresses/:id', validateAddress, updateAddress);

/**
 * @route   DELETE /api/users/addresses/:id
 * @desc    Delete address
 * @access  Private
 */
router.delete('/addresses/:id', deleteAddress);

/**
 * @route   PUT /api/users/addresses/:id/default
 * @desc    Set default address
 * @access  Private
 */
router.put('/addresses/:id/default', setDefaultAddress);

// Invoice Address Management Routes

/**
 * @route   GET /api/users/invoice-addresses
 * @desc    Get user invoice addresses
 * @access  Private
 */
router.get('/invoice-addresses', getInvoiceAddresses);

/**
 * @route   POST /api/users/invoice-addresses
 * @desc    Add new invoice address
 * @access  Private
 */
router.post('/invoice-addresses', validateInvoiceAddress, addInvoiceAddress);

/**
 * @route   PUT /api/users/invoice-addresses/:id
 * @desc    Update invoice address
 * @access  Private
 */
router.put('/invoice-addresses/:id', validateInvoiceAddress, updateInvoiceAddress);

/**
 * @route   DELETE /api/users/invoice-addresses/:id
 * @desc    Delete invoice address
 * @access  Private
 */
router.delete('/invoice-addresses/:id', deleteInvoiceAddress);

// Favorites Management Routes

/**
 * @route   GET /api/users/favorites
 * @desc    Get user favorites
 * @access  Private
 */
router.get('/favorites', auth , getFavorites);

/**
 * @route   POST /api/users/favorites/:productId
 * @desc    Add product to favorites
 * @access  Private
 */
router.post('/favorites/:productId', addToFavorites);

/**
 * @route   DELETE /api/users/favorites
 * @desc    Clear all favorites
 * @access  Private
 */
router.delete('/favorites', clearAllFavorites);

/**
 * @route   DELETE /api/users/favorites/:productId
 * @desc    Remove product from favorites
 * @access  Private
 */
router.delete('/favorites/:productId', removeFromFavorites);



// Orders and Statistics Routes

/**
 * @route   GET /api/users/orders
 * @desc    Get user orders
 * @access  Private
 */
router.get('/orders', getOrders);

/**
 * @route   GET /api/users/statistics
 * @desc    Get user statistics
 * @access  Private
 */
router.get('/statistics', getStatistics);

logger.info('User routes enabled');

module.exports = router; 