//Implement JWT-based authentication in the auth.js middleware.

// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AuthenticationError, ValidationError } = require('../errors/errors.js');
const logger = require('../logger/logger');
const isValidObjectId = require('../validation/isValidObjectId.js');
const { JWT_CONFIG } = require('../config/jwt.js');
const { generateTokenPair } = require('../config/jwt.js');

// Kullanıcı girişi zorunlu
const protect = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    const refreshToken = req.header('Refresh-Token');

    if (!token) {
      throw new AuthenticationError('Bu işlem için giriş yapmanız gerekiyor');
    }

    try {
      // Access token'ı doğrula
      const decoded = jwt.verify(token, JWT_CONFIG.secret);
      const user = await User.findOne({ _id: decoded.userId });

      if (!user) {
        throw new AuthenticationError('Kullanıcı bulunamadı');
      }

      // Token'ın son kullanma tarihini kontrol et
      const tokenExp = decoded.exp * 1000; // Unix timestamp'i milisaniyeye çevir
      const now = Date.now();
      const timeUntilExpiry = tokenExp - now;

      // Eğer token'ın süresi 5 dakikadan az kaldıysa ve refresh token varsa
      if (timeUntilExpiry < 5 * 60 * 1000 && refreshToken) {
        try {
          // Refresh token'ı doğrula
          const decodedRefresh = jwt.verify(refreshToken, JWT_CONFIG.refreshSecret);
          
          if (decodedRefresh.userId === decoded.userId) {
            // Yeni token çifti oluştur
            const tokens = generateTokenPair(user);
            
            // Yeni token'ları response header'larına ekle
            res.setHeader('New-Access-Token', tokens.accessToken);
            res.setHeader('New-Refresh-Token', tokens.refreshToken);
          }
        } catch (refreshError) {
          logger.warn('Refresh token verification failed:', refreshError);
          // Refresh token hatası olsa bile mevcut isteğe devam et
        }
      }

      req.user = user.toJSON();
      next();
    } catch (error) {
      // Access token geçersizse ve refresh token varsa
      if (error.name === 'JsonWebTokenError' && refreshToken) {
        try {
          // Refresh token'ı doğrula
          const decodedRefresh = jwt.verify(refreshToken, JWT_CONFIG.refreshSecret);
          const user = await User.findOne({ _id: decodedRefresh.userId });

          if (!user) {
            throw new AuthenticationError('Kullanıcı bulunamadı');
          }

          // Yeni token çifti oluştur
          const tokens = generateTokenPair(user);

          // Yeni token'ları response header'larına ekle
          res.setHeader('New-Access-Token', tokens.accessToken);
          res.setHeader('New-Refresh-Token', tokens.refreshToken);

          req.user = user.toJSON();
          next();
        } catch (refreshError) {
          throw new AuthenticationError('Oturum süresi doldu, lütfen tekrar giriş yapın');
        }
      } else {
        throw error;
      }
    }
  } catch (error) {
    logger.error('Protect middleware error:', error);
    next(error);
  }
};

// Admin yetkisi kontrolü
const admin = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      throw new AuthenticationError('Bu işlem için admin yetkisi gerekiyor');
    }
    next();
  } catch (error) {
    logger.error('Admin middleware error:', error);
    next(error);
  }
};

// Genel auth middleware
const auth = async (req, res, next) => {
  logger.verbose('Entered authentication middleware');
  try {
    const isAnonymous = req.header('Authorization') ? 'false' : 'true';
    const token = req.header('Authorization')?.replace('Bearer ', '');
    const refreshToken = req.header('Refresh-Token');

    req.isAnonymous = isAnonymous;
    req.token = token;
    const session_id = req.session_id;

    if (session_id && !isValidObjectId(session_id)) {
      throw new ValidationError('Invalid session_id: ' + session_id);
    }
    
    if (req.token) {
      logger.verbose('Token provided in auth');
      try {
        const decoded = jwt.verify(req.token, JWT_CONFIG.secret);
        const user = await User.findOne({ _id: decoded.userId });

        if (!user) {
          throw new AuthenticationError('User not found');
        }

        // Token'ın son kullanma tarihini kontrol et
        const tokenExp = decoded.exp * 1000;
        const now = Date.now();
        const timeUntilExpiry = tokenExp - now;

        // Eğer token'ın süresi 5 dakikadan az kaldıysa ve refresh token varsa
        if (timeUntilExpiry < 5 * 60 * 1000 && refreshToken) {
          try {
            const decodedRefresh = jwt.verify(refreshToken, JWT_CONFIG.refreshSecret);
            
            if (decodedRefresh.userId === decoded.userId) {
              const tokens = generateTokenPair(user);
              
              res.setHeader('New-Access-Token', tokens.accessToken);
              res.setHeader('New-Refresh-Token', tokens.refreshToken);
            }
          } catch (refreshError) {
            logger.warn('Refresh token verification failed:', refreshError);
          }
        }

        req.user = user.toJSON();
        logger.info('User authenticated ' + user._id);
        return next();
      } catch (error) {
        if (error.name === 'JsonWebTokenError' && refreshToken) {
          try {
            const decodedRefresh = jwt.verify(refreshToken, JWT_CONFIG.refreshSecret);
            const user = await User.findOne({ _id: decodedRefresh.userId });

            if (!user) {
              throw new AuthenticationError('User not found');
            }

            const tokens = generateTokenPair(user);
            
            res.setHeader('New-Access-Token', tokens.accessToken);
            res.setHeader('New-Refresh-Token', tokens.refreshToken);

            req.user = user.toJSON();
            logger.info('User authenticated via refresh token ' + user._id);
            return next();
          } catch (refreshError) {
            logger.error('Refresh token verification failed:', refreshError);
          }
        }
        throw error;
      }
    }
    logger.verbose('Left authentication middleware without a user')
    return next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  auth,
  protect,
  admin
};