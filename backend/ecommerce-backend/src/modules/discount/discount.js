const DiscountTimer = require('../../models/discountTimer');
const logger = require('../../logger/logger');

const hasDiscount = async (trackCookie = null) => {
    logger.verbose('Entering hasDiscount');
    if (!trackCookie) {
        logger.verbose('No trackCookie found, exiting hasDiscount');
        return false;
    }

    const discountTimer = await DiscountTimer.findOne({ trackCookie });

    const now = new Date();

    // if endLastDiscount exists and has not yet passed
    if (discountTimer && discountTimer.endFirstDiscount && (discountTimer.endLastDiscount > now || !discountTimer.endLastDiscount)) {
        logger.verbose('Discount found, exiting hasDiscount');
        return true
    }
    logger.verbose('No discount found, exiting hasDiscount');
    return false;

}

module.exports = {
    hasDiscount,
}