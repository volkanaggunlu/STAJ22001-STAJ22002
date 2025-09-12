const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

// Ürün arama ve filtreleme
router.get('/products', searchController.searchProducts);

// Filtre seçeneklerini getir
router.get('/filters', searchController.getFilterOptions);

module.exports = router; 