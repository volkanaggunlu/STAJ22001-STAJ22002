const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Category = require('../models/Category');
const Review = require('../models/Review');
const logger = require('../logger/logger');
const analyticsService = require('../services/analyticsService');

/**
 * Dashboard verileri ve istatistikler
 */
const getDashboardStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Tüm istatistikleri paralel olarak hesapla
    const [
      salesStats,
      dailySales,
      topProducts,
      userStats,
      inventoryStats
    ] = await Promise.all([
      analyticsService.calculateSalesStats(start, end),
      analyticsService.calculateDailySales(start, end),
      analyticsService.calculateTopProducts(start, end, 5),
      analyticsService.calculateUserStats(start, end),
      analyticsService.calculateInventoryStats()
    ]);

    // Sipariş durumu dağılımı
    const orderStatusDistribution = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: start,
            $lte: end
          }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        salesStats,
        dailySales,
        topProducts,
        userStats,
        inventoryStats,
        orderStatusDistribution
      }
    });
  } catch (error) {
    logger.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Dashboard verilerini alırken bir hata oluştu'
    });
  }
};

/**
 * Dashboard için basit istatistikler
 */
const getDashboardQuickStats = async (req, res) => {
  try {
    const today = new Date();
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    // Bu ay ve geçen ay verilerini paralel al
    const [
      thisMonthStats,
      lastMonthStats,
      totalStats
    ] = await Promise.all([
      calculateMonthStats(thisMonth, today),
      calculateMonthStats(lastMonth, thisMonth),
      calculateTotalStats()
    ]);

    // Trend hesaplamaları
    const trends = {
      products: calculateTrend(thisMonthStats.products, lastMonthStats.products),
      users: calculateTrend(thisMonthStats.users, lastMonthStats.users),
      orders: calculateTrend(thisMonthStats.orders, lastMonthStats.orders),
      sales: calculateTrend(thisMonthStats.sales, lastMonthStats.sales),
      pageViews: calculateTrend(thisMonthStats.pageViews, lastMonthStats.pageViews),
      rating: calculateTrend(thisMonthStats.averageRating, lastMonthStats.averageRating)
    };

    res.json({
      success: true,
      data: {
        totalProducts: totalStats.totalProducts,
        totalUsers: totalStats.totalUsers,
        totalOrders: totalStats.totalOrders,
        monthlySales: thisMonthStats.sales,
        pageViews: totalStats.pageViews || 0,
        averageRating: totalStats.averageRating || 0,
        trends
      }
    });
  } catch (error) {
    logger.error('Dashboard quick stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Dashboard istatistikleri alınırken hata oluştu'
    });
  }
};

/**
 * Satış analitikleri
 */
const getSalesAnalytics = async (req, res) => {
  try {
    const { period = '6m' } = req.query;
    
    let startDate;
    const endDate = new Date();
    
    switch (period) {
      case '1m':
        startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 1, 1);
        break;
      case '3m':
        startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 3, 1);
        break;
      case '1y':
        startDate = new Date(endDate.getFullYear() - 1, endDate.getMonth(), 1);
        break;
      default: // 6m
        startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 6, 1);
    }

    const salesData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          sales: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
          customers: { $addToSet: '$userId' }
        }
      },
      {
        $addFields: {
          customers: { $size: '$customers' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Türkçe ay isimleri
    const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    
    const formattedData = salesData.map(item => ({
      month: monthNames[item._id.month - 1],
      sales: item.sales,
      orders: item.orders,
      customers: item.customers
    }));

    res.json({
      success: true,
      data: {
        salesData: formattedData
      }
    });
  } catch (error) {
    logger.error('Sales analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Satış analitikleri alınırken hata oluştu'
    });
  }
};

/**
 * Kategori dağılımı analitikleri
 */
const getCategoryAnalytics = async (req, res) => {
  try {
    const categoryStats = await Order.aggregate([
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $lookup: {
          from: 'categories',
          localField: 'product.category',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $group: {
          _id: '$category._id',
          categoryName: { $first: '$category.name' },
          sales: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { sales: -1 } }
    ]);

    const totalSales = categoryStats.reduce((sum, cat) => sum + cat.sales, 0);
    
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];
    
    const distribution = categoryStats.map((cat, index) => ({
      categoryName: cat.categoryName,
      percentage: Math.round((cat.sales / totalSales) * 100),
      sales: cat.sales,
      color: colors[index % colors.length]
    }));

    res.json({
      success: true,
      data: {
        distribution
      }
    });
  } catch (error) {
    logger.error('Category analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Kategori analitikleri alınırken hata oluştu'
    });
  }
};

/**
 * En çok satan ürünleri getir
 */
