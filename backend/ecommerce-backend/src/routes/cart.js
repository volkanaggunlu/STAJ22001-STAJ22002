const express = require('express');
const { auth } = require('../middleware/auth.js');
const { getOrCreateCart, addToCart, removeFromCart, removeMultipleFromCart, updateQuantity, clearCart, getCartById } = require('../controllers/cart.js');

const logger = require('../logger/logger');

const router = express.Router();


// Route to get the cart
router.get('/', auth, getOrCreateCart);

// Route to add a product to the cart
router.post('/', auth, addToCart);

// Route to bulk remove products from the cart
router.delete('/bulk', auth, removeMultipleFromCart);

// Route to remove a product from the cart
router.delete('/:productId', auth, removeFromCart);

// Route to update the quantity of a product in the cart
router.put('/:productId', auth, updateQuantity);

// Route to clear the cart
router.delete('/', auth, clearCart);

// Route to get a cart by id
router.get('/:id', auth, getCartById);

logger.info('Product routes enabled');

module.exports = router;