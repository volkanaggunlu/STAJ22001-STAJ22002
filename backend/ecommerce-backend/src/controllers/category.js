const Category = require('../models/Category');
const { ValidationError } = require('../errors/errors');
const isValidObjectId = require('../validation/isValidObjectId');
const logger = require('../logger/logger');
const { slugify } = require('../utils/helpers');

const createCategory = async (req, res, next) => {
  logger.verbose('Entering createCategory');
  try {
    const {
      name, description, parent, level,
      isActive, isVisible, isFeatured,
      showInMenu, showInFooter, sortOrder,
      filters, customFields, seo
    } = req.body;

    // Parent kategori kontrolü
    if (parent) {
      if (!isValidObjectId(parent)) {
        throw new ValidationError('Geçersiz parent kategori ID');
      }
      const parentCategory = await Category.findById(parent);
      if (!parentCategory) {
        throw new ValidationError('Parent kategori bulunamadı');
      }
    }

    // Slug oluştur
    const slug = slugify(name);
    const existingCategory = await Category.findOne({ slug });
    if (existingCategory) {
      throw new ValidationError('Bu isimde bir kategori zaten var: ' + name);
    }

    // Yeni kategori oluştur
    const category = new Category({
      name,
      slug,
      description,
      parent,
      level: level || (parent ? 1 : 0),
      isActive,
      isVisible,
      isFeatured,
      showInMenu,
      showInFooter,
      sortOrder,
      filters,
      customFields,
      seo,
      image: req.file ? {
        url: req.file.path,
        alt: req.file.originalname
      } : undefined
    });

    await category.save();
    logger.info(`Kategori başarıyla oluşturuldu: ${category._id}`);

    // Populate parent before sending response
    const populatedCategory = await category.populate('parent');
    
    res.status(201).json({
      success: true,
      category: populatedCategory
    });
  } catch (error) {
    logger.error('Kategori oluşturma hatası:', error);
    next(error);
  }
};

const getAllCategories = async (req, res, next) => {
  logger.verbose('Entering getAllCategories');
  try {
    const { tree, level, parent } = req.query;

    let query = { isActive: true };
    
    // Parent filtresi
    if (parent) {
      if (!isValidObjectId(parent)) {
        throw new ValidationError('Geçersiz parent kategori ID');
      }
      query.parent = parent;
    } else if (level !== undefined) {
      // Belirli seviyedeki kategoriler
      query.level = parseInt(level);
    }

    // Tree yapısı istenirse
    if (tree === 'true') {
      const categories = await Category.buildTree();
      return res.json({
        success: true,
        message: "Kategoriler başarıyla getirildi",
        data: { categories },
        timestamp: new Date().toISOString()
      });
    }

    // Normal liste
    const categories = await Category.find(query)
      .populate(['parent', 'children'])
      .sort('sortOrder name');

    // Response formatını güncelle
    const formattedCategories = categories.map(cat => ({
      id: cat._id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      level: cat.level,
      isActive: cat.isActive,
      productCount: cat.stats?.productCount || 0,
      image: cat.image
    }));

    logger.verbose(`${categories.length} kategori bulundu`);
    res.json({
      success: true,
      message: "Kategoriler başarıyla getirildi",
      data: { categories: formattedCategories },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

const getCategoryById = async (req, res, next) => {
  logger.verbose('Entering getCategoryById');
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      throw new ValidationError('Geçersiz kategori ID');
    }

    const category = await Category.findById(id)
      .populate(['parent', 'children']);

    if (!category) {
      throw new ValidationError('Kategori bulunamadı');
    }

    res.json({ success: true, category });
  } catch (error) {
    next(error);
  }
};

const getCategoryBySlug = async (req, res, next) => {
  logger.verbose('Entering getCategoryBySlug');
  try {
    const { slug } = req.params;

    const category = await Category.findOne({ slug })
      .populate(['parent', 'children']);

    if (!category) {
      throw new ValidationError('Kategori bulunamadı');
    }

    // Görüntülenme sayısını artır
    await Category.findByIdAndUpdate(category._id, {
      $inc: { 'stats.viewCount': 1 }
    });

    res.json({ success: true, category });
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  logger.verbose('Entering updateCategory');
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (!isValidObjectId(id)) {
      throw new ValidationError('Geçersiz kategori ID');
    }

    // Parent kategori kontrolü
    if (updateData.parent) {
      if (!isValidObjectId(updateData.parent)) {
        throw new ValidationError('Geçersiz parent kategori ID');
      }
      const parentCategory = await Category.findById(updateData.parent);
      if (!parentCategory) {
        throw new ValidationError('Parent kategori bulunamadı');
      }
      // Kendisini parent olarak seçemez
      if (updateData.parent === id) {
        throw new ValidationError('Bir kategori kendisini parent olarak seçemez');
      }
    }

    // İsim değişmişse yeni slug oluştur
    if (updateData.name) {
      updateData.slug = slugify(updateData.name);
      const existingCategory = await Category.findOne({
        slug: updateData.slug,
        _id: { $ne: id }
      });
      if (existingCategory) {
        throw new ValidationError('Bu isimde başka bir kategori zaten var');
      }
    }

    // Yeni resim varsa ekle
    if (req.file) {
      updateData.image = {
        url: req.file.path,
        alt: req.file.originalname
      };
    }

    const category = await Category.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate(['parent', 'children']);

    if (!category) {
      throw new ValidationError('Kategori bulunamadı');
    }

    logger.info(`Kategori başarıyla güncellendi: ${category._id}`);
    res.json({ success: true, category });
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  logger.verbose('Entering deleteCategory');
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      throw new ValidationError('Geçersiz kategori ID');
    }

    const category = await Category.findById(id);
    if (!category) {
      throw new ValidationError('Kategori bulunamadı');
    }

    // Alt kategorileri varsa silmeyi reddet
    if (category.children?.length > 0) {
      throw new ValidationError('Alt kategorileri olan bir kategori silinemez');
    }

    // Parent kategorinin children listesinden çıkar
    if (category.parent) {
      await Category.findByIdAndUpdate(category.parent, {
        $pull: { children: category._id }
      });
    }

    await category.deleteOne();

    logger.info(`Kategori başarıyla silindi: ${id}`);
    res.json({
      success: true,
      message: 'Kategori başarıyla silindi'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  getCategoryBySlug,
  updateCategory,
  deleteCategory
}; 