const getTopSellingProducts = async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const topProducts = await Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          salesCount: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          id: '$_id',
          name: '$product.name',
          salesCount: 1,
          revenue: 1,
          image: { $arrayElemAt: ['$product.images.url', 0] },
          trend: '+12%' // Statik, gerçek hesaplama için daha karmaşık sorgu gerekir
        }
      },
      { $sort: { salesCount: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json({
      success: true,
      data: {
        products: topProducts
      }
    });
  } catch (error) {
    logger.error('Top selling products error:', error);
    res.status(500).json({
      success: false,
      error: 'En çok satan ürünler alınırken hata oluştu'
    });
  }
};

// Yardımcı fonksiyonlar
const calculateMonthStats = async (startDate, endDate) => {
  const [products, users, orders, sales, pageViews, averageRating] = await Promise.all([
    Product.countDocuments({ createdAt: { $gte: startDate, $lt: endDate } }),
    User.countDocuments({ createdAt: { $gte: startDate, $lt: endDate } }),
    Order.countDocuments({ createdAt: { $gte: startDate, $lt: endDate } }),
    Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lt: endDate },
          status: { $ne: 'cancelled' }
        }
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]),
    // PageViews hesaplama - bu ay içinde oluşturulan ürünlerin view'ları
    // Not: Gerçek bir analytics sisteminde view log'ları tarih bazında tutulur
    // Şimdilik bu ürünlerin total view'ını alıyoruz
    Product.aggregate([
      {
        $match: { createdAt: { $gte: startDate, $lt: endDate } }
      },
      { $group: { _id: null, total: { $sum: '$stats.views' } } }
    ]),
    // AverageRating hesaplama - bu ay içindeki review'ların ortalaması
    Review.aggregate([
      {
        $match: { createdAt: { $gte: startDate, $lt: endDate } }
      },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ])
  ]);

  return {
    products,
    users,
    orders,
    sales: sales[0]?.total || 0,
    pageViews: pageViews[0]?.total || 0,
    averageRating: averageRating[0]?.avgRating || 0
  };
};

const calculateTotalStats = async () => {
  const [totalProducts, totalUsers, totalOrders, averageRating, pageViewsResult] = await Promise.all([
    Product.countDocuments({ status: 'active' }), // Sadece aktif ürünler
    User.countDocuments({ isActive: true }),
    Order.countDocuments(),
    Review.aggregate([
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]),
    // PageViews hesaplama - tüm ürünlerin views toplamı
    Product.aggregate([
      { $group: { _id: null, totalViews: { $sum: '$stats.views' } } }
    ])
  ]);

  return {
    totalProducts,
    totalUsers,
    totalOrders,
    averageRating: averageRating[0]?.avgRating || 0,
    pageViews: pageViewsResult[0]?.totalViews || 0
  };
};

const calculateTrend = (current, previous) => {
  if (previous === 0) return current > 0 ? '+100%' : '0%';
  const change = ((current - previous) / previous) * 100;
  return change >= 0 ? `+${Math.round(change)}%` : `${Math.round(change)}%`;
};

/**
 * Admin için sipariş detayını getir
 */
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate('userId', 'firstName lastName email phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Sipariş bulunamadı'
      });
    }

    // Admin için formatlanmış sipariş detayı
    const formattedOrder = {
      _id: order._id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      status: order.status,
      customerType: order.customerType,
      paymentMethod: order.payment?.method || 'Belirtilmemiş',
      shippingType: order.shippingType || 'Standart Kargo',
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items.map(item => ({
        productId: item.productId,
        productName: item.name,
        image: item.image || '', // Ürün resmi URL'i
        price: item.price,
        originalPrice: item.originalPrice || item.price, // Orijinal fiyat (indirim öncesi)
        quantity: item.quantity,
        sku: item.sku || '', // Ürün SKU kodu
        type: item.type || 'product', // Ürün tipi
        bundledProducts: item.bundleItems || []
      })),
      shippingAddress: order.shippingAddress,
      billingAddress: order.billingAddress,
      subtotal: order.subtotal,
      shippingCost: order.shippingCost,
      taxAmount: order.taxAmount || 0,
      couponDiscount: order.coupon?.discountAmount || 0,
      campaignDiscount: order.campaign?.discountAmount || 0,
      totalAmount: order.totalAmount,
      notes: order.notes,
      tracking: order.tracking,
      statusHistory: order.statusHistory,
      adminNotes: order.adminNotes || [],
      currency: order.currency,
      source: order.source,
      isGift: order.isGift,
      giftMessage: order.giftMessage,
      kvkkConsent: order.kvkkConsent,
      privacyPolicyConsent: order.privacyPolicyConsent,
      distanceSalesConsent: order.distanceSalesConsent
    };

    res.json({
      success: true,
      data: formattedOrder
    });
  } catch (error) {
    logger.error('Get order by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Sipariş detayı alınırken bir hata oluştu'
    });
  }
};

/**
 * Tüm siparişleri listele (filtreleme ve arama ile)
 */
