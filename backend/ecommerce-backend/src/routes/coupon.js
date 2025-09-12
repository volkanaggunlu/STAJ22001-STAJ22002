const express = require('express');
const { auth, admin } = require('../middleware/auth.js');
const { createCoupon, applyCoupon } = require('../controllers/coupon.js');
const logger = require('../logger/logger');

const router = express.Router();

// createCoupon creates a new coupon in the database
router.post('/', auth, admin, createCoupon);

// applyCoupon calculates the discounted total of the cart and sends it back to the client
router.post('/apply', auth, applyCoupon);

logger.info('Coupon routes enabled');

module.exports = router;