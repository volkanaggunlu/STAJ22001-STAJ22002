const searchService = require('../services/searchService');
const { validateSearchQuery } = require('../validations/searchValidation');
const logger = require('../logger/logger');

/**
 * Ürün arama ve filtreleme
 */
const searchProducts = async (req, res) => {
  try {
    const {
      q: query,
      category,
      brand,
      minPrice,
      maxPrice,
      inStock,
      sortBy,
      sortOrder,
      page,
      limit
    } = req.query;

    // Validasyon
    const validationError = validateSearchQuery(req.query);
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: validationError
      });
    }

    const result = await searchService.searchProducts({
      query,
      category,
      brand,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      inStock: inStock === 'true',
      sortBy,
      sortOrder,
      page: Number(page) || 1,
      limit: Number(limit) || 12
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Search products error:', error);
    res.status(500).json({
      success: false,
      error: 'Arama işlemi sırasında bir hata oluştu'
    });
  }
};

/**
 * Filtre seçeneklerini getir
 */
const getFilterOptions = async (req, res) => {
  try {
    const options = await searchService.getFilterOptions();
    
    res.json({
      success: true,
      data: options
    });
  } catch (error) {
    logger.error('Get filter options error:', error);
    res.status(500).json({
      success: false,
      error: 'Filtre seçenekleri alınırken bir hata oluştu'
    });
  }
};

module.exports = {
  searchProducts,
  getFilterOptions
}; 