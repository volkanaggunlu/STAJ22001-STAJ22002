const { callStockAPI } = require('./apiCode');
const { ValidationError } = require('../../errors/errors');
const { KDV, STOCKMOUNT_STORE_ID, SHIPPING_COST } = require('../../config/environment');
const logger = require('../../logger/logger');
const Order = require('../../models/Order')

const PRODUCT_SOURCE_NAME = "VaryantliSM-55"
const FALLBACK_PRODUCT_ID = 76555
const SHIPPING_KDV = 20.0
const KARGO_STOCKMOUNT_ID = 67775

const castToStockMountOrderStatus = (status) => {
    logger.verbose(`Casting order status to StockMount format: ${status}`);
    // New - pending
    // Approved - paid
    // Shipped - inShipment
    // Rejected - cancelled
    // Delivered - delivered

    switch (status) {

        case 'pending':
            return 'New';
        case 'paid':
            return 'Approved';
        case 'inShipment':
            return 'Shipped';
        case 'cancelled':
            return 'Rejected';
        case 'delivered':
            return 'Delivered';
        default:
            throw new ValidationError('Invalid order status for StockMount casting');
    }
}

const castToStockMountOrder = (order) => {
    // some logic to cast the order into the format expected by the StockMount API
    // also checks the payment_amount and the products prices' sum and verifies they match
    // if the prices don't match, it reduces product prices to match the payment_amount

    // Stock Mount order format
    // {
    //     "StoreId": 74821,
    //     "Order": {
    //         "Nickname": "qustumgeym@gmail.com",
    //         "Name": "Emre Safa",
    //         "Surname": "ÇELİK",
    //         "OrderStatus": "Delivered",
    //         "Fullname": "Emre Safa ÇELİK",
    //         "Telephone": "905433613673",
    //         "Address": "Fethiye Mah. Gürbüz Sok. Ses Apt. C Blok No1 Daire5",
    //         "District": "Nilüfer",
    //         "City": "Bursa",
    //         "IntegrationOrderCode": "IN23914343253",
    //         "Notes": "Sipariş notum",
    //         "OrderDetails": [
    //             {
    //                 "ProductName": "Aşkilop Amigurumi Kiti Yeni Başlayanlar İçin Uygun Kalp Amigurumi Seti Tüm Malzemeleri İle",
    //                 "Quantity": 1,
    //                 "Price": 0.01,
    //                 "IntegrationProductCode": "203",
    //                 "OrderDetailId": "IN23914343253-0",
    //                 "ProductId": 3935299,
    //                 "Telephone": "905433613673",
    //                 "Address": "Fethiye Mah. Gürbüz Sok. Ses Apt. C Blok No1 Daire5",
    //                 "District": "Nilüfer",
    //                 "City": "Bursa",
    //                 "TaxRate": 10.0,
    //                 "ProductSourceName": "VaryantliSM-55",
    //                 "ProductCode": "203",
    //                 "Barcode": "8684663260388"
    //             }
    //         ]
    //     }
    // }

    logger.verbose(`Casting order to StockMount format: ${order.merchant_oid}`);
    logger.debug(`Order to cast: ${JSON.stringify(order)}`);

    let total_payment = order.payment_amount / 100

    let total_price = order.cart.products.reduce((total, product) => {
        if (product.product.type === "bundle") {
            return total + product.bundledProducts.reduce((bundleTotal, bundledProduct) => {
                return bundleTotal + (Number(bundledProduct.discountedPrice) || Number(bundledProduct.price));
            }, 0) * product.quantity
        }
        return total + (product.product.discountedPrice ?? product.product.price) * product.quantity
    }, 0)

    if (order.freeShipping === "false" || order.freeShipping === false) {
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

    // use newPrices if they exist, otherwise use the original prices
    const orderDetails = productsToSend.map((product, index) => {
        logger.debug(`${index}. Product to cast: ${JSON.stringify(product)}`);
        const { name, price, discountedPrice, stockMountId, _id } = product.product;
        logger.debug(`${index}. Product to cast: ${JSON.stringify({ name, price, discountedPrice, stockMountId, _id, quantity: product.quantity })}`);
    
        let newProduct = {
            Nickname: order.email,
            Name: order.name,
            Surname: order.surname,
            Fullname: `${order.name} ${order.surname}`,
            OrderDetailId: `${order.merchant_oid}-${index}`,
            ProductId: product.product.stockMountId,
            IntegrationProductCode: `SELF-${product.product._id}`,
            ProductName: product.product.name,
            Quantity: product.quantity,
            Price: (Number(product.product.discountedPrice) ?? Number(product.product.price)).toFixed(2),
            Telephone: order.phone,
            Address: order.address,
            District: order.district,
            City: order.city,
            TaxRate: KDV,
            ProductSourceName: PRODUCT_SOURCE_NAME,
        }

        if (product.isSubVariant) {
            newProduct = {
                ...newProduct,

                ProductId: product.product.stockMountVariantId ?? FALLBACK_PRODUCT_ID,
                ProductCode: "", // TODO
                VariantProductCode: "", // TODO
            }
        }

        return newProduct
    });

    if (order.freeShipping === "false" || order.freeShipping === false) {
        orderDetails.push({
            Nickname: order.email,
            Name: order.name,
            Surname: order.surname,
            Fullname: `${order.name} ${order.surname}`,
            OrderDetailId: `${order.merchant_oid}-kargo`,
            ProductId: KARGO_STOCKMOUNT_ID,
            IntegrationProductCode: `SELF-kargo-ucreti`,
            ProductName: 'Kargo Ücreti',
            Quantity: 1,
            Price: SHIPPING_COST,
            Telephone: order.phone,
            Address: order.address,
            District: order.district,
            City: order.city,
            TaxRate: SHIPPING_KDV,
            ProductSourceName: PRODUCT_SOURCE_NAME,
        })
    }

    const stockMountOrder = {
        Nickname: order.email,
        Name: order.name,
        Surname: order.surname,
        IntegrationOrderCode: order.merchant_oid + "-M",
        OrderStatus: castToStockMountOrderStatus(order.status),
        Fullname: `${order.name} ${order.surname}`,
        Telephone: order.phone,
        Address: order.address,
        District: order.district,
        City: order.city,
        // Notes: order.customer_note,
        OrderDetails: orderDetails,
        OrderDate: Date(order.createdAt),
    }

    logger.debug(`returning casted StockMount order: ${JSON.stringify(stockMountOrder)}`);
    return stockMountOrder
}

const createStockMountOrder = async (order) => {
    logger.verbose(`Creating StockMount order for order: ${order.merchant_oid}`);
    const response = await callStockAPI('Integration/SetOrder', { StoreId: STOCKMOUNT_STORE_ID, Order: castToStockMountOrder(order) });
    const _order = await Order.findOneAndUpdate({ merchant_oid: order.merchant_oid }, { sentToStockMount: true });
    return response;
}

module.exports = {
    createStockMountOrder,
}