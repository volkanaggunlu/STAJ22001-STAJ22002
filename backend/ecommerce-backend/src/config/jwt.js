const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./environment');

const JWT_CONFIG = {
  secret: process.env.JWT_SECRET,
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  accessTokenExpiry: process.env.JWT_EXPIRE || '1h',
  refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRE || '7d',
  emailVerificationExpiry: '24h',
  passwordResetExpiry: '1h',
  algorithm: 'HS256'
};

/**
 * JWT Token Types
 */
const TOKEN_TYPES = {
  ACCESS: 'access',
  REFRESH: 'refresh',
  EMAIL_VERIFICATION: 'email_verification',
  PASSWORD_RESET: 'password_reset'
};

/**
 * Generate JWT Token
 * @param {Object} payload - Token payload
 * @param {string} type - Token type (access, refresh, email_verification, password_reset)
 * @param {string} expiresIn - Token expiry time
 * @returns {string} JWT Token
 */
const generateToken = (payload, type = TOKEN_TYPES.ACCESS, expiresIn = null) => {
  const secret = type === TOKEN_TYPES.REFRESH ? JWT_CONFIG.refreshSecret : JWT_CONFIG.secret;
  
  let expiry;
  switch (type) {
    case TOKEN_TYPES.ACCESS:
      expiry = expiresIn || JWT_CONFIG.accessTokenExpiry;
      break;
    case TOKEN_TYPES.REFRESH:
      expiry = expiresIn || JWT_CONFIG.refreshTokenExpiry;
      break;
    case TOKEN_TYPES.EMAIL_VERIFICATION:
      expiry = expiresIn || JWT_CONFIG.emailVerificationExpiry;
      break;
    case TOKEN_TYPES.PASSWORD_RESET:
      expiry = expiresIn || JWT_CONFIG.passwordResetExpiry;
      break;
    default:
      expiry = JWT_CONFIG.accessTokenExpiry;
  }

  const tokenPayload = {
    ...payload,
    type,
    iat: Math.floor(Date.now() / 1000)
  };

  return jwt.sign(tokenPayload, secret, {
    expiresIn: expiry,
    algorithm: JWT_CONFIG.algorithm
  });
};

/**
 * Verify JWT Token
 * @param {string} token - JWT Token
 * @param {string} type - Token type
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token, type = TOKEN_TYPES.ACCESS) => {
  const secret = type === TOKEN_TYPES.REFRESH ? JWT_CONFIG.refreshSecret : JWT_CONFIG.secret;
  
  try {
    const decoded = jwt.verify(token, secret);
    
    // Check if token type matches
    if (decoded.type !== type) {
      throw new Error('Invalid token type');
    }
    
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * Generate Access and Refresh Token Pair
 * @param {Object} user - User object
 * @returns {Object} Token pair
 */
const generateTokenPair = (user) => {
  const payload = {
    userId: user._id,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified
  };

  const accessToken = generateToken(payload, TOKEN_TYPES.ACCESS);
  const refreshToken = generateToken(payload, TOKEN_TYPES.REFRESH);

  return {
    accessToken,
    refreshToken,
    accessTokenExpiry: JWT_CONFIG.accessTokenExpiry,
    refreshTokenExpiry: JWT_CONFIG.refreshTokenExpiry
  };
};

/**
 * Generate Email Verification Token
 * @param {Object} user - User object
 * @returns {string} Email verification token
 */
const generateEmailVerificationToken = (user) => {
  const payload = {
    userId: user._id,
    email: user.email,
    purpose: 'email_verification'
  };

  return generateToken(payload, TOKEN_TYPES.EMAIL_VERIFICATION);
};

/**
 * Generate Password Reset Token
 * @param {Object} user - User object
 * @returns {string} Password reset token
 */
const generatePasswordResetToken = (user) => {
  const payload = {
    userId: user._id,
    email: user.email,
    purpose: 'password_reset'
  };

  return generateToken(payload, TOKEN_TYPES.PASSWORD_RESET);
};

/**
 * Decode Token Without Verification
 * @param {string} token - JWT Token
 * @returns {Object} Decoded token payload
 */
const decodeToken = (token) => {
  return jwt.decode(token);
};

module.exports = {
  JWT_CONFIG,
  TOKEN_TYPES,
  generateToken,
  verifyToken,
  generateTokenPair,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  decodeToken
}; 