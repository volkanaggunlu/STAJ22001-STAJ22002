const multer = require('multer');
const fs = require('fs');
const path = require('path');

const logger = require('../logger/logger');
const { slugify } = require('../utils/helpers');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    logger.verbose(`Entering imageUploader multer.diskStorage.destination`);
    try {
      logger.silly(`req.params: ${JSON.stringify(req.params)}`);
      logger.silly(`req.body: ${JSON.stringify(req.body)}`);
      logger.silly(`req.url: ${req.url}`);
      
      // Standart uploads klasör yapısını kullan
      let uploadPath = 'public/uploads/';
      
      // URL veya route'a göre klasör belirle
      if (req.url && (req.url.includes('/products') || req.url.includes('/category'))) {
        if (req.url.includes('/category')) {
          uploadPath += 'categories/';
        } else {
          uploadPath += 'products/';
        }
      } else {
        // Fallback: products klasörü kullan
        uploadPath += 'products/';
      }
      
      // Klasörü oluştur
      fs.mkdirSync(uploadPath, { recursive: true });
      logger.verbose(`Directory created at multer.diskStorage.destination: ${uploadPath}`);
      console.log('🗂️ imageUploader destination:', uploadPath, 'for URL:', req.url);
      
      cb(null, uploadPath);
    } catch (error) {
      logger.error(`Error in multer.diskStorage.destination: ${error.message}`);
      cb(error);
    }
    logger.verbose(`Exiting imageUploader multer.diskStorage.destination`);
  },
  filename: function (req, file, cb) {
    // Timestamp + random string + extension formatını kullan
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const extension = path.extname(file.originalname).toLowerCase();
    const filename = `${timestamp}_${random}${extension}`;
    
    logger.verbose(`Generated filename: ${filename}`);
    cb(null, filename);
  }
});

const upload = multer({ storage: storage });

module.exports = upload;
