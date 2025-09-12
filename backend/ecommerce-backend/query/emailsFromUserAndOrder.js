const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
const moment = require('moment');
const Order = require('../src/models/order'); // Import the Order model
const User = require('../src/models/user'); // Import the User model

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

async function queryEmailsForMarketing() {
    try {
        // Fetch Users and Orders
        const users = await User.find({})
            .lean()
            .exec();
        const orders = await Order.find({})
            .lean()
            .exec();

        // Normalize and combine data based on email
        const emailData = new Map(); // Map to avoid duplicate emails

        // Add users to emailData
        users.forEach(user => {
            if (user.email) {
                emailData.set(user.email, {
                    name: `${user.name} ${user.surname}`,
                    email: user.email,
                    phone: user.phone,
                    address: user.address ? `${user.address.street}, ${user.address.city}, ${user.address.state}, ${user.address.country}, ${user.address.zip}` : null,
                    source: 'User',
                });
            }
        });

        // Add orders to emailData, avoiding overwriting existing users with the same email
        orders.forEach(order => {
            if (order.email && !emailData.has(order.email)) {
                emailData.set(order.email, {
                    name: `${order.name} ${order.surname}`,
                    email: order.email,
                    phone: order.phone,
                    address: `${order.address}, ${order.city}, ${order.district}, ${order.country}, ${order.zipCode}`,
                    source: 'Order',
                });
            }
        });

        return Array.from(emailData.values()); // Convert Map to an array

    } catch (error) {
        console.error('Error querying emails for marketing:', error);
        throw error;
    }
}

async function generateMarketingExcel(outputPath) {
    try {
        await connectDB();
        const emailList = await queryEmailsForMarketing();

        // Create a new workbook and worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Marketing Emails');

        // Define columns
        worksheet.columns = [
            { header: 'Name', key: 'name', width: 20 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Phone', key: 'phone', width: 15 },
            { header: 'Address', key: 'address', width: 40 },
            { header: 'Source', key: 'source', width: 12 },
        ];

        // Add data rows
        emailList.forEach(entry => {
            worksheet.addRow(entry);
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

        // Save the workbook
        await workbook.xlsx.writeFile(outputPath);

        console.log('Marketing email export completed successfully!');
        console.log('Total unique emails:', emailList.length);

        // Close the MongoDB connection
        await mongoose.connection.close();

        return {
            success: true,
            totalEmails: emailList.length,
            filePath: outputPath
        };
    } catch (error) {
        console.error('Failed to generate marketing Excel file:', error);
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
generateMarketingExcel('marketing_emails.xlsx');
