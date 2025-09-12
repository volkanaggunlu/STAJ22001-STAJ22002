const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const logger = require('../logger/logger');

/**
 * Satış istatistiklerini hesapla
 * @param {Date} startDate - Başlangıç tarihi
 * @param {Date} endDate - Bitiş tarihi
 */
const calculateSalesStats = async (startDate, endDate) => {
  try {
    const stats = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: endDate
          },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 },
          averageOrderValue: { $avg: '$totalAmount' }
        }
      }
    ]);

    return stats[0] || {
      totalSales: 0,
      totalOrders: 0,
      averageOrderValue: 0
    };
  } catch (error) {
    logger.error('Calculate sales stats error:', error);
    throw error;
  }
};

/**
 * Günlük satış grafiği için veri hesapla
 * @param {Date} startDate - Başlangıç tarihi
 * @param {Date} endDate - Bitiş tarihi
 */
const calculateDailySales = async (startDate, endDate) => {
  try {
    const dailySales = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: endDate
          },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          sales: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    return dailySales;
  } catch (error) {
    logger.error('Calculate daily sales error:', error);
    throw error;
  }
};

/**
 * En çok satan ürünleri hesapla
 * @param {Date} startDate - Başlangıç tarihi
 * @param {Date} endDate - Bitiş tarihi
 * @param {number} limit - Kaç ürün getirileceği
 */
const calculateTopProducts = async (startDate, endDate, limit = 10) => {
  try {
    const topProducts = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: endDate
          },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $unwind: '$items'
      },
      {
        $group: {
          _id: '$items.product',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      {
        $sort: { totalQuantity: -1 }
      },
      {
        $limit: limit
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $unwind: '$product'
      },
      {
        $project: {
          _id: 1,
          name: '$product.name',
          totalQuantity: 1,
          totalRevenue: 1,
          price: '$product.price',
          stock: '$product.stock'
        }
      }
    ]);

    return topProducts;
  } catch (error) {
    logger.error('Calculate top products error:', error);
    throw error;
  }
};

/**
 * Kullanıcı istatistiklerini hesapla
 * @param {Date} startDate - Başlangıç tarihi
 * @param {Date} endDate - Bitiş tarihi
 */
const calculateUserStats = async (startDate, endDate) => {
  try {
    const stats = await User.aggregate([
      {
        $facet: {
          totalUsers: [
            { $count: 'count' }
          ],
          newUsers: [
            {
              $match: {
                createdAt: {
                  $gte: startDate,
                  $lte: endDate
                }
              }
            },
            { $count: 'count' }
          ],
          activeUsers: [
            {
              $lookup: {
                from: 'orders',
                localField: '_id',
                foreignField: 'user',
                as: 'orders'
              }
            },
            {
              $match: {
                'orders.createdAt': {
                  $gte: startDate,
                  $lte: endDate
                }
              }
            },
            { $count: 'count' }
          ]
        }
      }
    ]);

    return {
      totalUsers: stats[0].totalUsers[0]?.count || 0,
      newUsers: stats[0].newUsers[0]?.count || 0,
      activeUsers: stats[0].activeUsers[0]?.count || 0
    };
  } catch (error) {
    logger.error('Calculate user stats error:', error);
    throw error;
  }
};

/**
 * Stok durumu istatistiklerini hesapla
 */
const calculateInventoryStats = async () => {
  try {
    const stats = await Product.aggregate([
      {
        $facet: {
          totalProducts: [
            { $count: 'count' }
          ],
          lowStock: [
            {
              $match: {
                stock: { $gt: 0, $lt: 10 }
              }
            },
            { $count: 'count' }
          ],
          outOfStock: [
            {
              $match: {
                stock: 0
              }
            },
            { $count: 'count' }
          ]
        }
      }
    ]);

    return {
      totalProducts: stats[0].totalProducts[0]?.count || 0,
      lowStock: stats[0].lowStock[0]?.count || 0,
      outOfStock: stats[0].outOfStock[0]?.count || 0
    };
  } catch (error) {
    logger.error('Calculate inventory stats error:', error);
    throw error;
  }
};

module.exports = {
  calculateSalesStats,
  calculateDailySales,
  calculateTopProducts,
  calculateUserStats,
  calculateInventoryStats
}; 