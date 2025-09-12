const path = require('path');
const fs = require('fs').promises;
const logger = require('../logger/logger');

/**
 * Ürün resimlerini yükle
 */
const uploadProductImages = async (req, res) => {
  try {
    console.log('-----------------------------------------------');
    console.log('📁 Upload request received');
    console.log('📄 Files:', req.files);
    console.log('📋 Body:', req.body);
    if (req.files && req.files.length > 0) {
      console.log('🔍 First file mimetype:', req.files[0].mimetype);
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Hiç dosya yüklenmedi'
      });
    }

    const { productId } = req.body;
    const uploadedFiles = [];

    // Her dosyayı işle
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      
      // Dosya boyutu kontrolü (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          error: `Dosya çok büyük: ${file.originalname}. Maksimum 5MB olmalıdır.`
        });
      }

      // Dosya türü kontrolü
      if (!file.mimetype.startsWith('image/')) {
        return res.status(400).json({
          success: false,
          error: `Geçersiz dosya türü: ${file.originalname}. Sadece resim dosyaları kabul edilir.`
        });
      }

      // Benzersiz dosya adı oluştur
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 15);
      const extension = path.extname(file.originalname).toLowerCase();
      const filename = productId 
        ? `prod_${productId}_${timestamp}_${i}${extension}`
        : `temp_${timestamp}_${random}_${i}${extension}`;

      uploadedFiles.push({
        originalName: file.originalname,
        filename: file.filename,
        url: `/uploads/products/${file.filename}`,
        size: file.size,
        mimetype: file.mimetype,
        uploadedAt: new Date()
      });
    }

    res.json({
      success: true,
      message: `${uploadedFiles.length} dosya başarıyla yüklendi`,
      data: {
        uploadedFiles
      }
    });
  } catch (error) {
    logger.error('Upload product images error:', error);
    res.status(500).json({
      success: false,
      error: 'Dosya yüklenirken hata oluştu'
    });
  }
};

/**
 * Kategori resmini yükle
 */
const uploadCategoryImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Hiç dosya yüklenmedi'
      });
    }

    const file = req.file;
    const { categoryId } = req.body;

    // Dosya boyutu kontrolü (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        error: 'Dosya çok büyük. Maksimum 2MB olmalıdır.'
      });
    }

    // Dosya türü kontrolü
    if (!file.mimetype.startsWith('image/')) {
      return res.status(400).json({
        success: false,
        error: 'Geçersiz dosya türü. Sadece resim dosyaları kabul edilir.'
      });
    }

    // Benzersiz dosya adı oluştur
    const timestamp = Date.now();
    const extension = path.extname(file.originalname).toLowerCase();
    const filename = categoryId 
      ? `cat_${categoryId}_${timestamp}${extension}`
      : `temp_category_${timestamp}${extension}`;

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const uploadedFile = {
      originalName: file.originalname,
      filename: file.filename,
      url: `${baseUrl}/api/uploads/categories/${file.filename}`,
      size: file.size,
      mimetype: file.mimetype,
      uploadedAt: new Date()
    };

    res.json({
      success: true,
      message: 'Kategori resmi başarıyla yüklendi',
      data: uploadedFile
    });
  } catch (error) {
    logger.error('Upload category image error:', error);
    res.status(500).json({
      success: false,
      error: 'Kategori resmi yüklenirken hata oluştu'
    });
  }
};

/**
 * Havale dekontunu yükle
 */
const uploadReceiptImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Hiç dosya yüklenmedi'
      });
    }

    const file = req.file;
    const { orderId } = req.body;

    // Dosya boyutu kontrolü (3MB limit)
    if (file.size > 3 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        error: 'Dosya çok büyük. Maksimum 3MB olmalıdır.'
      });
    }

    // Dosya türü kontrolü
    if (!file.mimetype.startsWith('image/')) {
      return res.status(400).json({
        success: false,
        error: 'Geçersiz dosya türü. Sadece resim dosyaları kabul edilir.'
      });
    }

    // Benzersiz dosya adı oluştur
    const timestamp = Date.now();
    const extension = path.extname(file.originalname).toLowerCase();
    const filename = orderId 
      ? `receipt_${orderId}_${timestamp}${extension}`
      : `temp_receipt_${timestamp}${extension}`;

    const uploadedFile = {
      originalName: file.originalname,
      filename: file.filename,
      url: `/uploads/receipts/${file.filename}`,
      size: file.size,
      mimetype: file.mimetype,
      uploadedAt: new Date()
    };

    res.json({
      success: true,
      message: 'Dekont başarıyla yüklendi',
      data: uploadedFile
    });
  } catch (error) {
    logger.error('Upload receipt image error:', error);
    res.status(500).json({
      success: false,
      error: 'Dekont yüklenirken hata oluştu'
    });
  }
};

/**
 * Fatura PDF yükle (PDF)
 */
const uploadInvoicePdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Hiç dosya yüklenmedi' });
    }

    const file = req.file;
    // Sadece PDF kabul edelim
    if (file.mimetype !== 'application/pdf') {
      return res.status(400).json({ success: false, error: 'Sadece PDF dosyası kabul edilir' });
    }

    const url = `/uploads/invoices/${file.filename}`;
    const pathFs = `public${url}`;

    res.json({
      success: true,
      message: 'Fatura PDF başarıyla yüklendi',
      data: {
        url,
        path: pathFs,
        pdfPath: pathFs
      }
    });
  } catch (error) {
    logger.error('Upload invoice pdf error:', error);
    res.status(500).json({ success: false, error: 'Fatura PDF yüklenirken hata oluştu' });
  }
};

/**
 * Yorum resmini yükle
 */
const uploadReviewImage = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Hiç dosya yüklenmedi'
      });
    }

    const { reviewId } = req.body;
    const uploadedFiles = [];

    // Her dosyayı işle (maksimum 5 dosya)
    const files = req.files.slice(0, 5);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Dosya boyutu kontrolü (2MB limit)
      if (file.size > 2 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          error: `Dosya çok büyük: ${file.originalname}. Maksimum 2MB olmalıdır.`
        });
      }

      // Dosya türü kontrolü
      if (!file.mimetype.startsWith('image/')) {
        return res.status(400).json({
          success: false,
          error: `Geçersiz dosya türü: ${file.originalname}. Sadece resim dosyaları kabul edilir.`
        });
      }

      // Benzersiz dosya adı oluştur
      const timestamp = Date.now();
      const extension = path.extname(file.originalname).toLowerCase();
      const filename = reviewId 
        ? `review_${reviewId}_${timestamp}_${i}${extension}`
        : `temp_review_${timestamp}_${i}${extension}`;

      uploadedFiles.push({
        originalName: file.originalname,
        filename: file.filename,
        url: `/uploads/reviews/${file.filename}`,
        size: file.size,
        mimetype: file.mimetype,
        uploadedAt: new Date()
      });
    }

    res.json({
      success: true,
      message: `${uploadedFiles.length} yorum resmi başarıyla yüklendi`,
      data: {
        uploadedFiles
      }
    });
  } catch (error) {
    logger.error('Upload review images error:', error);
    res.status(500).json({
      success: false,
      error: 'Yorum resimleri yüklenirken hata oluştu'
    });
  }
};

/**
 * Dosya sil
 */
const deleteFile = async (req, res) => {
  try {
    const { filepath } = req.body;

    if (!filepath) {
      return res.status(400).json({
        success: false,
        error: 'Dosya yolu gerekli'
      });
    }

    // Güvenlik: Sadece uploads klasöründeki dosyaları sil
    if (!filepath.startsWith('/uploads/')) {
      return res.status(400).json({
        success: false,
        error: 'Geçersiz dosya yolu'
      });
    }

    // Dosya yolunu oluştur
    const fullPath = path.join(process.cwd(), 'public', filepath);

    try {
      await fs.access(fullPath);
      await fs.unlink(fullPath);
      
      res.json({
        success: true,
        message: 'Dosya başarıyla silindi'
      });
    } catch (fileError) {
      if (fileError.code === 'ENOENT') {
        return res.status(404).json({
          success: false,
          error: 'Dosya bulunamadı'
        });
      }
      throw fileError;
    }
  } catch (error) {
    logger.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      error: 'Dosya silinirken hata oluştu'
    });
  }
};

