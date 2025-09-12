const Product = require('../models/Product');
const logger = require('../logger/logger');

class SearchService {
  async searchProducts({
    query = '',
    category,
    brand,
    minPrice,
    maxPrice,
    inStock,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 12
  }) {
    try {
      const filter = {};

      // Metin araması
      if (query) {
        filter.$text = { $search: query };
      }

      // Kategori filtresi
      if (category) {
        filter.category = category;
      }

      // Marka filtresi
      if (brand) {
        filter.brand = brand;
      }

      // Fiyat aralığı
      if (minPrice !== undefined || maxPrice !== undefined) {
        filter.price = {};
        if (minPrice !== undefined) filter.price.$gte = minPrice;
        if (maxPrice !== undefined) filter.price.$lte = maxPrice;
      }

      // Stok durumu
      if (inStock !== undefined) {
        filter['stock.quantity'] = inStock ? { $gt: 0 } : 0;
      }

      // Sadece aktif ürünleri göster
      filter.status = 'active';

      // Sıralama ayarları
      const sort = {};
      if (query && sortBy === 'relevance') {
        sort.score = { $meta: 'textScore' };
      } else {
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
      }

      // Sayfalama
      const skip = (page - 1) * limit;

      // Ana sorgu
      const products = await Product.find(filter)
        .select('-specifications -features -bundleItems')
        .sort(sort)
        .skip(skip)
        .limit(limit);

      // Toplam ürün sayısı
      const total = await Product.countDocuments(filter);

      // Mevcut filtrelere göre kategori ve marka dağılımı
      const [categories, brands] = await Promise.all([
        Product.distinct('category', filter),
        Product.distinct('brand', filter)
      ]);

      // Fiyat aralığı
      const priceRange = await Product.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            min: { $min: '$price' },
            max: { $max: '$price' }
          }
        }
      ]);

      return {
        products,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        filters: {
          categories,
          brands,
          priceRange: priceRange[0] || { min: 0, max: 0 }
        }
      };
    } catch (error) {
      logger.error('Search products error:', error);
      throw error;
    }
  }

  async getFilterOptions() {
    try {
      const [categories, brands] = await Promise.all([
        Product.distinct('category', { status: 'active' }),
        Product.distinct('brand', { status: 'active' })
      ]);

      const priceRange = await Product.aggregate([
        { $match: { status: 'active' } },
        {
          $group: {
            _id: null,
            min: { $min: '$price' },
            max: { $max: '$price' }
          }
        }
      ]);

      return {
        categories,
        brands,
        priceRange: priceRange[0] || { min: 0, max: 0 }
      };
    } catch (error) {
      logger.error('Get filter options error:', error);
      throw error;
    }
  }
}

module.exports = new SearchService(); 