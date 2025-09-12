const Category = require('../models/Category');
const Product = require('../models/Product');
const logger = require('../logger/logger');
const slugify = require('slugify');

/**
 * Admin kategorileri listele (hiyerarşik yapı ile)
 */
const getAdminCategories = async (req, res) => {
  try {
    const { page, limit, search, parent, status } = req.query;

    let query = {};
    
    // Arama filtresi
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Parent filtresi
    if (parent === 'root') {
      query.parent = null;
    } else if (parent) {
      query.parent = parent;
    }

    // Durum filtresi
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    let categories;
    let total;

    if (page && limit) {
      // Sayfalı sonuç
      categories = await Category.find(query)
        .populate({
          path: 'parent',
          select: 'name slug'
        })
        .populate({
          path: 'children',
          select: 'name slug isActive level sortOrder',
          populate: {
            path: 'children',
            select: 'name slug isActive level sortOrder',
            populate: {
              path: 'children',
              select: 'name slug isActive level sortOrder',
              populate: {
                path: 'children',
                select: 'name slug isActive level sortOrder',
                populate: {
                  path: 'children',
                  select: 'name slug isActive level sortOrder'
                }
              }
            }
          }
        })
        .sort({ sortOrder: 1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .lean();

      total = await Category.countDocuments(query);
    } else {
      // Tüm kategoriler (hiyerarşik yapı için)
      categories = await Category.find(query)
        .populate({
          path: 'parent',
          select: 'name slug'
        })
        .populate({
          path: 'children',
          select: 'name slug isActive level sortOrder',
          populate: {
            path: 'children',
            select: 'name slug isActive level sortOrder',
            populate: {
              path: 'children',
              select: 'name slug isActive level sortOrder',
              populate: {
                path: 'children',
                select: 'name slug isActive level sortOrder',
                populate: {
                  path: 'children',
                  select: 'name slug isActive level sortOrder'
                }
              }
            }
          }
        })
        .sort({ level: 1, sortOrder: 1, name: 1 })
        .lean();
    }

    // Her kategori için ürün sayısını hesapla (basitleştirilmiş)
    const categoriesWithStats = await Promise.all(
      categories.map(async (category) => {
        try {
          // Bu kategorideki aktif ürün sayısı - status field'ını kullan
          const activeProductCount = await Product.countDocuments({
            category: category._id,
            status: { $ne: 'discontinued' }
          });

          return {
            ...category,
            activeProductCount
          };
        } catch (err) {
          logger.warn(`Kategori ${category._id} için ürün sayısı hesaplanamadı:`, err);
          return {
            ...category,
            activeProductCount: 0
          };
        }
      })
    );

    const response = {
      success: true,
      data: {
        categories: categoriesWithStats
      }
    };

    if (page && limit) {
      response.data.pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      };
    }

    res.json(response);
  } catch (error) {
    logger.error('Get admin categories error:', error);
    res.status(500).json({
      success: false,
      error: 'Kategoriler alınırken hata oluştu',
      details: error.message
    });
  }
};

/**
 * Admin kategori oluştur
 */
const createAdminCategory = async (req, res) => {
  try {
    const categoryData = req.body;

    // Slug oluştur
    if (!categoryData.slug) {
      categoryData.slug = slugify(categoryData.name, { lower: true, strict: true });
    }

    // Slug benzersizlik kontrolü
    const existingCategory = await Category.findOne({ slug: categoryData.slug });
    if (existingCategory) {
      categoryData.slug = `${categoryData.slug}-${Date.now()}`;
    }

    // Parent kategori kontrolü ve level hesaplama
    if (categoryData.parent) {
      const parentCategory = await Category.findById(categoryData.parent);
      if (!parentCategory) {
        return res.status(400).json({
          success: false,
          error: 'Geçersiz üst kategori'
        });
      }

      // Level hesapla (max 5 seviye)
      categoryData.level = parentCategory.level + 1;
      if (categoryData.level > 5) {
        return res.status(400).json({
          success: false,
          error: 'Maksimum kategori seviyesi (5) aşıldı'
        });
      }
    } else {
      categoryData.level = 0;
    }

    // Resim dosyasını işle
    if (req.file) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      categoryData.image = {
        url: `${baseUrl}/api/uploads/categories/${req.file.filename}`,
        alt: categoryData.name
      };
    }

    // Sıralama değeri yoksa son sıra olarak ata
    if (!categoryData.sortOrder) {
      const lastCategory = await Category.findOne(
        { parent: categoryData.parent || null },
        {},
        { sort: { sortOrder: -1 } }
      );
      categoryData.sortOrder = lastCategory ? lastCategory.sortOrder + 1 : 1;
    }

    const category = new Category(categoryData);
    await category.save();

    // Parent kategoriye child ekle
    if (categoryData.parent) {
      await Category.findByIdAndUpdate(
        categoryData.parent,
        { $push: { children: category._id } }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Kategori başarıyla oluşturuldu',
      data: category
    });
  } catch (error) {
    logger.error('Create admin category error:', error);
    
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
      error: 'Kategori oluşturulurken hata oluştu'
    });
  }
};

