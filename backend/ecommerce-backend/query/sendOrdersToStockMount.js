const mongoose = require('mongoose');
const moment = require('moment');
const Order = require('../src/models/order'); // Import the Order model
const Cart = require('../src/models/cart'); // Import Cart model. Needed for populating orders even though not mentioned in the code
const Product = require('../src/models/product'); // Import Product model. Needed for populating orders even though not mentioned in the code
const { createStockMountOrder } = require('../src/modules/stockmount/createOrder')

const MONGO_URI = 'mongodb://root:example@localhost:27017/test?authSource=admin';

const SET_SENT_TO_STOCKMOUNT = true;

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

async function queryOrdersForStockMount() {
    try {
        // 7 Aralık 2024 - 22:28
        const filterDate = new Date('2024-11-17T12:49:00Z');
        // 19 Ocak 2025 - 20:43'e kadar gönderildi
        const endDate = new Date('2024-11-26T00:00:00Z');

        // Query for orders with specified statuses and createdDate
        const orders = await Order.find({
            status: 'delivered',//{ $in: [/*'paid', 'inShipment',*/ 'delivered'] },
            createdAt: { $gte: filterDate },
            sentToStockMount: { $ne: true }
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
            // .skip()
            .limit()
            .exec();

        console.log('Orders queried for StockMount:', orders.length);
        return orders;
    } catch (error) {
        console.error('Error querying orders for Excel:', error);
        throw error;
    }
}

async function setSendToStockMountFalse(orders) {
    for (const order of orders) {
        try {
            await Order.findOneAndUpdate({ merchant_oid: order.merchant_oid }, { sentToStockMount: false });
        } catch (error) {
            console.error(`Error setting sentToStockMount to false for order ${order.merchant_oid}:`, error);
        }
    }
}

// SHIT!!!! SOMETHING SEEMS STILL WRONG. I SET THE ORDER THAT MADE EMAIL WORK TO DELIVERED STATUS, DIDNT COME THRU!
async function sendOrdersToStockMount(orders) {
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    for (const order of orders) {
        try {
            const stockMountOrder = await createStockMountOrder(order);
            console.log(`Order ${order.merchant_oid} sent to StockMount`);
            if (!SET_SENT_TO_STOCKMOUNT) {
                await Order.findOneAndUpdate({ merchant_oid: order.merchant_oid }, { sentToStockMount: true });
                await delay(2000); // Wait 1 second between requests
            }
        } catch (error) {
            console.error(`Error sending order ${order.merchant_oid} to StockMount:`, error);
        }
    }
}

async function main() {
    await connectDB();
    const orders = await queryOrdersForStockMount();
    await sendOrdersToStockMount(orders);
    // await setSendToStockMountFalse(orders)
    console.log('sending to StockMount COMPLETE!')
}

main();