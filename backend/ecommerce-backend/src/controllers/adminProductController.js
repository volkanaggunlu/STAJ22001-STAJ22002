const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const logger = require('../logger/logger');
const slugify = require('slugify');

/**
 * Admin ürün oluştur
 */
const createProduct = async (req, res) => {
  try {
    const productData = req.body;

    // Slug oluştur
    if (!productData.slug) {
      productData.slug = slugify(productData.name, { lower: true, strict: true });
    }

    // Slug benzersizlik kontrolü
    const existingProduct = await Product.findOne({ slug: productData.slug });
    if (existingProduct) {
      productData.slug = `${productData.slug}-${Date.now()}`;
    }

    // SKU benzersizlik kontrolü
    if (productData.sku) {
      const existingSku = await Product.findOne({ sku: productData.sku });
      if (existingSku) {
        return res.status(409).json({
          success: false,
          error: 'Bu SKU zaten kullanımda'
        });
      }
    }

    // Kategori kontrolü
    if (productData.category) {
      const category = await Category.findById(productData.category);
      if (!category) {
        return res.status(400).json({
          success: false,
          error: 'Geçersiz kategori'
        });
      }
    }

    // Resim dosyalarını işle
    if (req.files && req.files.length > 0) {
      productData.images = req.files.map((file, index) => ({
        url: `/uploads/products/${file.filename}`,
        alt: `${productData.name} - ${index + 1}`,
        isPrimary: index === 0
      }));
    }

    // İndirim yüzdesini hesapla
    if (productData.originalPrice && productData.price) {
      productData.discountPercentage = Math.round(
        ((productData.originalPrice - productData.price) / productData.originalPrice) * 100
      );
    }

    const product = new Product(productData);
    await product.save();

    // Kategori ürün sayısını güncelle
    if (productData.category) {
      await Category.findByIdAndUpdate(
        productData.category,
        { $inc: { 'stats.productCount': 1 } }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Ürün başarıyla oluşturuldu',
      data: product
    });
  } catch (error) {
    logger.error('Create product error:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Geçersiz veri',
        details: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Ürün oluşturulurken hata oluştu'
    });
  }
};

/**
 * Admin ürün güncelle
 */
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Ürün bulunamadı'
      });
    }

    // Slug güncelleme
    if (updateData.name && updateData.name !== product.name) {
      updateData.slug = slugify(updateData.name, { lower: true, strict: true });
      
      // Slug benzersizlik kontrolü
      const existingProduct = await Product.findOne({ 
        slug: updateData.slug, 
        _id: { $ne: id } 
      });
      if (existingProduct) {
        updateData.slug = `${updateData.slug}-${Date.now()}`;
      }
    }

    // SKU benzersizlik kontrolü
    if (updateData.sku && updateData.sku !== product.sku) {
      const existingSku = await Product.findOne({ 
        sku: updateData.sku, 
        _id: { $ne: id } 
      });
      if (existingSku) {
        return res.status(409).json({
          success: false,
          error: 'Bu SKU zaten kullanımda'
        });
      }
    }

    // Kategori kontrolü
    if (updateData.category && updateData.category !== product.category.toString()) {
      const category = await Category.findById(updateData.category);
      if (!category) {
        return res.status(400).json({
          success: false,
          error: 'Geçersiz kategori'
        });
      }

      // Eski kategoriden ürün sayısını düş
      if (product.category) {
        await Category.findByIdAndUpdate(
          product.category,
          { $inc: { 'stats.productCount': -1 } }
        );
      }

      // Yeni kategoriye ürün sayısını ekle
      await Category.findByIdAndUpdate(
        updateData.category,
        { $inc: { 'stats.productCount': 1 } }
      );
    }

    // Yeni resim dosyalarını işle
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file, index) => ({
        url: `/uploads/products/${file.filename}`,
        alt: `${updateData.name || product.name} - ${index + 1}`,
        isPrimary: index === 0 && !product.images.length
      }));
      
      // Mevcut resimlerle birleştir veya değiştir
      updateData.images = updateData.replaceImages ? newImages : [...product.images, ...newImages];
    }

    // İndirim yüzdesini hesapla
    const originalPrice = updateData.originalPrice || product.originalPrice;
    const price = updateData.price || product.price;
    if (originalPrice && price && originalPrice > price) {
      updateData.discountPercentage = Math.round(
        ((originalPrice - price) / originalPrice) * 100
      );
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('category', 'name');

    res.json({
      success: true,
      message: 'Ürün başarıyla güncellendi',
      data: updatedProduct
    });
  } catch (error) {
    logger.error('Update product error:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Geçersiz veri',
        details: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Ürün güncellenirken hata oluştu'
    });
  }
};

