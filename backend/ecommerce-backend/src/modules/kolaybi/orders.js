// URL: https://ofis-sandbox-api.kolaybi.com/kolaybi/v1/orders
// HEADERS:
// content-type: formdata
// Channel: KOLAYBI_CHANNEL
// BODY: 
// contact_id:createAssociate(order)
// address_id:createAssociate(order).address[-1]
// order_date:{{$isoTimestamp}}
// serial_no:order.merchant_oid
// items[0][product_id]:createProduct(order.cart.products[0].product)
// items[0][quantity]:order.cart.products[0].quantity
// items[0][unit_price]:order.cart.products[0].discountedPrice
// items[0][vat_rate]:10.0 (unless it is kargo-site)

const axios = require('axios')

const Order = require('../../models/Order')
const Product = require('../../models/Product')

const { KDV, SHIPPING_COST, KOLAYBI_CHANNEL } = require("../../config/environment");
const { createAssociate } = require("./associates");
const { createProduct } = require('./products')
const { getToken } = require('./getToken')

const logger = require('../../logger/logger')

const MAX_RETRIES = 4; // Limit retries to prevent infinite loops

const createOrder = async (order) => {
    logger.verbose('entering kolaybi.createOrder')
    try {
        const token = await getToken();
        const result = await makeOrderRequest(order, token);
        const _order = await Order.findOneAndUpdate({ merchant_oid: order.merchant_oid }, { sentToKolayBi: true });
        logger.verbose('exiting kolaybi.createOrder')
        return result
    } catch (error) {
        if (error.response) {
            console.error('Error creating order:', error.response.status, error.response.data);
        } else if (error.request) {
            console.error('No response received:', error.request);
        } else {
            console.error('Error setting up request:', error.message);
        }
        throw error;
    }
};

const makeOrderRequest = async (order, token, attempt = 1) => {
    logger.verbose('entering kolaybi.makeOrderRequesst')
    const formData = await createFormData(order);
    try {
        const response = await axios({
            method: 'post',
            url: `${API_URL}/orders`,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Channel': KOLAYBI_CHANNEL,
                'Content-Type': "multipart/form-data"
            },
            data: formData
        });
        logger.verbose('exiting kolaybi.makeOrderRequest')
        return response.data.data;
    } catch (error) {
        if (error.response?.status === 401 && attempt < MAX_RETRIES) {
            const newToken = await getToken(true); // Force token refresh
            return makeOrderRequest(order, newToken, attempt + 1);
        }
        throw error;
    }
};

