// Consider using Swagger or a similar tool to document your API endpoints.

// src/controllers/product.js
const Product = require('../models/Product.js');
const Category = require('../models/Category.js');
const Review = require('../models/Review.js');
const { ValidationError } = require('../errors/errors.js');
const isValidObjectId = require('../validation/isValidObjectId.js');
const logger = require('../logger/logger');
const { slugify } = require('../utils/helpers.js');
const { KDV } = require('../config/environment.js');

const createProduct = async (req, res, next) => {
  logger.verbose('Entering createProduct');
  try {
    const { 
      name, description, shortDescription, price, originalPrice, 
      discountPercentage, category, subCategories, brand, sku,
      specifications, features, type, bundleItems, bundleType,
      itemCount, seo, stock 
    } = req.body;

    // Kategori kontrolü
    if (!isValidObjectId(category)) {
      throw new ValidationError('Geçersiz kategori ID');
    }
    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      throw new ValidationError('Kategori bulunamadı');
    }

    // Alt kategorilerin kontrolü
    if (subCategories && subCategories.length > 0) {
      const invalidSubCategories = subCategories.filter(id => !isValidObjectId(id));
      if (invalidSubCategories.length > 0) {
        throw new ValidationError('Geçersiz alt kategori ID\'leri');
      }
      const subCategoryDocs = await Category.find({ _id: { $in: subCategories } });
      if (subCategoryDocs.length !== subCategories.length) {
        throw new ValidationError('Bazı alt kategoriler bulunamadı');
      }
    }

    // Slug oluştur
    const slug = slugify(name);
    const existingProduct = await Product.findOne({ slug });
    if (existingProduct) {
      throw new ValidationError('Bu isimde bir ürün zaten var: ' + name);
    }

    // Bundle kontrolü
    if (type === 'bundle' && (!bundleItems || bundleItems.length === 0)) {
      throw new ValidationError('Bundle ürünler için en az bir ürün gereklidir');
    }

    // Bundle ürünlerinin kontrolü
    if (bundleItems && bundleItems.length > 0) {
      for (const item of bundleItems) {
        if (!isValidObjectId(item.productId)) {
          throw new ValidationError('Geçersiz bundle ürün ID');
        }
        const bundleProduct = await Product.findById(item.productId);
        if (!bundleProduct) {
          throw new ValidationError(`Bundle ürün bulunamadı: ${item.productId}`);
        }
      }
    }

    // Yeni ürün oluştur
    const product = new Product({
      name,
      slug,
      description,
      shortDescription,
      price,
      originalPrice,
      discountPercentage,
      category,
      subCategories,
      brand,
      sku,
      specifications,
      features,
      type,
      bundleItems,
      bundleType,
      itemCount,
      seo,
      stock,
      images: req.files?.map(file => ({
        url: file.path,
        alt: file.originalname,
        isPrimary: false
      })) || []
    });

    await product.save();

    // Kategori istatistiklerini güncelle
    await Category.findByIdAndUpdate(category, {
      $inc: { 'stats.productCount': 1 }
    });

    if (subCategories && subCategories.length > 0) {
      await Category.updateMany(
        { _id: { $in: subCategories } },
        { $inc: { 'stats.productCount': 1 } }
      );
    }

    logger.info(`Ürün başarıyla oluşturuldu: ${product._id}`);
    res.status(201).json({ 
      success: true, 
      product: await product.populate(['category', 'subCategories']) 
    });
  } catch (error) {
    next(error);
  }
};

