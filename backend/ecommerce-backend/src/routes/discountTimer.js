// src/routes/auth.js
const express = require('express');

const { addEndLastDiscount, getDiscountTimer } = require('../controllers/discountTimer');

const logger = require('../logger/logger');

const router = express.Router();

router.get('/addEndLastDiscount', addEndLastDiscount);
router.get('/get', getDiscountTimer);

logger.info('DiscountTimer routes enabled');

module.exports = router;
