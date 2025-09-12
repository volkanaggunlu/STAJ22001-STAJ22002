// bill.js
const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
const moment = require('moment');
const Order = require('../src/models/order'); // Import the Order model
const Cart = require('../src/models/cart'); // Import Cart model. Needed for populating orders even though not mentioned in the code
const Product = require('../src/models/product'); // Import Product model. Needed for populating orders even though not mentioned in the code

// Setup MongoDB connection
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

async function queryOrdersForExcel() {
    try {
        // Query for orders with specified statuses
        const orders = await Order.find({
            status: { $in: ['paid', 'inShipment', 'delivered'] }
        })
        .populate('cart')
        .lean()
        .exec();

        // Create a new workbook and worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Orders');

        // Define columns
        worksheet.columns = [
            { header: 'Order No', key: 'order_no', width: 12 },
            { header: 'Status', key: 'status', width: 12 },
            { header: 'Customer Name', key: 'customerName', width: 20 },
            { header: 'Email', key: 'email', width: 25 },
            { header: 'Phone', key: 'phone', width: 15 },
            { header: 'Payment Amount', key: 'payment_amount', width: 15 },
            { header: 'Payment Type', key: 'payment_type', width: 12 },
            { header: 'Address', key: 'address', width: 30 },
            { header: 'City', key: 'city', width: 15 },
            { header: 'District', key: 'district', width: 15 },
            { header: 'Country', key: 'country', width: 15 },
            { header: 'Zip Code', key: 'zipCode', width: 10 },
            { header: 'Track No', key: 'track_no', width: 15 },
            { header: 'Order Date', key: 'createdAt', width: 20 },
            { header: 'Customer Note', key: 'customer_note', width: 30 }
        ];

        // Add data rows
        orders.forEach(order => {
            worksheet.addRow({
                order_no: order.order_no,
                status: order.status,
                customerName: `${order.name} ${order.surname}`,
                email: order.email,
                phone: order.phone,
                payment_amount: order.payment_amount,
                payment_type: order.payment_type,
                address: order.address,
                city: order.city,
                district: order.district,
                country: order.country,
                zipCode: order.zipCode,
                track_no: order.track_no || '',
                createdAt: moment(order.createdAt).format('YYYY-MM-DD HH:mm:ss'),
                customer_note: order.customer_note || ''
            });
        });

        // Style the header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        // Auto filter
        worksheet.autoFilter = {
            from: { row: 1, column: 1 },
            to: { row: 1, column: worksheet.columns.length }
        };

        return {
            workbook,
            totalOrders: orders.length,
            statusCounts: orders.reduce((acc, order) => {
                acc[order.status] = (acc[order.status] || 0) + 1;
                return acc;
            }, {})
        };

    } catch (error) {
        console.error('Error querying orders for Excel:', error);
        throw error;
    }
}

async function generateOrdersExcel(outputPath) {
    try {
        await connectDB();
        const { workbook, totalOrders, statusCounts } = await queryOrdersForExcel();
        
        // Save the workbook
        await workbook.xlsx.writeFile(outputPath);

        console.log('Export completed successfully!');
        console.log('Total orders:', totalOrders);
        console.log('Status breakdown:', statusCounts);

        // Close the MongoDB connection
        await mongoose.connection.close();

        return {
            success: true,
            totalOrders,
            statusCounts,
            filePath: outputPath
        };
    } catch (error) {
        console.error('Failed to generate Excel file:', error);
        // Ensure connection is closed even if there's an error
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
        }
        return {
            success: false,
            error: error.message
        };
    }
}

// Execute the export
generateOrdersExcel('orders_export.xlsx');