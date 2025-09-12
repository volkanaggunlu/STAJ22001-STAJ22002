const { BASE_URL, KLAVIYO_PRIVATE_API_KEY } = require("../../config/environment");
const { formatImageURL, getTurkeyTimeISO, formatPhone } = require("../../utils/helpers");
const logger = require("../../logger/logger");

/**
 * Sends "Ordered Product" events to Klaviyo for each product in an order
 * @param {Object} order - The order object, must be populated with cart and products
 * @returns {Promise<Array>} - Array of responses from Klaviyo API
 */
const klaviyoOrderedProducts = async (order) => {
    logger.verbose('entered klaviyoOrderedProducts');

    // Extract order details. ORDER MUST BE POPULATED
    const {
        _id,
        cart,
        email,
        phone,
        order_no
    } = order;

    if (!cart || !cart.products || !Array.isArray(cart.products)) {
        logger.error('Invalid cart structure for order:', order_no);
        throw new Error('Invalid cart structure for Klaviyo Ordered Product events');
    }

    // Process each product in the cart
    const requests = cart.products.map(async (cartProduct) => {
        const product = cartProduct.product;

        if (!product) {
            logger.error('Product missing in cart item for order:', order_no);
            return null;
        }

        // Prepare the payload for a single product
        const payload = {
            data: {
                type: "event",
                attributes: {
                    properties: {
                        OrderId: order_no.toString(),
                        ProductID: product._id || '',
                        SKU: product.slug || '',
                        ProductName: product.name || '',
                        Quantity: cartProduct.quantity,
                        ProductURL: `${BASE_URL}/urunler/${product.slug}`,
                        ImageURL: formatImageURL(product.images?.find(img => img.isThumbnail) || product.images[0], product.slug),
                        Categories: product.categories?.map(cat => cat.category) || [],
                        ProductBrand: '' // Add brand if available in your data model
                    },
                    time: getTurkeyTimeISO(),
                    value: parseFloat(product.discountedPrice || product.price || '0') * cartProduct.quantity / 100, 
                    value_currency: "TRY",
                    unique_id: `${order_no}-product-${product._id}`,
                    metric: {
                        data: {
                            type: "metric",
                            attributes: {
                                name: "Ordered Product"
                            }
                        }
                    },
                    profile: {
                        data: {
                            type: "profile",
                            attributes: {
                                email: email,
                                phone_number: formatPhone(phone)
                            }
                        }
                    }
                }
            }
        };

        try {
            // Make the API request to Klaviyo
            const response = await fetch('https://a.klaviyo.com/api/events/', {
                method: 'POST',
                headers: {
                    'Authorization': `Klaviyo-API-Key ${KLAVIYO_PRIVATE_API_KEY}`,
                    'accept': 'application/json',
                    'content-type': 'application/json',
                    'revision': '2024-02-15'
                },
                body: JSON.stringify(payload)
            });

            // Get the raw response text first
            const responseText = await response.text();
            
            if (!response.ok) {
                logger.error(`Klaviyo API error for Ordered Product (${product.name}): ${response.status} ${responseText}`);
                throw new Error(`Klaviyo API error: ${response.status} ${responseText}`);
            }

            // Only try to parse as JSON if there's content to parse
            let data = {};
            if (responseText && responseText.trim()) {
                try {
                    data = JSON.parse(responseText);
                } catch (parseError) {
                    logger.warn(`Failed to parse Klaviyo response as JSON for product ${product.name}: ${responseText}`);
                    // Continue with empty data object, don't throw an error
                }
            }
            
            logger.verbose(`Sent Ordered Product event for ${product.name} (Order #${order_no})`);
            return data;
        } catch (error) {
            logger.error(`Error sending Ordered Product event for ${product.name} (Order #${order_no}): ${error.message}`);
            // For Promise.all to work properly we'll return null instead of throwing
            return null;
        }
    });

    // Execute all requests and filter out any null results
    const results = (await Promise.all(requests)).filter(Boolean);
    logger.verbose('exiting klaviyoOrderedProducts successfully');
    return results;
};

module.exports = {
    klaviyoOrderedProducts,
};