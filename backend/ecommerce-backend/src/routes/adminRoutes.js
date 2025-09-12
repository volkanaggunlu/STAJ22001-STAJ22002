const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Controllers
const adminController = require('../controllers/adminController');
const adminUserController = require('../controllers/adminUserController');
const adminProductController = require('../controllers/adminProductController');
const adminCategoryController = require('../controllers/adminCategoryController');
const adminReviewController = require('../controllers/adminReviewController');
const adminPaymentController = require('../controllers/adminPaymentController');
const adminUploadController = require('../controllers/adminUploadController');
const adminShippingController = require('../controllers/adminShippingController');

// Middleware
const { protect, admin } = require('../middleware/auth');

// Multer konfigürasyonu
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = 'public/uploads/';
    
    // URL path'ine göre klasör belirle
    if (req.url.includes('/upload/product-images') || req.url.includes('/products')) {
      uploadPath += 'products/';
    } else if (req.url.includes('/upload/category-image') || req.url.includes('/categories')) {
      uploadPath += 'categories/';
    } else if (req.url.includes('/upload/receipt-image')) {
      uploadPath += 'receipts/';
    } else if (req.url.includes('/upload/review-images')) {
      uploadPath += 'reviews/';
    } else if (req.url.includes('/upload/invoice-pdf')) {
      uploadPath += 'invoices/';
    } else {
      uploadPath += 'general/';
    }
    
    try {
      fs.mkdirSync(uploadPath, { recursive: true });
    } catch (e) {}
    console.log('🗂️ Upload destination:', uploadPath, 'for URL:', req.url);
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `${timestamp}_${random}${extension}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: function (req, file, cb) {
    // SVG'yi de ekleyelim
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    
    // SVG için ayrı mimetype kontrolü
    const allowedMimetypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'application/pdf'];
    const mimetype = allowedMimetypes.includes(file.mimetype);
    
    console.log('🔍 File:', file.originalname);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Sadece resim ve PDF dosyaları kabul edilir (JPEG, PNG, GIF, WebP, SVG, PDF)'));
    }
  }
});

// Tüm admin route'ları için auth ve admin middleware'leri
router.use(protect);
router.use(admin);

// ===== DASHBOARD & ANALYTICS =====
router.get('/dashboard', adminController.getDashboardStats);
router.get('/dashboard/stats', adminController.getDashboardQuickStats);
router.get('/analytics/sales', adminController.getSalesAnalytics);
router.get('/analytics/categories', adminController.getCategoryAnalytics);
router.get('/products/top-selling', adminController.getTopSellingProducts);

// ===== USER MANAGEMENT =====
router.get('/users', adminUserController.getAllUsers);
router.get('/users/:id', adminUserController.getUserById);
router.post('/users', adminUserController.createUser);
router.put('/users/:id', adminUserController.updateUser);
router.delete('/users/:id', adminUserController.deleteUser);
router.put('/users/:id/role', adminUserController.changeUserRole);
router.put('/users/:id/status', adminUserController.toggleUserStatus);
router.get('/users/:id/stats', adminUserController.getUserStats);

// ===== PRODUCT MANAGEMENT =====
router.get('/products', adminController.getAllProducts);
router.post('/products', upload.array('images', 10), adminProductController.createProduct);
router.put('/products/:id', upload.array('images', 10), adminProductController.updateProduct);
router.delete('/products/:id', adminProductController.deleteProduct);
router.put('/products/:id/stock', adminController.updateProductStock);
router.put('/products/:id/status', adminProductController.toggleProductStatus);
router.post('/products/bulk', adminProductController.bulkProductOperations);

// ===== CATEGORY MANAGEMENT =====
router.get('/categories', adminCategoryController.getAdminCategories);
router.post('/categories', upload.single('image'), adminCategoryController.createAdminCategory);
router.put('/categories/:id', upload.single('image'), adminCategoryController.updateAdminCategory);
router.delete('/categories/:id', adminCategoryController.deleteAdminCategory);
router.put('/categories/sort', adminCategoryController.updateCategorySort);
router.put('/categories/:id/status', adminCategoryController.toggleCategoryStatus);
router.post('/categories/bulk', adminCategoryController.bulkCategoryOperations);

// ===== ORDER MANAGEMENT =====
router.get('/orders', adminController.getAllOrders);
router.get('/orders/:id', adminController.getOrderById);
router.put('/orders/:id/status', adminController.updateOrderStatus);
router.put('/orders/:id/tracking', adminController.addTrackingNumber);
router.put('/orders/:orderId/payment-status', adminController.updatePaymentStatus);

// ===== REVIEW MANAGEMENT =====
router.get('/reviews', adminReviewController.getAdminReviews);
router.get('/reviews/:id', adminReviewController.getAdminReviewById);
router.put('/reviews/:id/approve', adminReviewController.approveReview);
router.put('/reviews/:id/reject', adminReviewController.rejectReview);
router.delete('/reviews/:id', adminReviewController.deleteReview);
router.post('/reviews/bulk', adminReviewController.bulkReviewOperations);
router.get('/reviews/stats', adminReviewController.getReviewStats);

// ===== PAYMENT MANAGEMENT =====
router.get('/payments', adminPaymentController.getAdminPayments);
router.get('/payments/:id', adminPaymentController.getAdminPaymentById);
router.put('/payments/:id/approve', adminPaymentController.approveBankTransfer);
router.put('/payments/:id/reject', adminPaymentController.rejectBankTransfer);
router.get('/payments/stats', adminPaymentController.getPaymentStats);
router.post('/payments/:id/refund', adminPaymentController.initiateRefund);
router.post('/payments/bulk', adminPaymentController.bulkPaymentOperations);

// ===== SHIPPING MANAGEMENT =====
router.post('/orders/:orderId/shipping', protect, admin, adminShippingController.createOrderShipment);
router.put('/orders/:orderId/shipping/:shippingId', protect, admin, adminShippingController.updateShipment);
router.get('/orders/:orderId/shipping', protect, admin, adminShippingController.getOrderShipping);
router.get('/shipping/carriers', protect, admin, adminShippingController.getCarriers);
router.get('/shipping/track/:carrier/:trackingNumber', protect, admin, adminShippingController.trackShipment);
router.get('/shipping/label/:carrier/:trackingNumber', protect, admin, adminShippingController.downloadLabel);
router.post('/shipping/calculate', protect, admin, adminShippingController.calculateShippingCost);

// ===== FILE UPLOAD =====
router.post('/upload/product-images', upload.array('images', 10), adminUploadController.uploadProductImages);
router.post('/upload/category-image', upload.single('image'), adminUploadController.uploadCategoryImage);
router.post('/upload/receipt-image', upload.single('receipt'), adminUploadController.uploadReceiptImage);
router.post('/upload/review-images', upload.array('images', 5), adminUploadController.uploadReviewImage);
router.post('/upload/invoice-pdf', upload.single('file'), adminUploadController.uploadInvoicePdf);
router.delete('/upload/file', adminUploadController.deleteFile);
router.get('/upload/stats', adminUploadController.getUploadStats);
router.post('/upload/cleanup', adminUploadController.cleanupTempFiles);

// ===== SYSTEM MANAGEMENT =====
router.get('/system/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date(),
      uptime: process.uptime(),
      memory: process.memoryUsage()
    }
  });
});

// ===== ERROR HANDLING =====
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'Dosya boyutu çok büyük (maksimum 5MB)'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Çok fazla dosya yüklendi'
      });
    }
  }
  
  if (error.message === 'Sadece resim ve PDF dosyaları kabul edilir (JPEG, PNG, GIF, WebP, SVG, PDF)') {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
  
  next(error);
});

module.exports = router; 