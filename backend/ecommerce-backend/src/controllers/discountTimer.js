const DiscountTimer = require('../models/discountTimer.js');

const { ValidationError } = require('../errors/errors.js');

const logger = require('../logger/logger');

const getDiscountTimer = async (req, res, next) => {
    logger.verbose('Entering getDiscountTimer');
    try {
        let discountTimer = await DiscountTimer.findOne({ trackCookie: req.trackCookie });
        if (!discountTimer) {
            logger.debug(`No discountTimer found for trackCookie ${req.trackCookie}`);
            // ends in 24h
            discountTimer = new DiscountTimer({ trackCookie: req.trackCookie, endFirstDiscount: Date.now() + 12 * 60 * 60 * 1000 });
            discountTimer.save();
        }
        logger.info(`Found discountTimer with trackCookie ${req.trackCookie}`);
        res.status(200).send({ value: discountTimer, message: 'DiscountTimer found' });
    } catch (error) {
        next(error);
    }
}

const addEndLastDiscount = async (req, res, next) => {
    logger.verbose('Entering addEndLastDiscount');
    try {
        const discountTimer = await DiscountTimer.findOne({ trackCookie: req.trackCookie });
        if (!discountTimer) {
            logger.debug(`No discountTimer found for trackCookie ${req.trackCookie}`);
            throw new ValidationError('No discountTimer found for trackCookie');
        }
        // end in 2h
        discountTimer.endLastDiscount = Date.now() + 2 * 60 * 60 * 1000;
        await discountTimer.save();
        logger.info(`Added endLastDiscount to discountTimer with trackCookie ${req.trackCookie}`);
        res.status(200).send({ value: discountTimer, message: 'endLastDiscount added' });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getDiscountTimer,
    addEndLastDiscount,
}