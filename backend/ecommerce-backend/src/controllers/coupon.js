const Coupon = require('../models/Coupon');
const Cart = require('../models/Cart');
const Order = require('../models/Order')

const { ValidationError } = require('../errors/errors')

const logger = require('../logger/logger')

const createCoupon = async (req, res, next) => {
    // called on POST /api/coupon, creates a new order right before directing users to payment page
    logger.verbose('Entering createCoupon');
    try {
        const { code, discount, discountType, expirationDate, isActive, usageCount, maxUsage } = req.body;
        const existingCoupon = await Order.findOne({ code });
        
        if (existingCoupon) {
            throw new ValidationError(`Coupon with code ${code} already exists`);
        }

        const coupon = new Coupon({ code, discount, discountType, expirationDate, isActive, usageCount, maxUsage });
        await coupon.save();
        logger.info(`Saved new coupon ${code} with discount ${discount} and discountType ${discountType}`)
        res.status(201).send({ coupon: coupon.toJSON() });
    } catch (error) {
        next(error)
    }
};

const applyCoupon = async (req, res, next) => {
    // called on POST /api/coupon/apply, applies a coupon to an order
    logger.verbose('Entering applyCoupon');
    try {
        const code  = req.body.coupon;
        const session_id = req.session_id;

        const coupon = await Coupon.findOne({ code });
        if (!coupon) {
            throw new ValidationError('Kupon geçerli değil.');
        }

        const cart = await Cart.findOne({ _id: session_id });
        if (!cart) {
            throw new ValidationError('Kuponun çalışması için sepete ürün ekleyiniz.');
        }

        const total = await cart.getFinalPrice(req.trackCookie ?? null)
        const discountedTotal = await cart.calculateDiscountedTotal(coupon, req.trackCookie ?? null);

        logger.info(`Applied coupon ${code} to cart ${session_id} dropping the price from ${total} to ${discountedTotal}`)
        res.send({ coupon: coupon.toJSON(), discountedTotal });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createCoupon,
    applyCoupon,
};