const Order = require('../models/Order');
const User = require('../models/User');
const logger = require('../logger/logger');

/**
 * Admin ödemeleri listele
 */
const getAdminPayments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, method, dateFrom, dateTo, search } = req.query;

    const query = {};

    // Durum filtresi
    if (status) {
      query['payment.status'] = status;
    }

    // Ödeme yöntemi filtresi
    if (method) {
      query['payment.method'] = method;
    }

    // Tarih aralığı filtresi
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    // Arama filtresi
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'payment.transactionId': { $regex: search, $options: 'i' } }
      ];
    }

    const payments = await Order.find(query)
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('orderNumber totalAmount payment userId createdAt status');

    const total = await Order.countDocuments(query);

    // Ödemeleri formatla
    const formattedPayments = payments.map(order => {
      const orderObj = order.toObject();
      
      return {
        id: orderObj._id,
        orderId: orderObj._id,
        orderNumber: orderObj.orderNumber,
        amount: orderObj.totalAmount,
        method: orderObj.payment?.method || 'unknown',
        status: orderObj.payment?.status || 'pending',
        transactionId: orderObj.payment?.transactionId,
        customerName: `${orderObj.userId.firstName} ${orderObj.userId.lastName}`,
        customerEmail: orderObj.userId.email,
        createdAt: orderObj.createdAt,
        bankTransferDetails: orderObj.payment?.bankTransfer || null
      };
    });

    res.json({
      success: true,
      data: {
        payments: formattedPayments,
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
    logger.error('Get admin payments error:', error);
    res.status(500).json({
      success: false,
      error: 'Ödemeler alınırken hata oluştu'
    });
  }
};

/**
 * Admin ödeme detayı
 */
const getAdminPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate('userId', 'firstName lastName email phone totalOrders totalSpent')
      .populate('items.productId', 'name sku');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Ödeme bulunamadı'
      });
    }

    // Kullanıcının ödeme geçmişi
    const userPaymentHistory = await Order.find({
      userId: order.userId._id,
      _id: { $ne: id }
    })
    .select('orderNumber totalAmount payment.status payment.method createdAt')
    .sort({ createdAt: -1 })
    .limit(5);

    const paymentWithDetails = {
      ...order.toObject(),
      userPaymentHistory: userPaymentHistory.map(p => ({
        orderNumber: p.orderNumber,
        amount: p.totalAmount,
        status: p.payment?.status || 'pending',
        method: p.payment?.method || 'unknown',
        createdAt: p.createdAt
      }))
    };

    res.json({
      success: true,
      data: paymentWithDetails
    });
  } catch (error) {
    logger.error('Get admin payment by id error:', error);
    res.status(500).json({
      success: false,
      error: 'Ödeme detayları alınırken hata oluştu'
    });
  }
};

/**
 * Havale/EFT ödeme onaylama
 */
const approveBankTransfer = async (req, res) => {
  try {
    const { id } = req.params;
    const { approvedAmount, note } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Sipariş bulunamadı'
      });
    }

    if (order.payment?.method !== 'bank_transfer') {
      return res.status(400).json({
        success: false,
        error: 'Bu sipariş havale/EFT ile ödenmemiş'
      });
    }

    if (order.payment?.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Bu ödeme zaten onaylanmış'
      });
    }

    // Ödeme tutarı kontrolü
    const expectedAmount = order.totalAmount;
    const tolerance = 1; // 1 TL tolerans
    
    if (Math.abs(approvedAmount - expectedAmount) > tolerance) {
      // Kısmi ödeme veya fazla ödeme durumu
      order.payment.partialPayment = {
        expectedAmount,
        receivedAmount: approvedAmount,
        difference: approvedAmount - expectedAmount
      };
    }

    // Ödemeyi onayla
    order.payment.status = 'completed';
    order.payment.approvedBy = req.user._id;
    order.payment.approvedAt = new Date();
    order.payment.adminNote = note;
    order.payment.bankTransfer.approvedAmount = approvedAmount;

    // Sipariş durumunu güncelle
    if (order.status === 'pending') {
      order.status = 'confirmed';
    }

    await order.save();

    res.json({
      success: true,
      message: 'Havale/EFT ödemesi başarıyla onaylandı',
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        approvedAmount,
        paymentStatus: order.payment.status,
        orderStatus: order.status
      }
    });
  } catch (error) {
    logger.error('Approve bank transfer error:', error);
    res.status(500).json({
      success: false,
      error: 'Ödeme onaylanırken hata oluştu'
    });
  }
};