/**
 * Admin ürün sil
 */
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Ürün bulunamadı'
      });
    }

    // Aktif siparişlerde bu ürün var mı kontrol et
    const activeOrders = await Order.countDocuments({
      'items.productId': id,
      status: { $in: ['pending', 'confirmed', 'processing'] }
    });

    if (activeOrders > 0) {
      return res.status(400).json({
        success: false,
        error: 'Bu ürün aktif siparişlerde bulunuyor, silinemez'
      });
    }

    // Ürünü fiziksel olarak sil
    await product.deleteOne();

    // Kategori ürün sayısını güncelle
    if (product.category) {
      await Category.findByIdAndUpdate(
        product.category,
        { $inc: { 'stats.productCount': -1 } }
      );
    }

    res.json({
      success: true,
      message: 'Ürün başarıyla silindi'
    });
  } catch (error) {
    logger.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      error: 'Ürün silinirken hata oluştu'
    });
  }
};

/**
 * Toplu ürün işlemleri
 */
const bulkProductOperations = async (req, res) => {
  try {
    const { action, productIds, data } = req.body;
    console.log("---------------------------------------");
    console.log(action, productIds, data);
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Ürün IDleri gerekli'
      });
    }

    let result = {};

    switch (action) {
      case 'updateStock':
        result = await bulkUpdateStock(productIds, data);
        break;
      case 'updatePrice':
        result = await bulkUpdatePrice(productIds, data);
        break;
      case 'updateStatus':
        result = await bulkUpdateStatus(productIds, data);
        break;
      case 'delete':
        result = await bulkDeleteProducts(productIds);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Geçersiz işlem'
        });
    }

    res.json({
      success: true,
      message: 'Toplu işlem başarıyla tamamlandı',
      data: result
    });
  } catch (error) {
    logger.error('Bulk product operations error:', error);
    res.status(500).json({
      success: false,
      error: 'Toplu işlem sırasında hata oluştu'
    });
  }
};

/**
 * Ürün durumunu değiştir (aktif/pasif)
 */
const toggleProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    // isActive boolean'ını status enum'a çevir
    const status = isActive ? 'active' : 'inactive';

    const product = await Product.findByIdAndUpdate(
      id,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Ürün bulunamadı'
      });
    }

    res.json({
      success: true,
      message: `Ürün ${isActive ? 'aktif' : 'pasif'} edildi`,
      data: {
        productId: product._id,
        status: product.status,
        isActive: product.status === 'active' // Frontend uyumluluğu için
      }
    });
  } catch (error) {
    logger.error('Toggle product status error:', error);
    res.status(500).json({
      success: false,
      error: 'Ürün durumu değiştirilirken hata oluştu'
    });
  }
};

/**
 * Ürün öne çıkarma durumunu değiştir
 */
const toggleProductFeatured = async (req, res) => {
  try {
    const { id } = req.params;
    const { isFeatured } = req.body;

    const product = await Product.findByIdAndUpdate(
      id,
      { isFeatured, updatedAt: new Date() },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Ürün bulunamadı'
      });
    }

    res.json({
      success: true,
      message: `Ürün ${isFeatured ? 'öne çıkarıldı' : 'öne çıkarılmaktan çıkarıldı'}`,
      data: {
        productId: product._id,
        isFeatured: product.isFeatured
      }
    });
  } catch (error) {
    logger.error('Toggle product featured error:', error);
    res.status(500).json({
      success: false,
      error: 'Ürün öne çıkarma durumu değiştirilirken hata oluştu'
    });
  }
};

