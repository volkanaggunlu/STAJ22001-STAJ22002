const logger = require("../../logger/logger");
const { klaviyoOrderPlacement } = require("./orderPlacement");
const { klaviyoOrderedProducts } = require("./orderedProducts");

/**
 * Sends all Klaviyo order tracking events for a completed order
 * @param {Object} order - The complete order object with populated cart and products
 * @returns {Promise<Object>} - Results from all Klaviyo tracking events
 */
const trackOrderInKlaviyo = async (order) => {
    logger.verbose('entered trackOrderInKlaviyo');


    let orderPlacementResult = false
    let orderedProductsResults = false
    try {
        // First send the overall order placement event
        orderPlacementResult = await klaviyoOrderPlacement(order);

        // Then send individual product events
        orderedProductsResults = await klaviyoOrderedProducts(order);

        logger.info(`Successfully tracked order #${order.order_no} in Klaviyo`);
    } catch (error) {
        logger.error(`Error tracking order #${order.order_no} in Klaviyo:`, error);
        throw error;
    }

    logger.verbose('exiting trackOrderInKlaviyo');

    return {
        orderPlacement: orderPlacementResult,
        orderedProducts: orderedProductsResults
    };
};

module.exports = {
    trackOrderInKlaviyo,
    klaviyoOrderPlacement,
    klaviyoOrderedProducts
};