/**
 * Havale/EFT ödeme reddetme
 */
const rejectBankTransfer = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, note } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Sipariş bulunamadı'
      });
    }

    if (order.payment?.method !== 'bank_transfer') {
      return res.status(400).json({
        success: false,
        error: 'Bu sipariş havale/EFT ile ödenmemiş'
      });
    }

    // Ödemeyi reddet
    order.payment.status = 'failed';
    order.payment.rejectedBy = req.user._id;
    order.payment.rejectedAt = new Date();
    order.payment.rejectionReason = reason;
    order.payment.adminNote = note;

    // Sipariş durumunu güncelle
    order.status = 'cancelled';

    await order.save();

    res.json({
      success: true,
      message: 'Havale/EFT ödemesi reddedildi',
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        paymentStatus: order.payment.status,
        orderStatus: order.status,
        rejectionReason: reason
      }
    });
  } catch (error) {
    logger.error('Reject bank transfer error:', error);
    res.status(500).json({
      success: false,
      error: 'Ödeme reddedilirken hata oluştu'
    });
  }
};

/**
 * Ödeme istatistikleri
 */
const getPaymentStats = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Genel istatistikler
    const [
      totalPayments,
      completedPayments,
      pendingPayments,
      failedPayments,
      methodStats,
      dailyStats
    ] = await Promise.all([
      Order.countDocuments({
        createdAt: { $gte: start, $lte: end }
      }),
      Order.countDocuments({
        createdAt: { $gte: start, $lte: end },
        'payment.status': 'completed'
      }),
      Order.countDocuments({
        createdAt: { $gte: start, $lte: end },
        'payment.status': 'pending'
      }),
      Order.countDocuments({
        createdAt: { $gte: start, $lte: end },
        'payment.status': 'failed'
      }),

      // Ödeme yöntemi dağılımı
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: '$payment.method',
            count: { $sum: 1 },
            totalAmount: { $sum: '$totalAmount' }
          }
        }
      ]),

      // Günlük ödeme istatistikleri
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end },
            'payment.status': 'completed'
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            count: { $sum: 1 },
            totalAmount: { $sum: '$totalAmount' }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    // Bekleyen havale ödemeleri
    const pendingBankTransfers = await Order.find({
      'payment.method': 'bank_transfer',
      'payment.status': 'pending'
    })
    .populate('userId', 'firstName lastName email')
    .select('orderNumber totalAmount payment createdAt userId')
    .sort({ createdAt: -1 })
    .limit(10);

    res.json({
      success: true,
      data: {
        summary: {
          total: totalPayments,
          completed: completedPayments,
          pending: pendingPayments,
          failed: failedPayments
        },
        methodDistribution: methodStats,
        dailyTrend: dailyStats,
        pendingBankTransfers: pendingBankTransfers.map(order => ({
          id: order._id,
          orderNumber: order.orderNumber,
          amount: order.totalAmount,
          customerName: `${order.userId.firstName} ${order.userId.lastName}`,
          customerEmail: order.userId.email,
          createdAt: order.createdAt,
          receiptImage: order.payment?.bankTransfer?.receiptImage
        }))
      }
    });
  } catch (error) {
    logger.error('Get payment stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Ödeme istatistikleri alınırken hata oluştu'
    });
  }
};

/**
 * İade işlemi başlat
 */
const initiateRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, reason, refundMethod = 'original' } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Sipariş bulunamadı'
      });
    }

    if (order.payment?.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Sadece tamamlanmış ödemeler iade edilebilir'
      });
    }

    // İade miktarı kontrolü
    const maxRefundAmount = order.totalAmount - (order.payment?.refundedAmount || 0);
    if (amount > maxRefundAmount) {
      return res.status(400).json({
        success: false,
        error: `Maksimum iade edilebilir tutar: ${maxRefundAmount} TL`
      });
    }

    // İade kaydı oluştur
    const refundData = {
      amount,
      reason,
      method: refundMethod,
      status: 'pending',
      initiatedBy: req.user._id,
      initiatedAt: new Date()
    };

    if (!order.payment.refunds) {
      order.payment.refunds = [];
    }
    order.payment.refunds.push(refundData);

    // Toplam iade tutarını güncelle
    order.payment.refundedAmount = (order.payment.refundedAmount || 0) + amount;

    // Eğer tam iade ise ödeme durumunu güncelle
    if (order.payment.refundedAmount >= order.totalAmount) {
      order.payment.status = 'refunded';
      order.status = 'returned';
    }

    await order.save();

    res.json({
      success: true,
      message: 'İade işlemi başlatıldı',
      data: {
        orderId: order._id,
        refundAmount: amount,
        totalRefunded: order.payment.refundedAmount,
        refundStatus: 'pending'
      }
    });
  } catch (error) {
    logger.error('Initiate refund error:', error);
    res.status(500).json({
      success: false,
      error: 'İade işlemi başlatılırken hata oluştu'
    });
  }
};

/**
 * Toplu ödeme işlemleri
 */
const bulkPaymentOperations = async (req, res) => {
  try {
    const { action, paymentIds, data } = req.body;

    if (!paymentIds || !Array.isArray(paymentIds) || paymentIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Ödeme IDleri gerekli'
      });
    }

    let result = {};

    switch (action) {
      case 'approve':
        result = await bulkApproveBankTransfers(paymentIds, data.approvedAmount, req.user._id);
        break;
      case 'reject':
        result = await bulkRejectBankTransfers(paymentIds, data.reason, req.user._id);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Geçersiz işlem'
        });
    }

    res.json({
      success: true,
      message: 'Toplu işlem başarıyla tamamlandı',
      data: result
    });
  } catch (error) {
    logger.error('Bulk payment operations error:', error);
    res.status(500).json({
      success: false,
      error: 'Toplu işlem sırasında hata oluştu'
    });
  }
};

// Yardımcı fonksiyonlar
const bulkApproveBankTransfers = async (orderIds, approvedAmount, adminId) => {
  const orders = await Order.find({
    _id: { $in: orderIds },
    'payment.method': 'bank_transfer',
    'payment.status': 'pending'
  });

  let approvedCount = 0;

  for (const order of orders) {
    order.payment.status = 'completed';
    order.payment.approvedBy = adminId;
    order.payment.approvedAt = new Date();
    order.payment.bankTransfer.approvedAmount = approvedAmount || order.totalAmount;
    
    if (order.status === 'pending') {
      order.status = 'confirmed';
    }
    
    await order.save();
    approvedCount++;
  }

  return { approvedCount };
};

const bulkRejectBankTransfers = async (orderIds, reason, adminId) => {
  const orders = await Order.find({
    _id: { $in: orderIds },
    'payment.method': 'bank_transfer',
    'payment.status': 'pending'
  });

  let rejectedCount = 0;

  for (const order of orders) {
    order.payment.status = 'failed';
    order.payment.rejectedBy = adminId;
    order.payment.rejectedAt = new Date();
    order.payment.rejectionReason = reason;
    order.status = 'cancelled';
    
    await order.save();
    rejectedCount++;
  }

  return { rejectedCount };
};

module.exports = {
  getAdminPayments,
  getAdminPaymentById,
  approveBankTransfer,
  rejectBankTransfer,
  getPaymentStats,
  initiateRefund,
  bulkPaymentOperations
}; 