/**
 * Admin kategori güncelle
 */
const updateAdminCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Kategori bulunamadı'
      });
    }

    // Slug güncelleme
    if (updateData.name && updateData.name !== category.name) {
      updateData.slug = slugify(updateData.name, { lower: true, strict: true });
      
      // Slug benzersizlik kontrolü
      const existingCategory = await Category.findOne({ 
        slug: updateData.slug, 
        _id: { $ne: id } 
      });
      if (existingCategory) {
        updateData.slug = `${updateData.slug}-${Date.now()}`;
      }
    }

    // Parent değişikliği kontrolü
    if (updateData.parent && updateData.parent !== category.parent?.toString()) {
      // Kendi alt kategorisi olamaz
      if (updateData.parent === id) {
        return res.status(400).json({
          success: false,
          error: 'Kategori kendi alt kategorisi olamaz'
        });
      }

      // Alt kategorilerinden biri parent olamaz
      const isChildCategory = await isDescendant(id, updateData.parent);
      if (isChildCategory) {
        return res.status(400).json({
          success: false,
          error: 'Alt kategori üst kategori olarak atanamaz'
        });
      }

      const newParent = await Category.findById(updateData.parent);
      if (!newParent) {
        return res.status(400).json({
          success: false,
          error: 'Geçersiz üst kategori'
        });
      }

      // Level hesapla
      updateData.level = newParent.level + 1;
      if (updateData.level > 5) {
        return res.status(400).json({
          success: false,
          error: 'Maksimum kategori seviyesi (5) aşıldı'
        });
      }

      // Eski parent'tan çıkar
      if (category.parent) {
        await Category.findByIdAndUpdate(
          category.parent,
          { $pull: { children: id } }
        );
      }

      // Yeni parent'a ekle
      await Category.findByIdAndUpdate(
        updateData.parent,
        { $push: { children: id } }
      );

      // Alt kategorilerin level'larını güncelle
      await updateChildrenLevels(id, updateData.level);
    }

    // Yeni resim dosyasını işle
    if (req.file) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      updateData.image = {
        url: `${baseUrl}/api/uploads/categories/${req.file.filename}`,
        alt: updateData.name || category.name
      };
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('parent', 'name').populate('children', 'name');

    res.json({
      success: true,
      message: 'Kategori başarıyla güncellendi',
      data: updatedCategory
    });
  } catch (error) {
    logger.error('Update admin category error:', error);
    
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
      error: 'Kategori güncellenirken hata oluştu'
    });
  }
};

/**
 * Admin kategori sil
 */
const deleteAdminCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Kategori bulunamadı'
      });
    }

    // Alt kategoriler var mı kontrol et
    if (category.children && category.children.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Bu kategorinin alt kategorileri var, önce onları silin'
      });
    }

    // Bu kategoride ürün var mı kontrol et
    const productCount = await Product.countDocuments({ category: id });
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        error: 'Bu kategoride ürünler bulunuyor, önce ürünleri başka kategoriye taşıyın'
      });
    }

    // Parent kategoriden çıkar
    if (category.parent) {
      await Category.findByIdAndUpdate(
        category.parent,
        { $pull: { children: id } }
      );
    }

    // Hard delete - Kategoriyi veritabanından tamamen kaldır
    await Category.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Kategori başarıyla silindi'
    });
  } catch (error) {
    logger.error('Delete admin category error:', error);
    res.status(500).json({
      success: false,
      error: 'Kategori silinirken hata oluştu'
    });
  }
};

/**
 * Kategori sıralamasını güncelle
 */
const updateCategorySort = async (req, res) => {
  try {
    const { categories } = req.body;

    if (!Array.isArray(categories)) {
      return res.status(400).json({
        success: false,
        error: 'Kategoriler array formatında olmalıdır'
      });
    }

    // Tüm güncellemeleri paralel yap
    const updatePromises = categories.map(({ id, sortOrder }) => 
      Category.findByIdAndUpdate(id, { sortOrder: parseInt(sortOrder) })
    );

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: 'Kategori sıralaması başarıyla güncellendi'
    });
  } catch (error) {
    logger.error('Update category sort error:', error);
    res.status(500).json({
      success: false,
      error: 'Kategori sıralaması güncellenirken hata oluştu'
    });
  }
};

/**
 * Kategori durumunu değiştir (aktif/pasif)
 */
const toggleCategoryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const category = await Category.findByIdAndUpdate(
      id,
      { isActive, updatedAt: new Date() },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Kategori bulunamadı'
      });
    }

    // Alt kategorileri de aynı duruma getir
    if (category.children && category.children.length > 0) {
      await Category.updateMany(
        { _id: { $in: category.children } },
        { isActive }
      );
    }

    res.json({
      success: true,
      message: `Kategori ${isActive ? 'aktif' : 'pasif'} edildi`,
      data: {
        categoryId: category._id,
        isActive: category.isActive
      }
    });
  } catch (error) {
    logger.error('Toggle category status error:', error);
    res.status(500).json({
      success: false,
      error: 'Kategori durumu değiştirilirken hata oluştu'
    });
  }
};