/**
 * Upload istatistikleri
 */
const getUploadStats = async (req, res) => {
  try {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    
    // Alt klasörlerin istatistiklerini hesapla
    const folders = ['products', 'categories', 'receipts', 'reviews'];
    const stats = {};

    for (const folder of folders) {
      const folderPath = path.join(uploadsDir, folder);
      
      try {
        const files = await fs.readdir(folderPath);
        let totalSize = 0;
        let fileCount = 0;

        for (const file of files) {
          const filePath = path.join(folderPath, file);
          const stat = await fs.stat(filePath);
          
          if (stat.isFile()) {
            totalSize += stat.size;
            fileCount++;
          }
        }

        stats[folder] = {
          fileCount,
          totalSize,
          totalSizeMB: Math.round(totalSize / (1024 * 1024) * 100) / 100
        };
      } catch (error) {
        stats[folder] = {
          fileCount: 0,
          totalSize: 0,
          totalSizeMB: 0
        };
      }
    }

    // Toplam istatistikler
    const totalStats = {
      totalFiles: Object.values(stats).reduce((sum, stat) => sum + stat.fileCount, 0),
      totalSize: Object.values(stats).reduce((sum, stat) => sum + stat.totalSize, 0)
    };
    totalStats.totalSizeMB = Math.round(totalStats.totalSize / (1024 * 1024) * 100) / 100;

    res.json({
      success: true,
      data: {
        folderStats: stats,
        totalStats
      }
    });
  } catch (error) {
    logger.error('Get upload stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Upload istatistikleri alınırken hata oluştu'
    });
  }
};

/**
 * Geçici dosyaları temizle
 */
const cleanupTempFiles = async (req, res) => {
  try {
    const { olderThanDays = 7 } = req.query;
    const cutoffTime = Date.now() - (parseInt(olderThanDays) * 24 * 60 * 60 * 1000);
    
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    const folders = ['products', 'categories', 'receipts', 'reviews'];
    
    let deletedCount = 0;
    let freedSpace = 0;

    for (const folder of folders) {
      const folderPath = path.join(uploadsDir, folder);
      
      try {
        const files = await fs.readdir(folderPath);
        
        for (const file of files) {
          // Geçici dosyaları kontrol et (temp_ ile başlayan)
          if (file.startsWith('temp_')) {
            const filePath = path.join(folderPath, file);
            const stat = await fs.stat(filePath);
            
            // Dosya yaratılma zamanını kontrol et
            if (stat.birthtimeMs < cutoffTime) {
              await fs.unlink(filePath);
              deletedCount++;
              freedSpace += stat.size;
            }
          }
        }
      } catch (error) {
        logger.warn(`Klasör temizlenirken hata: ${folder}`, error);
      }
    }

    res.json({
      success: true,
      message: 'Geçici dosyalar temizlendi',
      data: {
        deletedFiles: deletedCount,
        freedSpaceMB: Math.round(freedSpace / (1024 * 1024) * 100) / 100
      }
    });
  } catch (error) {
    logger.error('Cleanup temp files error:', error);
    res.status(500).json({
      success: false,
      error: 'Geçici dosyalar temizlenirken hata oluştu'
    });
  }
};

module.exports = {
  uploadProductImages,
  uploadCategoryImage,
  uploadReceiptImage,
  uploadInvoicePdf,
  uploadReviewImage,
  deleteFile,
  getUploadStats,
  cleanupTempFiles
}; 