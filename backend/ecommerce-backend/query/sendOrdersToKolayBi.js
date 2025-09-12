const mongoose = require('mongoose');
const moment = require('moment');
const Order = require('../src/models/order'); // Import the Order model
const Cart = require('../src/models/cart'); // Import Cart model. Needed for populating orders even though not mentioned in the code
const Product = require('../src/models/product'); // Import Product model. Needed for populating orders even though not mentioned in the code
const { createOrder } = require('../src/modules/kolaybi/orders')

const MONGO_URI = 'mongodb://root:example@localhost:27017/test?authSource=admin';

async function connectDB() {
    try {
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
}

async function queryOrders() {
    try {
        // 7 Aralık 2024 - 22:28
        const filterDate = new Date('2025-03-01T08:07:00Z');
        // 19 Ocak 2025 - 20:43'e kadar gönderildi
        const endDate = new Date('2024-11-26T00:00:00Z');

        // Query for orders with specified statuses and createdDate
        const orders = await Order.find({
            status: 'delivered',//{ $in: [/*'paid', 'inShipment',*/ 'delivered'] },
            // merchant_oid: "IN173808328972383d5a548",
            createdAt: { $gte: filterDate },
            sentToKolayBi: { $ne: true },
            // sentToKolayBi: false
            // createdAt: { $gte: filterDate, $lt: endDate },
        })
            .populate({
                path: 'cart',
                populate: {
                    path: 'products.product',
                    model: 'Product'
                }
            })
            .lean()
            .skip() 
            .limit() 
            .exec();
        
        console.log('Orders queried:', orders.length);
        // console.log('orders[0]', JSON.stringify(orders[0]))
        // return [] // this causes nothing to happen thank god!
        return orders;
    } catch (error) {
        console.error('Error querying orders for Excel:', error);
        throw error;
    }
}

async function setSendToKolayBiFalse(orders) {
    for (const order of orders) {
        try {
            await Order.findOneAndUpdate({ merchant_oid: order.merchant_oid }, { sentToKolayBi: false });
        } catch (error) {
            console.error(`Error setting sentToKolayBi to false for order ${order.merchant_oid}:`, error);
        }
    }
}

// SHIT!!!! SOMETHING SEEMS STILL WRONG. I SET THE ORDER THAT MADE EMAIL WORK TO DELIVERED STATUS, DIDNT COME THRU!
async function sendOrders(orders) {
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    for (const order of orders) {
        try {
            const kolayBiOrder = await createOrder(order);
            console.log(`Order ${order.merchant_oid} sent to Kolaybi`);
            await delay(100); // Wait 2 seconds between requests
        } catch (error) {
            console.error(`Error sending order ${order.merchant_oid} to kolaybi:`, error);
        }
    }
}

async function main() {
    await connectDB();
    const orders = await queryOrders();
    await sendOrders(orders);
    // await setSendToKolayBiFalse(orders)
    console.log('sending to KolayBi COMPLETE!')
}

main();