const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;

    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'user.email': { $regex: search, $options: 'i' } }
      ];
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('userId', 'firstName lastName email');

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: {
        orders,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Siparişleri alırken bir hata oluştu'
    });
  }
};

/**
 * Sipariş durumunu güncelle
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Sipariş bulunamadı'
      });
    }

    order.status = status;
    if (note) {
      order.adminNotes = order.adminNotes || [];
      order.adminNotes.push({
        note,
        addedBy: req.user?._id || req.user?.id,
        addedAt: new Date()
      });
    }

    await order.save();

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    logger.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      error: 'Sipariş durumu güncellenirken bir hata oluştu'
    });
  }
};

/**
 * Kargo takip numarası ekle
 */
const addTrackingNumber = async (req, res) => {
  try {
    const { id } = req.params;
    const { trackingNumber, carrier } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Sipariş bulunamadı'
      });
    }

    // Order modelindeki tracking alanını kullan
    order.tracking = {
      trackingNumber,
      carrier,
      trackingUrl: order.generateTrackingUrl(trackingNumber, carrier),
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 gün sonra
    };

    await order.save();

    res.json({
      success: true,
      data: {
        _id: order._id,
        orderNumber: order.orderNumber,
        tracking: order.tracking,
        updatedAt: order.updatedAt
      }
    });
  } catch (error) {
    logger.error('Add tracking number error:', error);
    res.status(500).json({
      success: false,
      error: 'Kargo takip numarası eklenirken bir hata oluştu'
    });
  }
};

/**
 * Tüm ürünleri listele
 */
const getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category, stock, type } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) query.category = category;
    if (stock === 'low') query['stock.quantity'] = { $lt: 10, $gt: 0 };
    if (stock === 'out') query['stock.quantity'] = 0;
    
    // Type filtresi - product veya bundle
    if (type && ['product', 'bundle'].includes(type)) {
      query.type = type;
    }

    // Aktif ürünler filtresi - status field'ını kullan
    query.status = { $ne: 'discontinued' };

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate({
        path: 'category',
        select: 'name slug'
      })
      .lean(); // Performans için lean() kullan

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: {
        products,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get all products error:', error);
    res.status(500).json({
      success: false,
      error: 'Ürünleri alırken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Ürün stok durumunu güncelle
 */
const updateProductStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, operation = 'set' } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Ürün bulunamadı'
      });
    }

    switch (operation) {
      case 'add':
        product.stock.quantity += parseInt(quantity);
        break;
      case 'subtract':
        product.stock.quantity = Math.max(0, product.stock.quantity - parseInt(quantity));
        break;
      case 'set':
      default:
        product.stock.quantity = parseInt(quantity);
    }

    product.lastStockUpdate = new Date();
    await product.save();

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    logger.error('Update product stock error:', error);
    res.status(500).json({
      success: false,
      error: 'Ürün stoku güncellenirken bir hata oluştu'
    });
  }
};

/**
 * Ödeme durumunu güncelle (Admin)
 * PUT /api/admin/orders/:orderId/payment-status
 */
const updatePaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentStatus, note } = req.body || {};

    const allowed = ['pending', 'paid', 'failed', 'refunded'];
    if (!allowed.includes(paymentStatus)) {
      return res.status(400).json({ success: false, error: 'Geçersiz paymentStatus' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Sipariş bulunamadı' });
    }

    // Map to internal enum if needed
    const map = { paid: 'completed', pending: 'pending', failed: 'failed', refunded: 'refunded' };
    const newInternal = map[paymentStatus];
    const current = order.payment?.status || 'pending';

    if (current === newInternal) {
      return res.status(409).json({ success: false, error: 'Payment status zaten bu değer' });
    }

    order.payment = order.payment || {};
    order.payment.status = newInternal;
    if (newInternal === 'completed') {
      order.payment.paymentDate = new Date();
    }
    if (newInternal === 'refunded') {
      order.payment.refundDate = new Date();
    }

    // Audit log
    order.adminNotes = order.adminNotes || [];
    order.adminNotes.push({
      at: new Date(),
      adminUserId: req.user?._id,
      type: 'payment_status_update',
      from: current,
      to: newInternal,
      note: note || null
    });

    await order.save();

    return res.status(200).json({
      success: true,
      message: 'Payment status updated',
      data: { orderId: order._id, paymentStatus: paymentStatus, updatedAt: new Date() }
    });
  } catch (error) {
    logger.error('Update payment status error:', error);
    res.status(500).json({ success: false, error: 'Ödeme durumu güncellenirken hata oluştu' });
  }
};

module.exports = {
  getDashboardStats,
  getDashboardQuickStats,
  getSalesAnalytics,
  getCategoryAnalytics,
  getTopSellingProducts,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  addTrackingNumber,
  getAllProducts,
  updateProductStock,
  updatePaymentStatus
}; 