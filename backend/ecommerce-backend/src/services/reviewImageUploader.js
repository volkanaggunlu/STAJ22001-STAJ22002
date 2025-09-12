const multer = require('multer');
const fs = require('fs');
const path = require('path');

const logger = require('../logger/logger');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    logger.verbose(`Entering reviewImageUploader multer.diskStorage.destination`);
    try {
      logger.silly(`req.params -- in multer: ${JSON.stringify(req.params)}`);
      logger.silly(`req.body -- in multer: ${JSON.stringify(req.body)}`);
      logger.silly(`req.url: ${req.url}`);
      
      // Standart uploads klasör yapısını kullan
      const uploadPath = 'public/uploads/reviews/';
      
      // Klasörü oluştur
      fs.mkdirSync(uploadPath, { recursive: true });
      logger.verbose(`Directory created at multer.diskStorage.destination: ${uploadPath}`);
      console.log('🗂️ reviewImageUploader destination:', uploadPath, 'for URL:', req.url);
      
      cb(null, uploadPath);
    } catch (error) {
      logger.error(`Error in multer.diskStorage.destination: ${error.message}`);
      cb(error);
    }
    logger.verbose(`Exiting reviewImageUploader multer.diskStorage.destination`);
  },
  filename: function (req, file, cb) {
    logger.verbose(`Entering reviewImageUploader multer.diskStorage.filename`);
    try {
      // Timestamp + random string + extension formatını kullan
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 15);
      const extension = path.extname(file.originalname).toLowerCase();
      const filename = `review_${timestamp}_${random}${extension}`;
      
      logger.verbose(`Filename generated: ${filename}`);
      req.tempFilename = filename;
      cb(null, filename);
    } catch (error) {
      logger.error(`Error in multer.diskStorage.filename: ${error.message}`);
      cb(error);
    }
    logger.verbose(`Exiting reviewImageUploader multer.diskStorage.filename`);
  }
});

const upload = multer({ storage: storage });

module.exports = upload;