const getAllProducts = async (req, res, next) => {
  logger.verbose('Entering getAllProducts');
  try {
    const {
      page = 1,
      limit = 24,
      sort = 'newest',
      category,
      brand,
      search,
      minPrice,
      maxPrice,
      inStock,
      featured,
      bestseller,
      new: isNew,
      discounted,
      type,
      slug
    } = req.query;

    // Slug ile tek ürün arama
    if (slug) {
      const product = await Product.findOne({ slug, status: 'active' })
        .populate(['category', 'subCategories']);
      
      if (!product) {
        throw new ValidationError('Ürün bulunamadı');
      }

      return res.json({
        success: true,
        message: "Ürün başarıyla getirildi",
        data: { product },
        timestamp: new Date().toISOString()
      });
    }

    // Filter objesi oluştur
    let filter = { status: 'active' };

    // Kategori filtresi (slug ile)
    if (category) {
      const categoryDoc = await Category.findOne({ slug: category });
      if (categoryDoc) {
        filter.$or = [
          { category: categoryDoc._id },
          { subCategories: categoryDoc._id }
        ];
      }
    }

    // Marka filtresi
    if (brand) {
      filter.brand = new RegExp(brand, 'i');
    }

    // Arama filtresi
    if (search) {
      filter.$text = { $search: search };
    }

    // Fiyat filtresi
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Stok filtresi
    if (inStock === 'true') {
      filter['stock.quantity'] = { $gt: 0 };
    }

    // Özel filtreler
    if (featured === 'true') filter.isFeatured = true;
    if (bestseller === 'true') filter.isBestseller = true;
    if (isNew === 'true') filter.isNew = true;
    if (discounted === 'true') filter.discountPercentage = { $gt: 0 };
    if (type) filter.type = type;

    // Sıralama
    let sortObj = {};
    switch (sort) {
      case 'newest':
        sortObj = { createdAt: -1 };
        break;
      case 'popular':
        sortObj = { 'stats.views': -1, 'stats.purchases': -1 };
        break;
      case 'price_asc':
        sortObj = { price: 1 };
        break;
      case 'price_desc':
        sortObj = { price: -1 };
        break;
      case 'rating':
        sortObj = { 'rating.average': -1 };
        break;
      default:
        sortObj = { createdAt: -1 };
    }

    // Sayfalama
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Ürünleri getir
    const products = await Product.find(filter)
      .populate(['category', 'subCategories'])
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    // Toplam sayı
    const total = await Product.countDocuments(filter);
    const totalPages = Math.ceil(total / limitNum);

    // Filtre seçenekleri için kategoriler ve markalar
    const categories = await Category.find({ isActive: true })
      .select('name slug stats.productCount');
    
    const brands = await Product.distinct('brand', { status: 'active' });
    
    const priceRange = await Product.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } }
    ]);

    logger.verbose(`${products.length} ürün bulundu`);
    
    res.json({
      success: true,
      message: "Ürünler başarıyla getirildi",
      data: {
        products,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages
        },
        filters: {
          categories: categories.map(cat => ({
            id: cat._id,
            name: cat.name,
            slug: cat.slug,
            productCount: cat.stats?.productCount || 0
          })),
          brands,
          priceRange: priceRange[0] ? { min: priceRange[0].min, max: priceRange[0].max } : { min: 0, max: 1000 }
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

// Öne çıkan ürünler
const getFeaturedProducts = async (req, res, next) => {
  logger.verbose('Entering getFeaturedProducts');
  try {
    const { limit = 12 } = req.query;
    
    const products = await Product.find({ 
      isFeatured: true, 
      status: 'active' 
    })
    .populate(['category', 'subCategories'])
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

    res.json({
      success: true,
      message: "Öne çıkan ürünler başarıyla getirildi",
      data: { products },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

// En çok satanlar
const getBestsellerProducts = async (req, res, next) => {
  logger.verbose('Entering getBestsellerProducts');
  try {
    const { limit = 12 } = req.query;
    
    const products = await Product.find({ 
      isBestseller: true, 
      status: 'active' 
    })
    .populate(['category', 'subCategories'])
    .sort({ 'stats.purchases': -1 })
    .limit(parseInt(limit));

    res.json({
      success: true,
      message: "En çok satanlar başarıyla getirildi",
      data: { products },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

// Yeni ürünler
const getNewProducts = async (req, res, next) => {
  logger.verbose('Entering getNewProducts');
  try {
    const { limit = 12 } = req.query;
    
    const products = await Product.find({ 
      isNew: true, 
      status: 'active' 
    })
    .populate(['category', 'subCategories'])
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

    res.json({
      success: true,
      message: "Yeni ürünler başarıyla getirildi",
      data: { products },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

// İndirimli ürünler
const getDiscountedProducts = async (req, res, next) => {
  logger.verbose('Entering getDiscountedProducts');
  try {
    const { limit = 12 } = req.query;
    
    const products = await Product.find({ 
      discountPercentage: { $gt: 0 },
      status: 'active' 
    })
    .populate(['category', 'subCategories'])
    .sort({ discountPercentage: -1 })
    .limit(parseInt(limit));

    res.json({
      success: true,
      message: "İndirimli ürünler başarıyla getirildi",
      data: { products },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

// Bundle ürünler
const getBundleProducts = async (req, res, next) => {
  logger.verbose('Entering getBundleProducts');
  try {
    const { limit = 12 } = req.query;
    
    const products = await Product.find({ 
      type: 'bundle',
      status: 'active' 
    })
    .populate(['category', 'subCategories', 'bundleItems.productId'])
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

    res.json({
      success: true,
      message: "Bundle ürünler başarıyla getirildi",
      data: { products },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

// Ürün arama
const searchProducts = async (req, res, next) => {
  logger.verbose('Entering searchProducts');
  try {
    const { 
      q,
      page = 1, 
      limit = 24,
      sort = 'newest'
    } = req.query;

    if (!q) {
      throw new ValidationError('Arama terimi gereklidir');
    }

    // Arama filtresi
    const filter = {
      status: 'active',
      $text: { $search: q }
    };

    // Sıralama
    let sortObj = { score: { $meta: 'textScore' } };
    if (sort === 'price_asc') sortObj = { price: 1 };
    else if (sort === 'price_desc') sortObj = { price: -1 };
    else if (sort === 'rating') sortObj = { 'rating.average': -1 };
    else if (sort === 'popular') sortObj = { 'stats.views': -1 };

    // Sayfalama
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const products = await Product.find(filter)
      .populate(['category', 'subCategories'])
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    const total = await Product.countDocuments(filter);
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      message: `"${q}" için ${total} ürün bulundu`,
      data: {
        products,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages
        },
        searchTerm: q
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

// Kategoriye göre ürünler (slug ile)
const getProductsByCategorySlug = async (req, res, next) => {
  logger.verbose('Entering getProductsByCategorySlug');
  try {
    const { slug } = req.params;
    const {
      page = 1,
      limit = 24,
      sort = 'newest',
      minPrice,
      maxPrice,
      brand,
      inStock
    } = req.query;

    // Kategoriyi slug ile bul
    const category = await Category.findOne({ slug, isActive: true });
    if (!category) {
      throw new ValidationError('Kategori bulunamadı');
    }

    // Filter objesi oluştur
    let filter = {
      status: 'active',
      $or: [
        { category: category._id },
        { subCategories: category._id }
      ]
    };

    // Ek filtreler
    if (brand) filter.brand = new RegExp(brand, 'i');
    if (inStock === 'true') filter['stock.quantity'] = { $gt: 0 };
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Sıralama
    let sortObj = {};
    switch (sort) {
      case 'newest': sortObj = { createdAt: -1 }; break;
      case 'popular': sortObj = { 'stats.views': -1 }; break;
      case 'price_asc': sortObj = { price: 1 }; break;
      case 'price_desc': sortObj = { price: -1 }; break;
      case 'rating': sortObj = { 'rating.average': -1 }; break;
      default: sortObj = { createdAt: -1 };
    }

    // Sayfalama
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const products = await Product.find(filter)
      .populate(['category', 'subCategories'])
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    const total = await Product.countDocuments(filter);

    // Kategori görüntülenme sayısını artır
    await Category.findByIdAndUpdate(category._id, {
      $inc: { 'stats.viewCount': 1 }
    });

    res.json({
      success: true,
      message: `${category.name} kategorisindeki ürünler başarıyla getirildi`,
      data: {
        category,
        products,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

// Markaya göre ürünler
const getProductsByBrand = async (req, res, next) => {
  logger.verbose('Entering getProductsByBrand');
  try {
    const { brand } = req.params;
    const {
      page = 1,
      limit = 24,
      sort = 'newest',
      minPrice,
      maxPrice,
      category,
      inStock
    } = req.query;

    // Filter objesi oluştur
    let filter = {
      status: 'active',
      brand: new RegExp(brand, 'i')
    };

    // Ek filtreler
    if (category) {
      const categoryDoc = await Category.findOne({ slug: category });
      if (categoryDoc) {
        filter.$or = [
          { category: categoryDoc._id },
          { subCategories: categoryDoc._id }
        ];
      }
    }
    if (inStock === 'true') filter['stock.quantity'] = { $gt: 0 };
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Sıralama
    let sortObj = {};
    switch (sort) {
      case 'newest': sortObj = { createdAt: -1 }; break;
      case 'popular': sortObj = { 'stats.views': -1 }; break;
      case 'price_asc': sortObj = { price: 1 }; break;
      case 'price_desc': sortObj = { price: -1 }; break;
      case 'rating': sortObj = { 'rating.average': -1 }; break;
      default: sortObj = { createdAt: -1 };
    }

    // Sayfalama
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const products = await Product.find(filter)
      .populate(['category', 'subCategories'])
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      message: `${brand} markasındaki ürünler başarıyla getirildi`,
      data: {
        brand,
        products,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

// İlgili ürünler
const getRelatedProducts = async (req, res, next) => {
  logger.verbose('Entering getRelatedProducts');
  try {
    const { id } = req.params;
    const { limit = 6 } = req.query;

    if (!isValidObjectId(id)) {
      throw new ValidationError('Geçersiz ürün ID');
    }

    const product = await Product.findById(id);
    if (!product) {
      throw new ValidationError('Ürün bulunamadı');
    }

    // İlgili ürünleri bul (aynı kategori, farklı ürün)
    const relatedProducts = await Product.find({
      _id: { $ne: id },
      status: 'active',
      $or: [
        { category: product.category },
        { subCategories: { $in: product.subCategories || [] } },
        { brand: product.brand }
      ]
    })
    .populate(['category', 'subCategories'])
    .sort({ 'rating.average': -1, 'stats.views': -1 })
    .limit(parseInt(limit));

    res.json({
      success: true,
      message: "İlgili ürünler başarıyla getirildi",
      data: { products: relatedProducts },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

// Ürün yorumları
const getProductReviews = async (req, res, next) => {
  logger.verbose('Entering getProductReviews');
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!isValidObjectId(id)) {
      throw new ValidationError('Geçersiz ürün ID');
    }

    const product = await Product.findById(id);
    if (!product) {
      throw new ValidationError('Ürün bulunamadı');
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const reviews = await Review.find({ 
      productId: id,
      status: 'approved'
    })
    .populate('userId', 'firstName lastName')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

    const total = await Review.countDocuments({ 
      productId: id,
      status: 'approved'
    });

    res.json({
      success: true,
      message: "Ürün yorumları başarıyla getirildi",
      data: {
        reviews,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

// Ürün görüntüleme takibi
const incrementProductView = async (req, res, next) => {
  logger.verbose('Entering incrementProductView');
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      throw new ValidationError('Geçersiz ürün ID');
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { $inc: { 'stats.views': 1 } },
      { new: true }
    );

    if (!product) {
      throw new ValidationError('Ürün bulunamadı');
    }

    res.json({
      success: true,
      message: "Görüntülenme sayısı güncellendi",
      data: { views: product.stats.views },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

const getProductsByCategory = async (req, res, next) => {
  logger.verbose('Entering getProductsByCategory');
  try {
    const { categoryId } = req.params;
    
    if (!isValidObjectId(categoryId)) {
      throw new ValidationError('Geçersiz kategori ID');
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      throw new ValidationError('Kategori bulunamadı');
    }

    // Ana kategori veya alt kategori olarak bu kategoriyi içeren ürünleri bul
    const products = await Product.find({
      $or: [
        { category: categoryId },
        { subCategories: categoryId }
      ]
    }).populate(['category', 'subCategories']);
    
    logger.verbose(`${products.length} ürün bulundu - Kategori: ${category.name}`);
    res.json({ 
      success: true, 
      category,
      products 
    });
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  logger.verbose('Entering getProductById');
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      throw new ValidationError('Geçersiz ürün ID');
    }

    const product = await Product.findById(id)
      .populate(['category', 'subCategories']);

    if (!product) {
      throw new ValidationError('Ürün bulunamadı');
    }

    // Bundle ürünlerini populate et
    if (product.type === 'bundle' && product.bundleItems?.length > 0) {
      await product.populate('bundleItems.productId');
    }

    res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

const getProductBySlug = async (req, res, next) => {
  logger.verbose('Entering getProductBySlug');
  try {
    const { slug } = req.params;
    const product = await Product.findOne({ slug })
      .populate(['category', 'subCategories']);
    if (!product) {
      throw new ValidationError('Ürün bulunamadı');
    }

    // Bundle ürünlerini populate et
    if (product.type === 'bundle' && product.bundleItems?.length > 0) {
      await product.populate('bundleItems.productId');
    }

    // Ürün görüntülenme sayısını artır
    await Product.findByIdAndUpdate(product._id, {
      $inc: { 'stats.viewCount': 1 }
    });

    res.json({ success: true, data: {product}});
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  logger.verbose('Entering updateProduct');
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (!isValidObjectId(id)) {
      throw new ValidationError('Geçersiz ürün ID');
    }

    // Kategori kontrolü
    if (updateData.category) {
      if (!isValidObjectId(updateData.category)) {
        throw new ValidationError('Geçersiz kategori ID');
      }
      const categoryDoc = await Category.findById(updateData.category);
      if (!categoryDoc) {
        throw new ValidationError('Kategori bulunamadı');
      }
    }

    // Alt kategori kontrolü
    if (updateData.subCategories) {
      const invalidSubCategories = updateData.subCategories.filter(id => !isValidObjectId(id));
      if (invalidSubCategories.length > 0) {
        throw new ValidationError('Geçersiz alt kategori ID\'leri');
      }
      const subCategoryDocs = await Category.find({ _id: { $in: updateData.subCategories } });
      if (subCategoryDocs.length !== updateData.subCategories.length) {
        throw new ValidationError('Bazı alt kategoriler bulunamadı');
      }
    }

    // İsim değişmişse yeni slug oluştur
    if (updateData.name) {
      updateData.slug = slugify(updateData.name);
      const existingProduct = await Product.findOne({
        slug: updateData.slug,
        _id: { $ne: id }
      });
      if (existingProduct) {
        throw new ValidationError('Bu isimde başka bir ürün zaten var');
      }
    }

    // Bundle kontrolü
    if (updateData.type === 'bundle' && (!updateData.bundleItems || updateData.bundleItems.length === 0)) {
      throw new ValidationError('Bundle ürünler için en az bir ürün gereklidir');
    }

    // Bundle ürünlerinin kontrolü
    if (updateData.bundleItems) {
      for (const item of updateData.bundleItems) {
        if (!isValidObjectId(item.productId)) {
          throw new ValidationError('Geçersiz bundle ürün ID');
        }
        const bundleProduct = await Product.findById(item.productId);
        if (!bundleProduct) {
          throw new ValidationError(`Bundle ürün bulunamadı: ${item.productId}`);
        }
      }
    }

    // Yeni resimler varsa ekle
    if (req.files?.length > 0) {
      updateData.images = [
        ...(updateData.images || []),
        ...req.files.map(file => ({
          url: file.path,
          alt: file.originalname,
          isPrimary: false
        }))
      ];
    }

    // Ürünü güncelle
    const product = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!product) {
      throw new ValidationError('Ürün bulunamadı');
    }

    // Populate işlemini güvenli şekilde yap
    try {
      await product.populate(['category', 'subCategories']);
    } catch (populateError) {
      logger.warn('Category populate error:', populateError.message);
      // Populate başarısız olsa da ürün güncellenmesi başarılı
    }

    logger.info(`Ürün başarıyla güncellendi: ${product._id}`);
    res.json({ success: true, product });
  } catch (error) {
    logger.error('Update product error:', error.message, { stack: error.stack });
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  logger.verbose('Entering deleteProduct');
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      throw new ValidationError('Geçersiz ürün ID');
    }

    const product = await Product.findById(id);
    if (!product) {
      throw new ValidationError('Ürün bulunamadı');
    }

    // Kategori istatistiklerini güncelle
    await Category.findByIdAndUpdate(product.category, {
      $inc: { 'stats.productCount': -1 }
    });

    if (product.subCategories?.length > 0) {
      await Category.updateMany(
        { _id: { $in: product.subCategories } },
        { $inc: { 'stats.productCount': -1 } }
      );
    }

    await product.deleteOne();

    logger.info(`Ürün başarıyla silindi: ${id}`);
    res.json({ 
      success: true, 
      message: 'Ürün başarıyla silindi'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductsByCategory,
  getProductById,
  getProductBySlug,
  updateProduct,
  deleteProduct,
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
};
