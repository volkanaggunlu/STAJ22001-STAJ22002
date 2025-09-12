const logger = require('../logger/logger');
const Coupon = require('../models/Coupon');
const { ValidationError } = require('../errors/errors');

/**
 * Kupon kodunu doğrula ve indirim bilgisini döndür
 * POST /api/coupons/validate
 */
const validateCoupon = async (req, res, next) => {
  try {
    const { code, orderAmount = 0, items = [] } = req.body;
    const userId = req.user?._id;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_COUPON_CODE',
          message: 'Kupon kodu gereklidir'
        }
      });
    }

    // Kuponu bul
    const coupon = await Coupon.findByCode(code);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'COUPON_NOT_FOUND',
          message: 'Kupon kodu bulunamadı'
        }
      });
    }

    // Kuponun kullanılabilirliğini kontrol et
    const canUseResult = coupon.canUse(userId, orderAmount);
    if (!canUseResult.valid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'COUPON_INVALID',
          message: canUseResult.reason
        }
      });
    }

    // İndirim tutarını hesapla
    const discountAmount = coupon.calculateDiscount(orderAmount);

    // Kupon bilgilerini döndür
    res.json({
      success: true,
      message: 'Kupon kodu geçerli',
      data: {
        coupon: {
          id: coupon._id,
          code: coupon.code,
          name: coupon.name,
          description: coupon.description,
          type: coupon.type,
          value: coupon.value,
          discountAmount: discountAmount,
          minOrderAmount: coupon.minOrderAmount,
          maxDiscountAmount: coupon.maxDiscountAmount,
          isExpired: coupon.isExpired,
          isNotStarted: coupon.isNotStarted,
          remainingUses: coupon.remainingUses
        },
        discount: {
          amount: discountAmount,
          type: coupon.type,
          value: coupon.value
        }
      }
    });

  } catch (error) {
    logger.error('Coupon validation failed:', error);
    next(error);
  }
};

/**
 * Sepete kupon uygula
 * POST /api/cart/apply-coupon
 */
const applyCouponToCart = async (req, res, next) => {
  try {
    const { code, cartItems = [], subtotal = 0 } = req.body;
    const userId = req.user?._id;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_COUPON_CODE',
          message: 'Kupon kodu gereklidir'
        }
      });
    }

    // Kuponu bul
    const coupon = await Coupon.findByCode(code);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'COUPON_NOT_FOUND',
          message: 'Kupon kodu bulunamadı'
        }
      });
    }

    // Kuponun kullanılabilirliğini kontrol et
    const canUseResult = coupon.canUse(userId, subtotal);
    if (!canUseResult.valid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'COUPON_INVALID',
          message: canUseResult.reason
        }
      });
    }

    // Ürün bazlı kupon kontrolü
    if (cartItems.length > 0) {
      for (const item of cartItems) {
        if (!coupon.isApplicableToProduct(item.productId)) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'COUPON_PRODUCT_INVALID',
              message: 'Bu kupon sepetinizdeki ürünler için geçerli değil'
            }
          });
        }
      }
    }

    // İndirim tutarını hesapla
    const discountAmount = coupon.calculateDiscount(subtotal);
    const totalAfterDiscount = subtotal - discountAmount;

    res.json({
      success: true,
      message: 'Kupon başarıyla uygulandı',
      data: {
        coupon: {
          id: coupon._id,
          code: coupon.code,
          name: coupon.name,
          description: coupon.description,
          type: coupon.type,
          value: coupon.value
        },
        cart: {
          subtotal: subtotal,
          discountAmount: discountAmount,
          totalAfterDiscount: totalAfterDiscount
        }
      }
    });

  } catch (error) {
    logger.error('Apply coupon to cart failed:', error);
    next(error);
  }
};

/**
 * Kullanıcının kullanabileceği kuponları listele
 * GET /api/coupons/available
 */
const getAvailableCoupons = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const { orderAmount = 0 } = req.query;

    let coupons;
    if (userId) {
      coupons = await Coupon.findForUser(userId);
    } else {
      coupons = await Coupon.findActive();
    }

    // Kullanılabilir kuponları filtrele
    const availableCoupons = coupons.filter(coupon => {
      const canUseResult = coupon.canUse(userId, orderAmount);
      return canUseResult.valid;
    });

    // Kupon bilgilerini hazırla
    const couponData = availableCoupons.map(coupon => ({
      id: coupon._id,
      code: coupon.code,
      name: coupon.name,
      description: coupon.description,
      type: coupon.type,
      value: coupon.value,
      minOrderAmount: coupon.minOrderAmount,
      maxDiscountAmount: coupon.maxDiscountAmount,
      discountAmount: coupon.calculateDiscount(orderAmount),
      isExpired: coupon.isExpired,
      isNotStarted: coupon.isNotStarted,
      remainingUses: coupon.remainingUses
    }));

    res.json({
      success: true,
      message: 'Kullanılabilir kuponlar getirildi',
      data: {
        coupons: couponData,
        count: couponData.length
      }
    });

  } catch (error) {
    logger.error('Get available coupons failed:', error);
    next(error);
  }
};

/**
 * Kupon kullanım geçmişini getir
 * GET /api/coupons/:id/usage-history
 */
const getCouponUsageHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'COUPON_NOT_FOUND',
          message: 'Kupon bulunamadı'
        }
      });
    }

    // Kullanıcının kullanım geçmişini getir
    const userUsageHistory = coupon.usageHistory.filter(
      usage => usage.userId.toString() === userId.toString()
    );

    res.json({
      success: true,
      message: 'Kupon kullanım geçmişi getirildi',
      data: {
        coupon: {
          id: coupon._id,
          code: coupon.code,
          name: coupon.name
        },
        usageHistory: userUsageHistory,
        totalUses: userUsageHistory.length,
        totalDiscount: userUsageHistory.reduce((sum, usage) => sum + usage.discountAmount, 0)
      }
    });

  } catch (error) {
    logger.error('Get coupon usage history failed:', error);
    next(error);
  }
};

module.exports = {
  validateCoupon,
  applyCouponToCart,
  getAvailableCoupons,
  getCouponUsageHistory
}; 