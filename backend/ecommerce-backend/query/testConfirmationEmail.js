const { sendPurchaseConfirmationEmail } = require('../src/modules/email/purchaseConfirmation');

const logger = require('../src/logger/logger');

const mongoose = require('mongoose');
const Order = require('../src/models/order'); // Import the Order model
const Cart = require('../src/models/cart'); // Import Cart model. Needed for populating orders even though not mentioned in the code
const Product = require('../src/models/product'); // Import Product model. Needed for populating orders even though not mentioned in the code

const MONGO_URI = 'mongodb://root:example@localhost:27017/test?authSource=admin';

const SET_SENT_TO_STOCKMOUNT = false;

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

async function sendEmails() {
    const filterDate = new Date('2025-01-10T15:00:03.090Z');
    const orders = await Order.find({
        createdAt: { $gte: filterDate },
    })
        .populate({
            path: 'cart',
            populate: {
                path: 'products.product',
                model: 'Product'
            }
        })
        .limit(1)
        .lean()
        .exec();

    logger.debug(`Found ${orders.length} orders created after ${filterDate}`);

    for (const order of orders) {
        await sendPurchaseConfirmationEmail(order);
    }

    logger.debug('All purchase confirmation emails sent');

}


async function main() {
    await connectDB();
    await sendEmails();
}

main();