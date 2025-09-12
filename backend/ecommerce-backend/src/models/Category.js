const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Kategori adı zorunludur'],
    trim: true,
    unique: true,
    minlength: [2, 'Kategori adı en az 2 karakter olmalıdır'],
    maxlength: [100, 'Kategori adı en fazla 100 karakter olabilir']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Açıklama en fazla 500 karakter olabilir']
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  children: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    }],
    default: []
  },
  level: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  image: {
    url: {
      type: String,
      trim: true
    },
    alt: {
      type: String,
      trim: true
    }
  },
  icon: {
    type: String,
    trim: true
  },
  // SEO
  seo: {
    title: {
      type: String,
      trim: true,
      maxlength: [60, 'SEO başlık en fazla 60 karakter olabilir']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [160, 'SEO açıklama en fazla 160 karakter olabilir']
    },
    keywords: [{
      type: String,
      trim: true
    }]
  },
  // Görünüm ayarları
  isActive: {
    type: Boolean,
    default: true
  },
  isVisible: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  showInMenu: {
    type: Boolean,
    default: true
  },
  showInFooter: {
    type: Boolean,
    default: false
  },
  // Sıralama
  sortOrder: {
    type: Number,
    default: 0
  },
  // İstatistikler
  stats: {
    productCount: {
      type: Number,
      default: 0
    },
    totalSales: {
      type: Number,
      default: 0
    },
    viewCount: {
      type: Number,
      default: 0
    }
  },
  // Filtreler
  filters: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['range', 'checkbox', 'radio', 'select'],
      required: true
    },
    options: [{
      label: String,
      value: String,
      count: { type: Number, default: 0 }
    }],
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  // Özel alanlar
  customFields: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    value: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['text', 'number', 'boolean', 'url'],
      default: 'text'
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
categorySchema.index({ slug: 1 });
categorySchema.index({ parent: 1 });
categorySchema.index({ level: 1 });
categorySchema.index({ isActive: 1, isVisible: 1 });
categorySchema.index({ sortOrder: 1 });

// Virtuals
categorySchema.virtual('isParent').get(function() {
  return this.children && this.children.length > 0;
});

categorySchema.virtual('isChild').get(function() {
  return this.parent !== null;
});

categorySchema.virtual('hasProducts').get(function() {
  return this.stats && this.stats.productCount > 0;
});

categorySchema.virtual('fullPath').get(function() {
  // Bu virtual, populate edilmiş parent verisi gerektirir
  let path = [this.name];
  let current = this.parent;
  
  while (current && current.name) {
    path.unshift(current.name);
    current = current.parent;
  }
  
  return path.join(' > ');
});

// Pre-save middleware
categorySchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
  
  if (this.isModified('parent')) {
    this.updateLevel();
  }
  
  next();
});

// Post-save middleware
categorySchema.post('save', async function(doc) {
  try {
    // Parent'a child olarak ekle
    if (doc.parent) {
      const parent = await this.constructor.findById(doc.parent);
      if (parent && parent.children && !parent.children.includes(doc._id)) {
        parent.children.push(doc._id);
        await parent.save({ timestamps: false }); // Prevent infinite loop
      }
    }
  } catch (error) {
    console.error('Error in post-save middleware:', error);
  }
});

// Static methods
categorySchema.statics.findParents = function() {
  return this.find({ parent: null, isActive: true }).sort({ sortOrder: 1 });
};

categorySchema.statics.findChildren = function(parentId) {
  return this.find({ parent: parentId, isActive: true }).sort({ sortOrder: 1 });
};

categorySchema.statics.findBySlug = function(slug) {
  return this.findOne({ slug, isActive: true });
};

categorySchema.statics.findFeatured = function() {
  return this.find({ isFeatured: true, isActive: true }).sort({ sortOrder: 1 });
};

categorySchema.statics.buildTree = async function() {
  const categories = await this.find({ isActive: true }).sort({ sortOrder: 1 });
  const tree = [];
  const categoryMap = {};
  
  // Önce tüm kategorileri map'e koy
  categories.forEach(category => {
    categoryMap[category._id] = {
      ...category.toObject(),
      children: []
    };
  });
  
  // Sonra parent-child ilişkilerini kur
  categories.forEach(category => {
    if (category.parent) {
      const parent = categoryMap[category.parent];
      if (parent) {
        parent.children.push(categoryMap[category._id]);
      }
    } else {
      tree.push(categoryMap[category._id]);
    }
  });
  
  return tree;
};

// Instance methods
categorySchema.methods.updateLevel = async function() {
  if (!this.parent) {
    this.level = 0;
  } else {
    const parent = await this.constructor.findById(this.parent);
    this.level = parent ? parent.level + 1 : 0;
  }
};

categorySchema.methods.updateProductCount = async function() {
  try {
    const Product = mongoose.model('Product');
    const count = await Product.countDocuments({ 
      category: this._id,
      status: 'active' 
    });
    
    this.stats.productCount = count;
    await this.save({ timestamps: false }); // Prevent infinite loop
    return this;
  } catch (error) {
    console.error('Error updating product count:', error);
    return this;
  }
};

categorySchema.methods.getAllChildren = async function() {
  const children = await this.constructor.find({ parent: this._id });
  let allChildren = [...children];
  
  for (const child of children) {
    const grandChildren = await child.getAllChildren();
    allChildren = allChildren.concat(grandChildren);
  }
  
  return allChildren;
};

categorySchema.methods.getProducts = function() {
  const Product = mongoose.model('Product');
  return Product.find({ category: this._id, status: 'active' });
};

categorySchema.methods.incrementViews = function() {
  this.stats.viewCount += 1;
  return this.save();
};

categorySchema.methods.addFilter = function(name, type, options = []) {
  const existingFilter = this.filters.find(f => f.name === name);
  
  if (existingFilter) {
    existingFilter.type = type;
    existingFilter.options = options;
  } else {
    this.filters.push({
      name,
      type,
      options,
      isActive: true
    });
  }
  
  return this.save();
};

categorySchema.methods.removeFilter = function(name) {
  this.filters = this.filters.filter(f => f.name !== name);
  return this.save();
};

module.exports = mongoose.model('Category', categorySchema); 