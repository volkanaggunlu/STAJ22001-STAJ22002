// src/routes/products.js
const express = require('express');
const multer = require('multer');
const logger = require('../logger/logger');
const { auth, admin } = require('../middleware/auth');
const { 
  createProduct, 
  getAllProducts, 
  getProductById, 
  getProductBySlug, 
  updateProduct, 
  deleteProduct,
  getProductsByCategory,
  // Yeni fonksiyonlar
  getFeaturedProducts,
  getBestsellerProducts,
  getNewProducts,
  getDiscountedProducts,
  getBundleProducts,
  searchProducts,
  getProductsByCategorySlug,
  getProductsByBrand,
  getRelatedProducts,
  getProductReviews,
  incrementProductView
} = require('../controllers/product.js');
const { validateProduct } = require('../middleware/validate.js');
const upload = require('../services/imageUploader.js');
const { addImage, updateImage } = require('../controllers/images.js');

const router = express.Router();

// Özel endpoint'ler (önce tanımlanmalı)
// Öne çıkan ürünler
router.get('/featured', getFeaturedProducts);

// En çok satanlar
router.get('/bestsellers', getBestsellerProducts);

// Yeni ürünler
router.get('/new', getNewProducts);

// İndirimli ürünler
router.get('/discounted', getDiscountedProducts);

// Bundle ürünler
router.get('/bundles', getBundleProducts);

// Ürün arama
router.get('/search', searchProducts);

// Kategoriye göre ürünler (slug ile)
router.get('/category/:slug', getProductsByCategorySlug);

// Markaya göre ürünler
router.get('/brand/:brand', getProductsByBrand);

// İlgili ürünler
router.get('/:id/related', getRelatedProducts);

// Ürün yorumları
router.get('/:id/reviews', getProductReviews);

// Ürün görüntüleme takibi
router.post('/:id/view', incrementProductView);

// Temel CRUD endpoint'leri
// Ürün oluşturma
router.post('/', 
  auth, 
  admin, 
  upload.array('images'), 
  validateProduct, 
  createProduct
);

// Tüm ürünleri getir (gelişmiş filtrelerle)
router.get('/', getAllProducts);

// Kategoriye göre ürünleri getir (ID ile - eski endpoint)
router.get('/category/:categoryId', getProductsByCategory);

// ID'ye göre ürün getir
router.get('/id/:id', getProductById);

// Slug'a göre ürün getir
router.get('/slug/:slug', getProductBySlug);

// Ürün güncelle
router.put('/:id', 
  auth, 
  admin, 
  upload.array('images'),
  validateProduct, 
  updateProduct
);

// Ürün sil
router.delete('/:id', 
  auth, 
  admin, 
  deleteProduct
);

// Ürüne resim ekle
router.post('/images/:slug', 
  auth, 
  admin, 
  upload.single('image'), 
  (req, res, next) => {
    if (!req.file) {
      logger.error('Resim yüklenemedi');
      return res.status(400).json({
        success: false,
        message: 'Lütfen bir resim dosyası yükleyin'
      });
    }
    logger.info('Resim dosyası sisteme yüklendi, şimdi veritabanına kaydediliyor');
    next();
  }, 
  addImage
);

// Ürün resimlerini güncelle
router.post('/images', 
  auth, 
  admin, 
  updateImage
);

logger.info('Ürün ve resim route\'ları aktif');

module.exports = router;