const createFormData = async (_order) => {
    const formData = new FormData();

    // instead of fixing the issue below (createProduct returning undefined because product is a mongoose object) I just excavate and lean
    const order = await Order.findOne({
        merchant_oid: _order.merchant_oid,
    })
        .populate({
            path: 'cart',
            populate: {
                path: 'products.product',
                model: 'Product'
            }
        })
        .lean()
        .exec();

    const associate = await createAssociate(order)

    // Add basic order details
    logger.debug('kolaybi associate:', associate)
    formData.append('contact_id', associate.id);
    formData.append('address_id', `${associate.address.slice(-1)[0].id}`);
    formData.append('order_date', new Date(order.createdAt).toISOString());
    formData.append('serial_no', order.merchant_oid);

    // STOCKMOUNT CALCULATION START
    let total_payment = order.payment_amount / 100

    let total_price = order.cart.products.reduce((total, product) => {
        if (product.product.type === "bundle") {
            return total + product.bundledProducts.reduce((bundleTotal, bundledProduct) => {
                return bundleTotal + (Number(bundledProduct.discountedPrice) || Number(bundledProduct.price));
            }, 0) * product.quantity
        }
        return total + (product.product.discountedPrice ?? product.product.price) * product.quantity
    }, 0)

    let freeShipping = !(order.freeShipping === "false" || order.freeShipping === false)
    if (!freeShipping) {
        total_payment -= SHIPPING_COST
    }

    const productsInCart = []

    const doDecreasing = total_price > total_payment || order.cart.products.some(product => product.product.type === "bundle")
    let totalDecreaseAmount = total_price - total_payment

    // take the bundled products out of bundles and put it to productsInCart
    order.cart.products.forEach(product => {
        if (product.product.type === "bundle") {
            product.bundledProducts.forEach(bundledProduct => {
                // logger.debug('Bundled product found in cart, adding to productsInCart: ', { product: bundledProduct, quantity: product.quantity });
                productsInCart.push({ product: bundledProduct, quantity: product.quantity })
            })
        }
        else {
            productsInCart.push(product)
            logger.debug(`Products in cart: ${JSON.stringify(productsInCart)}`);
        }
    })

    let productsToSend = [];
    if (doDecreasing) {
        productsInCart.forEach(product => {
            const productPrice = Number(product.product.discountedPrice) ?? Number(product.product.price)
            const productQuantity = Number(product.quantity)
            let newPrice;

            // decrease until either the totalDecreaseAmount is 0 or the product price is 10% of the original price. Factor in the quantities
            if (productPrice * productQuantity * 0.9 > totalDecreaseAmount) {
                newPrice = productPrice - totalDecreaseAmount / productQuantity
                totalDecreaseAmount = 0
            } else {
                newPrice = productPrice * 0.1
                totalDecreaseAmount -= productPrice * productQuantity * 0.9
            }

            productsToSend.push({ ...product, product: { ...product.product, discountedPrice: newPrice }, quantity: productQuantity })
            logger.debug(`product to send: ${JSON.stringify(productsToSend)}`);
        })
    }

    if (productsToSend.length === 0) {
        productsToSend = productsInCart;
    }
    // STOCKMOUNT CALCULATION END

    if (!freeShipping) {
        const kargo = await createProduct({
            slug: 'kargo',
            name: 'Kargo',
            price: SHIPPING_COST,
            vat: 20,
        })
        formData.append('items[0][product_id]', kargo.id)
        formData.append(`items[0][quantity]`, 1);
        formData.append(`items[0][unit_price]`, (100 * SHIPPING_COST) / (100 + 20));
        formData.append(`items[0][vat_rate]`, 20);
    }

    // Add items from cart
    await Promise.all(productsToSend.map(async (_product, index) => {
        const _index = order.freeShipping ? index : index + 1
        let product = _product

        if (product.product.slug === 'kedi-otu') {
            product = { quantity: product.quantity, product: await Product.findOne({ slug: 'hediye-paketi' }) }
        }

        logger.debug('productToSendToKolayBiToCreate:', product)
        const kolaybiProduct = await createProduct(product.product)
        logger.debug('kolaybiProduct:', kolaybiProduct)

        let VAT;
        if (product.product.slug === 'kargo' || product.product.slug === 'hediye-paketi' || product.product.slug === 'kedi-otu') {
            VAT = 20 // FIXED KDV/VAT - FIXED KDV VAT - FIXED VAT - FIXED VAT/KDV, AS KARGO KEDİ OTU/KEDİ NANESİ AND HEDİYE PAKETİ 
        } else {
            if (product.product.categories.some((category) => category.category === "hazir-amigurumi")) {
                VAT = 20 // FIXED KDV/VAT - FIXED KDV VAT - FIXED VAT - FIXED VAT/KDV, AS PELUŞ OYUNCAK/PELUS OYUNCAK
            } else {
                VAT = Number(KDV)
            }
        }

        formData.append('tags[0]', '245690')
        formData.append(`items[${_index}][product_id]`, kolaybiProduct.id);
        formData.append(`items[${_index}][quantity]`, product.quantity);
        formData.append(`items[${_index}][unit_price]`, product.product.discountedPrice ? ((100 * Number(product.product.discountedPrice).toFixed(2)) / (100 + VAT)).toFixed(2) : ((100 * Number(product.product.price).toFixed(2)) / (100 + VAT)).toFixed(2));
        formData.append(`items[${_index}][vat_rate]`, VAT);

        return Promise.resolve();
    }));


    return formData;
};

module.exports = {
    createOrder,
}