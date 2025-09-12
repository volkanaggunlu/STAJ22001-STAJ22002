const User = require('../models/User');
const Order = require('../models/Order');
const logger = require('../logger/logger');

/**
 * Tüm kullanıcıları listele
 */
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role, status, includeDeleted } = req.query;

    const query = {};
    // Silinmiş kullanıcıları varsayılan olarak listeleme
    if (includeDeleted !== 'true') {
      query.deletedAt = { $exists: false };
    }
    
    // Arama filtresi
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Rol filtresi
    if (role) {
      query.role = role;
    }
    
    // Durum filtresi
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    } else if (status === 'banned') {
      query.isLocked = true;
    }

    const users = await User.find(query)
      .select('-password -passwordResetToken -emailVerificationToken')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    // Her kullanıcı için sipariş istatistiklerini ekle
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const userObj = user.toObject();
        const orderStats = await Order.aggregate([
          { $match: { userId: user._id } },
          {
            $group: {
              _id: null,
              orderCount: { $sum: 1 },
              totalSpent: { $sum: '$totalAmount' }
            }
          }
        ]);

        userObj.orderCount = orderStats[0]?.orderCount || 0;
        userObj.totalSpent = orderStats[0]?.totalSpent || 0;
        
        return userObj;
      })
    );

    res.json({
      success: true,
      data: {
        users: usersWithStats,
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
    logger.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      error: 'Kullanıcılar alınırken hata oluştu'
    });
  }
};

/**
 * Kullanıcı detayını getir
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .select('-password -passwordResetToken -emailVerificationToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Kullanıcı bulunamadı'
      });
    }

    // Kullanıcının sipariş istatistikleri
    const orderStats = await Order.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: null,
          orderCount: { $sum: 1 },
          totalSpent: { $sum: '$totalAmount' },
          avgOrderValue: { $avg: '$totalAmount' }
        }
      }
    ]);

    // Son siparişler
    const recentOrders = await Order.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('orderNumber totalAmount status createdAt');

    const userWithStats = {
      ...user.toObject(),
      stats: {
        orderCount: orderStats[0]?.orderCount || 0,
        totalSpent: orderStats[0]?.totalSpent || 0,
        avgOrderValue: orderStats[0]?.avgOrderValue || 0
      },
      recentOrders
    };

    res.json({
      success: true,
      data: userWithStats
    });
  } catch (error) {
    logger.error('Get user by id error:', error);
    res.status(500).json({
      success: false,
      error: 'Kullanıcı detayları alınırken hata oluştu'
    });
  }
};

/**
 * Kullanıcı oluştur
 */
const createUser = async (req, res) => {
  try {
    const userData = req.body;

    // Email kontrolü
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Bu email adresi zaten kullanımda'
      });
    }

    const user = new User(userData);
    await user.save();

    // Şifreyi response'tan çıkar
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'Kullanıcı başarıyla oluşturuldu',
      data: userResponse
    });
  } catch (error) {
    logger.error('Create user error:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Geçersiz veri',
        details: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Kullanıcı oluşturulurken hata oluştu'
    });
  }
};

/**
 * Kullanıcı güncelle
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Şifre güncelleme ayrı endpoint'te yapılmalı
    delete updateData.password;

    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -passwordResetToken -emailVerificationToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Kullanıcı bulunamadı'
      });
    }

    res.json({
      success: true,
      message: 'Kullanıcı başarıyla güncellendi',
      data: user
    });
  } catch (error) {
    logger.error('Update user error:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Geçersiz veri',
        details: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Kullanıcı güncellenirken hata oluştu'
    });
  }
};

/**
 * Kullanıcı sil (soft delete)
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Kullanıcı bulunamadı'
      });
    }

    // Admin kullanıcı silinmesin
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin kullanıcı silinemez'
      });
    }

    // Hard delete - kullanıcıyı veritabanından tamamen kaldır
    await User.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: 'Kullanıcı başarıyla silindi'
    });
  } catch (error) {
    logger.error('Delete user error:', error);
    return res.status(500).json({
      success: false,
      error: 'Kullanıcı silinirken hata oluştu'
    });
  }
};

/**
 * Kullanıcı rolünü değiştir
 */
const changeUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Geçersiz rol. Sadece "user" veya "admin" olabilir'
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    ).select('-password -passwordResetToken -emailVerificationToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Kullanıcı bulunamadı'
      });
    }

    res.json({
      success: true,
      message: 'Kullanıcı rolü başarıyla güncellendi',
      data: {
        userId: user._id,
        newRole: user.role
      }
    });
  } catch (error) {
    logger.error('Change user role error:', error);
    res.status(500).json({
      success: false,
      error: 'Kullanıcı rolü değiştirilirken hata oluştu'
    });
  }
};

/**
 * Kullanıcıyı deaktifleştir/aktifleştir
 */
const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, reason, duration } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Kullanıcı bulunamadı'
      });
    }

    // Admin kullanıcı deaktif edilmesin
    if (user.role === 'admin' && !isActive) {
      return res.status(403).json({
        success: false,
        error: 'Admin kullanıcı deaktif edilemez'
      });
    }

    user.isActive = isActive;
    
    if (!isActive && reason) {
      user.deactivationReason = reason;
      user.deactivatedAt = new Date();
      
      if (duration !== 'permanent') {
        // Geçici deaktivasyon için süre hesapla
        const days = parseInt(duration);
        if (days > 0) {
          user.reactivateAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
        }
      }
    } else if (isActive) {
      user.deactivationReason = undefined;
      user.deactivatedAt = undefined;
      user.reactivateAt = undefined;
    }

    await user.save();

    res.json({
      success: true,
      message: `Kullanıcı başarıyla ${isActive ? 'aktif' : 'deaktif'} edildi`,
      data: {
        userId: user._id,
        isActive: user.isActive,
        reason: user.deactivationReason
      }
    });
  } catch (error) {
    logger.error('Toggle user status error:', error);
    res.status(500).json({
      success: false,
      error: 'Kullanıcı durumu değiştirilirken hata oluştu'
    });
  }
};

/**
 * Kullanıcı istatistikleri
 */
const getUserStats = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Kullanıcı bulunamadı'
      });
    }

    // Detaylı istatistikler
    const [orderStats, monthlyStats, categoryStats] = await Promise.all([
      // Genel sipariş istatistikleri
      Order.aggregate([
        { $match: { userId: user._id } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalSpent: { $sum: '$totalAmount' },
            avgOrderValue: { $avg: '$totalAmount' },
            maxOrderValue: { $max: '$totalAmount' },
            minOrderValue: { $min: '$totalAmount' }
          }
        }
      ]),
      
      // Aylık harcama trendi
      Order.aggregate([
        { $match: { userId: user._id } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            monthlySpent: { $sum: '$totalAmount' },
            monthlyOrders: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 }
      ]),

      // Kategori bazında harcama
      Order.aggregate([
        { $match: { userId: user._id } },
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
            _id: '$category.name',
            spent: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
            itemCount: { $sum: '$items.quantity' }
          }
        },
        { $sort: { spent: -1 } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          joinDate: user.createdAt
        },
        orderStats: orderStats[0] || {
          totalOrders: 0,
          totalSpent: 0,
          avgOrderValue: 0,
          maxOrderValue: 0,
          minOrderValue: 0
        },
        monthlyTrend: monthlyStats,
        categoryBreakdown: categoryStats
      }
    });
  } catch (error) {
    logger.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Kullanıcı istatistikleri alınırken hata oluştu'
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  changeUserRole,
  toggleUserStatus,
  getUserStats
}; 