// Yardımcı fonksiyonlar
const bulkUpdateStock = async (productIds, data) => {
  const { quantity, operation = 'set' } = data;
  
  const products = await Product.find({ _id: { $in: productIds } });
  const updatePromises = products.map(product => {
    let newQuantity;
    
    switch (operation) {
      case 'add':
        newQuantity = product.stock.quantity + parseInt(quantity);
        break;
      case 'subtract':
        newQuantity = Math.max(0, product.stock.quantity - parseInt(quantity));
        break;
      case 'set':
      default:
        newQuantity = parseInt(quantity);
    }
    
    return Product.findByIdAndUpdate(product._id, {
      'stock.quantity': newQuantity,
      lastStockUpdate: new Date()
    });
  });
  
  await Promise.all(updatePromises);
  return { updatedCount: products.length };
};

const bulkUpdatePrice = async (productIds, data) => {
  const { price, originalPrice, discountPercentage } = data;
  
  const updateData = {};
  if (price) updateData.price = price;
  if (originalPrice) updateData.originalPrice = originalPrice;
  if (discountPercentage) updateData.discountPercentage = discountPercentage;
  
  const result = await Product.updateMany(
    { _id: { $in: productIds } },
    updateData
  );
  
  return { updatedCount: result.modifiedCount };
};

const bulkUpdateStatus = async (productIds, data) => {
  const { isActive, isFeatured, status } = data;
  
  const updateData = {};
  
  // Status string formatını destekle (örn: { status: 'inactive' })
  if (status && ['active', 'inactive', 'discontinued'].includes(status)) {
    updateData.status = status;
  }
  // isActive boolean formatını da destekle (geriye uyumluluk için)
  else if (typeof isActive === 'boolean') {
    updateData.status = isActive ? 'active' : 'inactive';
  }
  
  if (typeof isFeatured === 'boolean') updateData.isFeatured = isFeatured;
  
  const result = await Product.updateMany(
    { _id: { $in: productIds } },
    updateData
  );
  
  return { updatedCount: result.modifiedCount };
};

const bulkDeleteProducts = async (productIds) => {
  // Aktif siparişlerde bulunan ürünleri kontrol et
  const activeOrders = await Order.find({
    'items.productId': { $in: productIds },
    status: { $in: ['pending', 'confirmed', 'processing'] }
  }, 'items.productId');
  
  const protectedProductIds = [...new Set(
    activeOrders.flatMap(order => 
      order.items
        .filter(item => productIds.includes(item.productId.toString()))
        .map(item => item.productId.toString())
    )
  )];
  
  const deletableProductIds = productIds.filter(id => !protectedProductIds.includes(id));
  
  // Fiziksel silme
  const deleteResult = await Product.deleteMany({ _id: { $in: deletableProductIds } });
  
  // Kategorilerin ürün sayılarını güncelle
  const products = await Product.find({ _id: { $in: deletableProductIds } }, 'category');
  const categoryUpdates = {};
  
  products.forEach(product => {
    if (product.category) {
      categoryUpdates[product.category] = (categoryUpdates[product.category] || 0) + 1;
    }
  });
  
  await Promise.all(
    Object.entries(categoryUpdates).map(([categoryId, count]) =>
      Category.findByIdAndUpdate(categoryId, { $inc: { 'stats.productCount': -count } })
    )
  );
  
  return {
    deletedCount: deleteResult.deletedCount,
    protectedCount: protectedProductIds.length,
    protectedProducts: protectedProductIds
  };
};

module.exports = {
  createProduct,
  updateProduct,
  deleteProduct,
  bulkProductOperations,
  toggleProductStatus,
  toggleProductFeatured
}; 