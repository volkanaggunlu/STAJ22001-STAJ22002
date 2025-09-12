const express = require('express');
const logger = require('../logger/logger')
const { createOrder, receivePaytrNotification, receiveBasitKargoNotification, updateOrderStatus, getOrderByMerchantOid, getOrdersByDate, repeatOrder, downloadInvoice, getOrderById } = require('../controllers/order')
const { auth, admin } = require('../middleware/auth')
const { getPagedOrders } = require('../controllers/order')

const router = express.Router();

router.post('/', auth, createOrder);
router.post('/paytr-notification', receivePaytrNotification);
router.post('/basitkargo', receiveBasitKargoNotification);
router.get('/', auth, admin, getPagedOrders)
router.get('/:orderId', auth, getOrderById); // Sipariş detayı endpoint'i
router.post('/update-status', auth, admin, updateOrderStatus);
router.get('/get/:merchant_oid', auth, getOrderByMerchantOid)
router.get('/get-by-date', auth, admin, getOrdersByDate)
router.post('/:orderId/repeat', auth, repeatOrder);
router.get('/:orderId/invoice', auth, downloadInvoice);

logger.info('Order routes enabled');

module.exports = router;