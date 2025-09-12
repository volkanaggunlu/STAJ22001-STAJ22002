const express = require('express');
const { auth, admin } = require('../middleware/auth.js');
const { validateCategory } = require('../middleware/validate.js');
const upload = require('../services/imageUploader.js');
const {
  getAllCategories,
  getCategoryById,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/category.js');

const logger = require('../logger/logger');

const router = express.Router();

// Public Routes

// Tüm kategorileri listele (hiyerarşik yapı ile)
router.get('/', getAllCategories);

// ID ile kategori getir
router.get('/:id', getCategoryById);

// Slug ile kategori getir
router.get('/slug/:slug', getCategoryBySlug);

// Admin Routes

// Yeni kategori oluştur
router.post('/',
  auth,
  admin,
  upload.single('image'),
  validateCategory,
  createCategory
);

// Kategori güncelle
router.put('/:id',
  auth,
  admin,
  upload.single('image'),
  validateCategory,
  updateCategory
);

// Kategori sil
router.delete('/:id',
  auth,
  admin,
  deleteCategory
);

logger.info('Kategori route\'ları aktif');

module.exports = router; 