/**
 * Bulk kategori işlemleri (toplu aktifleştirme, deaktifleştirme, silme)
 */
const bulkCategoryOperations = async (req, res) => {
  try {
    const { action, categoryIds } = req.body;

    // Validation
    if (!action || !categoryIds || !Array.isArray(categoryIds)) {
      return res.status(400).json({
        success: false,
        error: 'Geçersiz istek formatı',
        details: 'action ve categoryIds (array) gerekli'
      });
    }

    if (!['activate', 'deactivate', 'delete'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Geçersiz işlem türü',
        details: 'action activate, deactivate veya delete olmalıdır'
      });
    }

    if (categoryIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'En az bir kategori seçilmelidir'
      });
    }

    // Duplicate ID kontrolü
    const uniqueCategoryIds = [...new Set(categoryIds)];
    if (uniqueCategoryIds.length !== categoryIds.length) {
      logger.warn('Duplicate category IDs found in bulk operation');
    }

    const results = {
      processed: 0,
      failed: 0,
      errors: []
    };

    // Her kategori için işlem yap
    for (const categoryId of uniqueCategoryIds) {
      try {
        // MongoDB ObjectID format validation
        if (!categoryId.match(/^[0-9a-fA-F]{24}$/)) {
          throw new Error('Geçersiz kategori ID formatı');
        }

        const category = await Category.findById(categoryId);
        if (!category) {
          throw new Error('Kategori bulunamadı');
        }

        switch (action) {
          case 'activate':
            await Category.findByIdAndUpdate(categoryId, { 
              isActive: true,
              updatedAt: new Date()
            });
            
            // Alt kategorileri de aktifleştir
            if (category.children && category.children.length > 0) {
              await Category.updateMany(
                { _id: { $in: category.children } },
                { isActive: true, updatedAt: new Date() }
              );
            }
            break;

          case 'deactivate':
            await Category.findByIdAndUpdate(categoryId, { 
              isActive: false,
              updatedAt: new Date()
            });
            
            // Alt kategorileri de deaktifleştir
            if (category.children && category.children.length > 0) {
              await Category.updateMany(
                { _id: { $in: category.children } },
                { isActive: false, updatedAt: new Date() }
              );
            }
            break;

          case 'delete':
            // Alt kategoriler var mı kontrol et
            if (category.children && category.children.length > 0) {
              throw new Error('Bu kategorinin alt kategorileri var, önce onları silin');
            }

            // Bu kategoride ürün var mı kontrol et
            const productCount = await Product.countDocuments({ category: categoryId });
            if (productCount > 0) {
              throw new Error('Bu kategoride ürünler bulunuyor, önce ürünleri başka kategoriye taşıyın');
            }

            // Parent kategoriden çıkar
            if (category.parent) {
              await Category.findByIdAndUpdate(
                category.parent,
                { $pull: { children: categoryId } }
              );
            }

            // Hard delete
            await Category.findByIdAndDelete(categoryId);
            break;
        }
        
        results.processed++;
        logger.info(`Bulk ${action} successful for category: ${categoryId}`);
        
      } catch (error) {
        results.failed++;
        results.errors.push({
          categoryId,
          error: error.message
        });
        logger.error(`Bulk ${action} failed for category ${categoryId}:`, error);
      }
    }

    // Response oluştur
    const isSuccess = results.failed === 0;
    const statusCode = isSuccess ? 200 : 207; // 207 Multi-Status for partial success

    res.status(statusCode).json({
      success: isSuccess,
      message: isSuccess 
        ? `Toplu ${action} işlemi başarıyla tamamlandı`
        : `Toplu ${action} işlemi kısmen tamamlandı`,
      results
    });

  } catch (error) {
    logger.error('Bulk category operations error:', error);
    res.status(500).json({
      success: false,
      error: 'Toplu işlem sırasında hata oluştu',
      details: error.message
    });
  }
};

// Yardımcı fonksiyonlar
const isDescendant = async (parentId, childId) => {
  const category = await Category.findById(childId);
  if (!category || !category.parent) return false;
  
  if (category.parent.toString() === parentId) return true;
  
  return await isDescendant(parentId, category.parent);
};

const updateChildrenLevels = async (categoryId, newLevel) => {
  const category = await Category.findById(categoryId).populate('children');
  
  if (category.children && category.children.length > 0) {
    const childLevel = newLevel + 1;
    
    // Alt kategorilerin level'larını güncelle
    await Category.updateMany(
      { _id: { $in: category.children.map(child => child._id) } },
      { level: childLevel }
    );

    // Recursive olarak alt kategorilerin de alt kategorilerini güncelle
    for (const child of category.children) {
      await updateChildrenLevels(child._id, childLevel);
    }
  }
};

module.exports = {
  getAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
  updateCategorySort,
  toggleCategoryStatus,
  bulkCategoryOperations
}; 