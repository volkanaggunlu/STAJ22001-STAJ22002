
const { BASE_URL, KLAVIYO_PRIVATE_API_KEY } = require("../../config/environment");
const { formatImageURL, getTurkeyTimeISO, formatPhone } = require("../../utils/helpers");
const logger = require("../../logger/logger")

const klaviyoOrderPlacement = async (order) => {
    logger.verbose('entered klaviyoOrderPlacement')
    // Extract order details. ORDER MUST BE POPULATED
    const {
        _id,
        merchant_oid,
        cart,
        payment_amount,
        email,
        name,
        surname,
        address,
        country,
        city,
        district,
        zipCode,
        phone,
        order_no
    } = order;

    // Format items from cart products
    const items = cart.products.map(cartProduct => {
        const product = cartProduct.product;

        return {
            ProductID: product._id || '',
            SKU: product.slug || '',
            ProductName: product.name || '',
            Quantity: cartProduct.quantity,
            ItemPrice: parseFloat(product.discountedPrice || product.price || '0'),
            RowTotal: parseFloat(product.discountedPrice || product.price || '0') * cartProduct.quantity,
            ProductURL: `${BASE_URL}/urunler/${product.slug}`,
            ImageURL: formatImageURL(product.images.find(img => img.isThumbnail) || product.images[0], product.slug),
            Categories: product.categories?.map(cat => cat.category) || [],
            Brand: ''  // Add brand if available in your data model
        };
    });

    // Extract all categories across all products
    const allCategories = new Set();
    cart.products.forEach(cartProduct => {
        cartProduct.product.categories?.forEach(category => {
            if (category.category) {
                allCategories.add(category.category);
            }
        });
    });

    // Extract all product names
    const itemNames = cart.products.map(cartProduct => cartProduct.product.name).filter(Boolean);

    // Prepare the request payload
    const payload = {
        data: {
            type: "event",
            attributes: {
                properties: {
                    OrderId: order_no.toString(),
                    Categories: Array.from(allCategories),
                    merchant_oid: merchant_oid ?? '',
                    ItemNames: itemNames,
                    DiscountCode: cart.coupon || '',
                    // DiscountValue: 0, // cant calculate this rn
                    Items: items,
                    BillingAddress: {
                        FirstName: name,
                        LastName: surname,
                        Address1: address,
                        City: city,
                        RegionCode: district,
                        CountryCode: country,
                        Zip: zipCode,
                        Phone: formatPhone(phone)
                    },
                    ShippingAddress: {
                        Address1: address,
                        City: city,
                        RegionCode: district,
                        CountryCode: country,
                        Zip: zipCode
                    }
                },
                time: getTurkeyTimeISO(),
                value: Number(payment_amount) / 100,
                value_currency: "TRY",
                unique_id: order_no.toString(),  // Ensure this is a string
                metric: {
                    data: {
                        type: "metric",
                        attributes: {
                            name: "Placed Order"
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

        // Check if the response is empty before trying to parse it
        const responseText = await response.text();

        if (!response.ok) {
            throw new Error(`Klaviyo API error: ${response.status} ${responseText}`);
        }

        // Only try to parse as JSON if there's content to parse
        let data = {};
        if (responseText.trim()) {
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                logger.warn(`Failed to parse Klaviyo response as JSON: ${responseText}`);
                // Continue with empty data object, don't throw an error
            }
        }

        logger.verbose('exiting klaviyoOrderPlacement successfully');
        return data;
    } catch (error) {
        logger.error(`Error in klaviyoOrderPlacement: ${error.message}, payload: ${JSON.stringify(payload)}`);
        // Re-throw to allow calling function to handle the error
        throw error;
    }
};


module.exports = {
    klaviyoOrderPlacement,
};
