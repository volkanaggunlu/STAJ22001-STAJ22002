// src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

// Route imports
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/product');
const categoryRoutes = require('./routes/category');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/order');
const reviewRoutes = require('./routes/review');
const couponRoutes = require('./routes/couponRoutes');
const trackRoutes = require('./routes/trackRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const shippingRoutes = require('./routes/shippingRoutes');
const adminRoutes = require('./routes/adminRoutes');
const searchRoutes = require('./routes/searchRoutes');
const legalRoutes = require('./routes/legalRoutes');
const emailRoutes = require('./routes/emailRoutes');
const campaignRoutes = require('./routes/campaignRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');

// Middleware imports
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const { requireSSL, addSecurityHeaders, secureCookies } = require('./middleware/sslMiddleware');
const logger = require('./logger/logger');
const connectDB = require('./config/db');

// Swagger UI
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const openapiDocument = YAML.load(path.join(__dirname, '..', 'docs', 'openapi.yaml'));

const app = express();

app.set('trust proxy', 1);

// Connect to Database
connectDB();

// Security middleware
app.use(addSecurityHeaders);
app.use(secureCookies);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use('/api/uploads', express.static('public/uploads'));

// API Docs
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiDocument));

// SSL requirement for sensitive endpoints
app.use('/api/payments', requireSSL);
app.use('/api/orders', requireSSL);
app.use('/api/users', requireSSL);
app.use('/api/invoices', requireSSL);

// Rate limiting
app.use(apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/track', trackRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/legal', legalRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api', invoiceRoutes);
logger.info('Search routes enabled');

// Error handling
app.use(errorHandler);

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'API endpoint bulunamadı'
    },
    timestamp: new Date().toISOString()
  });
});

// Server başlatma
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('\x1b[36m%s\x1b[0m', '🚀 Server başlatıldı!');
  console.log('\x1b[32m%s\x1b[0m', `📡 API URL: http://localhost:${PORT}`);
  console.log('\x1b[33m%s\x1b[0m', `🔧 Ortam: ${process.env.NODE_ENV || 'development'}`);
  console.log('\x1b[35m%s\x1b[0m', '📚 API Endpoints:');
  console.log('\x1b[34m%s\x1b[0m', `   • Auth: http://localhost:${PORT}/api/auth`);
  console.log('\x1b[34m%s\x1b[0m', `   • Users: http://localhost:${PORT}/api/users`);
  console.log('\x1b[34m%s\x1b[0m', `   • Products: http://localhost:${PORT}/api/products`);
  console.log('\x1b[34m%s\x1b[0m', `   • Cart: http://localhost:${PORT}/api/cart`);
  console.log('\x1b[34m%s\x1b[0m', `   • Orders: http://localhost:${PORT}/api/orders`);
  console.log('\x1b[90m%s\x1b[0m', '----------------------------------------');
});

module.exports = app;

