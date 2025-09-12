const Review = require('../models/Review');
const Product = require('../models/Product');
const User = require('../models/User');
const logger = require('../logger/logger');

/**
 * Admin yorumları listele
 */
const getAdminReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, productId, rating, search } = req.query;

    const query = {};

    // Durum filtresi
    if (status) {
      query.status = status;
    }

    // Ürün filtresi
    if (productId) {
      query.productId = productId;
    }

    // Puan filtresi
    if (rating) {
      query.rating = parseInt(rating);
    }

    // Arama filtresi
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { comment: { $regex: search, $options: 'i' } }
      ];
    }

    const reviews = await Review.find(query)
      .populate('productId', 'name slug images')
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Review.countDocuments(query);

    // Review'ları formatla
    const formattedReviews = reviews.map(review => {
      const reviewObj = review.toObject();
      
      return {
        id: reviewObj._id,
        productId: reviewObj.productId._id,
        productName: reviewObj.productId.name,
        userId: reviewObj.userId._id,
        userName: `${reviewObj.userId.firstName} ${reviewObj.userId.lastName}`,
        rating: reviewObj.rating,
        title: reviewObj.title,
        comment: reviewObj.comment,
        status: reviewObj.status,
        createdAt: reviewObj.createdAt,
        images: reviewObj.images || [],
        helpfulCount: reviewObj.helpfulCount || 0,
        reportCount: reviewObj.reportCount || 0
      };
    });

    res.json({
      success: true,
      data: {
        reviews: formattedReviews,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    logger.error('Get admin reviews error:', error);
    res.status(500).json({
      success: false,
      error: 'Yorumlar alınırken hata oluştu'
    });
  }
};

/**
 * Admin yorum detayı
 */
const getAdminReviewById = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id)
      .populate('productId', 'name slug images price')
      .populate('userId', 'firstName lastName email totalOrders totalSpent createdAt');

    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Yorum bulunamadı'
      });
    }

    // Kullanıcının bu ürün için diğer yorumları
    const userOtherReviews = await Review.find({
      userId: review.userId._id,
      productId: { $ne: review.productId._id }
    }).populate('productId', 'name');

    const reviewWithDetails = {
      ...review.toObject(),
      userOtherReviews: userOtherReviews.map(r => ({
        id: r._id,
        productName: r.productId.name,
        rating: r.rating,
        title: r.title,
        createdAt: r.createdAt
      }))
    };

    res.json({
      success: true,
      data: reviewWithDetails
    });
  } catch (error) {
    logger.error('Get admin review by id error:', error);
    res.status(500).json({
      success: false,
      error: 'Yorum detayları alınırken hata oluştu'
    });
  }
};

/**
 * Yorum onayla
 */
const approveReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNote } = req.body;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Yorum bulunamadı'
      });
    }

    review.status = 'approved';
    review.adminNote = adminNote;
    review.reviewedBy = req.user._id;
    review.reviewedAt = new Date();

    await review.save();

    // Ürünün ortalama puanını güncelle
    await updateProductRating(review.productId);

    res.json({
      success: true,
      message: 'Yorum başarıyla onaylandı',
      data: review
    });
  } catch (error) {
    logger.error('Approve review error:', error);
    res.status(500).json({
      success: false,
      error: 'Yorum onaylanırken hata oluştu'
    });
  }
};

/**
 * Yorum reddet
 */
const rejectReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, adminNote } = req.body;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Yorum bulunamadı'
      });
    }

    review.status = 'rejected';
    review.rejectionReason = reason;
    review.adminNote = adminNote;
    review.reviewedBy = req.user._id;
    review.reviewedAt = new Date();

    await review.save();

    // Ürünün ortalama puanını güncelle
    await updateProductRating(review.productId);

    res.json({
      success: true,
      message: 'Yorum başarıyla reddedildi',
      data: review
    });
  } catch (error) {
    logger.error('Reject review error:', error);
    res.status(500).json({
      success: false,
      error: 'Yorum reddedilirken hata oluştu'
    });
  }
};

/**
 * Yorum sil
 */
const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Yorum bulunamadı'
      });
    }

    // Soft delete
    review.isDeleted = true;
    review.deletedBy = req.user._id;
    review.deletedAt = new Date();
    await review.save();

    // Ürünün ortalama puanını güncelle
    await updateProductRating(review.productId);

    res.json({
      success: true,
      message: 'Yorum başarıyla silindi'
    });
  } catch (error) {
    logger.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      error: 'Yorum silinirken hata oluştu'
    });
  }
};

/**
 * Toplu yorum işlemleri
 */
