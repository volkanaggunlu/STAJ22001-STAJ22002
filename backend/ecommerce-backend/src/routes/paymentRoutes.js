const express = require('express');
const {
  initializePayTRPayment,
  handlePayTRCallback,
  getPaymentStatus,
  initializeBankTransferPayment,
  handleBankTransferNotification,
  uploadBankTransferReceipt,
  getBankAccounts,
  getPaymentMethods,
  getPaymentStatusById,
  processRefund
} = require('../controllers/paymentController');

const { auth, admin } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');
const {
  validatePayTRInit,
  validateBankTransferInit,
  validateBankTransferNotify,
  validateBankTransferReceipt,
  validateRefund,
  validateOrderIdParam,
  validatePaymentIdParam
} = require('../validations/paymentValidation');
const logger = require('../logger/logger');
const paytrIpWhitelist = require('../middleware/paytrIpWhitelist');

const router = express.Router();

// Apply rate limiting to all payment routes
router.use(apiLimiter);

// Public routes (no authentication required)

/**
 * @route   POST /api/payments/paytr/callback
 * @desc    Handle PayTR payment callback
 * @access  Public (PayTR webhook)
 */
router.post('/paytr/callback', paytrIpWhitelist, handlePayTRCallback);

/**
 * @route   GET /api/payments/methods
 * @desc    Get available payment methods
 * @access  Public
 */
router.get('/methods', getPaymentMethods);

/**
 * @route   GET /api/payments/bank-accounts
 * @desc    Get bank account information
 * @access  Public
 */
router.get('/bank-accounts', getBankAccounts);

// Protected routes (authentication required)

/**
 * @route   POST /api/payments/paytr/init
 * @desc    Initialize PayTR payment
 * @access  Private
 */
router.post('/paytr/init', auth, validatePayTRInit, initializePayTRPayment);

/**
 * @route   GET /api/payments/paytr/status/:orderId
 * @desc    Get PayTR payment status
 * @access  Private
 */
router.get('/paytr/status/:orderId', auth, validateOrderIdParam, getPaymentStatus);

/**
 * @route   POST /api/payments/bank-transfer/init
 * @desc    Initialize bank transfer payment
 * @access  Private
 */
router.post('/bank-transfer/init', auth, validateBankTransferInit, initializeBankTransferPayment);

/**
 * @route   POST /api/payments/bank-transfer/notify
 * @desc    Handle bank transfer notification
 * @access  Private
 */
router.post('/bank-transfer/notify', auth, validateBankTransferNotify, handleBankTransferNotification);

/**
 * @route   POST /api/payments/bank-transfer/upload
 * @desc    Upload bank transfer receipt
 * @access  Private
 */
router.post('/bank-transfer/upload', auth, validateBankTransferReceipt, uploadBankTransferReceipt);

/**
 * @route   GET /api/payments/:id/status
 * @desc    Get payment status by order ID
 * @access  Private
 */
router.get('/:id/status', auth, validatePaymentIdParam, getPaymentStatusById);

// Admin routes (admin authentication required)

/**
 * @route   POST /api/payments/:id/refund
 * @desc    Process refund for an order
 * @access  Admin
 */
router.post('/:id/refund', auth, admin, validatePaymentIdParam, validateRefund, processRefund);

logger.info('Payment routes enabled');

module.exports = router; 