const bulkReviewOperations = async (req, res) => {
  try {
    const { action, reviewIds, data } = req.body;

    if (!reviewIds || !Array.isArray(reviewIds) || reviewIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Yorum IDleri gerekli'
      });
    }

    let result = {};

    switch (action) {
      case 'approve':
        result = await bulkApproveReviews(reviewIds, req.user._id);
        break;
      case 'reject':
        result = await bulkRejectReviews(reviewIds, data.reason, req.user._id);
        break;
      case 'delete':
        result = await bulkDeleteReviews(reviewIds, req.user._id);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Geçersiz işlem'
        });
    }

    // Etkilenen ürünlerin puanlarını güncelle
    const reviews = await Review.find({ _id: { $in: reviewIds } }, 'productId');
    const productIds = [...new Set(reviews.map(r => r.productId.toString()))];
    
    await Promise.all(
      productIds.map(productId => updateProductRating(productId))
    );

    res.json({
      success: true,
      message: 'Toplu işlem başarıyla tamamlandı',
      data: result
    });
  } catch (error) {
    logger.error('Bulk review operations error:', error);
    res.status(500).json({
      success: false,
      error: 'Toplu işlem sırasında hata oluştu'
    });
  }
};

/**
 * Yorum istatistikleri
 */
const getReviewStats = async (req, res) => {
  try {
    const { productId, period = '30d' } = req.query;

    let startDate;
    const endDate = new Date();

    switch (period) {
      case '7d':
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const baseQuery = {
      createdAt: { $gte: startDate, $lte: endDate }
    };

    if (productId) {
      baseQuery.productId = productId;
    }

    const [
      totalReviews,
      pendingReviews,
      approvedReviews,
      rejectedReviews,
      ratingDistribution,
      dailyReviews
    ] = await Promise.all([
      Review.countDocuments(baseQuery),
      Review.countDocuments({ ...baseQuery, status: 'pending' }),
      Review.countDocuments({ ...baseQuery, status: 'approved' }),
      Review.countDocuments({ ...baseQuery, status: 'rejected' }),
      
      // Puan dağılımı
      Review.aggregate([
        { $match: baseQuery },
        {
          $group: {
            _id: '$rating',
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // Günlük yorum sayıları
      Review.aggregate([
        { $match: baseQuery },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          total: totalReviews,
          pending: pendingReviews,
          approved: approvedReviews,
          rejected: rejectedReviews
        },
        ratingDistribution,
        dailyTrend: dailyReviews
      }
    });
  } catch (error) {
    logger.error('Get review stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Yorum istatistikleri alınırken hata oluştu'
    });
  }
};

// Yardımcı fonksiyonlar
const updateProductRating = async (productId) => {
  try {
    const stats = await Review.aggregate([
      {
        $match: {
          productId: productId,
          status: 'approved',
          isDeleted: { $ne: true }
        }
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      }
    ]);

    if (stats.length > 0) {
      const { averageRating, totalReviews, ratingDistribution } = stats[0];
      
      // Puan dağılımını hesapla
      const distribution = [1, 2, 3, 4, 5].map(rating => ({
        rating,
        count: ratingDistribution.filter(r => r === rating).length
      }));

      await Product.findByIdAndUpdate(productId, {
        'rating.average': Math.round(averageRating * 10) / 10,
        'rating.count': totalReviews,
        'rating.distribution': distribution
      });
    } else {
      // Hiç onaylı yorum yoksa
      await Product.findByIdAndUpdate(productId, {
        'rating.average': 0,
        'rating.count': 0,
        'rating.distribution': []
      });
    }
  } catch (error) {
    logger.error('Update product rating error:', error);
  }
};

const bulkApproveReviews = async (reviewIds, adminId) => {
  const result = await Review.updateMany(
    { _id: { $in: reviewIds } },
    {
      status: 'approved',
      reviewedBy: adminId,
      reviewedAt: new Date()
    }
  );

  return { approvedCount: result.modifiedCount };
};

const bulkRejectReviews = async (reviewIds, reason, adminId) => {
  const result = await Review.updateMany(
    { _id: { $in: reviewIds } },
    {
      status: 'rejected',
      rejectionReason: reason,
      reviewedBy: adminId,
      reviewedAt: new Date()
    }
  );

  return { rejectedCount: result.modifiedCount };
};

const bulkDeleteReviews = async (reviewIds, adminId) => {
  const result = await Review.updateMany(
    { _id: { $in: reviewIds } },
    {
      isDeleted: true,
      deletedBy: adminId,
      deletedAt: new Date()
    }
  );

  return { deletedCount: result.modifiedCount };
};

module.exports = {
  getAdminReviews,
  getAdminReviewById,
  approveReview,
  rejectReview,
  deleteReview,
  bulkReviewOperations,
  getReviewStats
}; 