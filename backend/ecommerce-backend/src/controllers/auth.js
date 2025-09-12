const authService = require('../services/authService');
const logger = require('../logger/logger');

/**
 * Register new user
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    logger.verbose('Entering register controller');
    
    const result = await authService.register(req.body);
    
    logger.info(`User registered successfully: ${result.user.email}`);
    
    res.status(201).json({
      success: true,
      message: 'Kullanıcı başarıyla kaydedildi. Email doğrulama linki gönderildi.',
      data: {
        user: result.user,
        tokens: result.tokens
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Registration failed:', error);
    next(error);
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    logger.verbose('Entering login controller');
    
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    
    logger.info(`User logged in successfully: ${result.user.email}`);
    
    res.status(200).json({
      success: true,
      message: 'Başarıyla giriş yapıldı',
      data: {
        user: result.user,
        tokens: result.tokens
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Login failed:', error);
    next(error);
  }
};

/**
 * Logout user
 * POST /api/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    logger.verbose('Entering logout controller');
    
    const userId = req.user._id;
    await authService.logout(userId);
    
    logger.info(`User logged out: ${userId}`);
    
    res.status(200).json({
      success: true,
      message: 'Başarıyla çıkış yapıldı',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Logout failed:', error);
    next(error);
  }
};

/**
 * Refresh access token
 * POST /api/auth/refresh-token
 */
const refreshToken = async (req, res, next) => {
  try {
    logger.verbose('Entering refreshToken controller');
    
    const { refreshToken } = req.body;
    const tokens = await authService.refreshToken(refreshToken);
    
    logger.info('Token refreshed successfully');
    
    res.status(200).json({
      success: true,
      message: 'Token başarıyla yenilendi',
      data: {
        tokens
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Token refresh failed:', error);
    next(error);
  }
};

/**
 * Verify email address
 * POST /api/auth/verify-email
 */
const verifyEmail = async (req, res, next) => {
  try {
    logger.verbose('Entering verifyEmail controller');
    
    const { token } = req.body;
    const result = await authService.verifyEmail(token);
    
    logger.info('Email verified successfully');
    
    res.status(200).json({
      success: true,
      message: result.message,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Email verification failed:', error);
    next(error);
  }
};

/**
 * Resend email verification
 * POST /api/auth/resend-verification
 */
const resendEmailVerification = async (req, res, next) => {
  try {
    logger.verbose('Entering resendEmailVerification controller');
    
    const { email } = req.body;
    const result = await authService.resendEmailVerification(email);
    
    logger.info('Email verification resent successfully');
    
    res.status(200).json({
      success: true,
      message: result.message,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Resend email verification failed:', error);
    next(error);
  }
};

/**
 * Send password reset email
 * POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res, next) => {
  try {
    logger.verbose('Entering forgotPassword controller');
    
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    
    logger.info('Password reset email sent');
    
    res.status(200).json({
      success: true,
      message: result.message,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Forgot password failed:', error);
    next(error);
  }
};

/**
 * Reset password
 * POST /api/auth/reset-password
 */
const resetPassword = async (req, res, next) => {
  try {
    logger.verbose('Entering resetPassword controller');
    
    const { token, newPassword } = req.body;
    const result = await authService.resetPassword(token, newPassword);
    
    logger.info('Password reset successfully');
    
    res.status(200).json({
      success: true,
      message: result.message,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Password reset failed:', error);
    next(error);
  }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
const getUser = async (req, res, next) => {
  try {
    logger.verbose('Entering getUser controller');
    
    const userId = req.user._id;
    const user = await authService.getProfile(userId);
    
    logger.info(`User profile retrieved: ${userId}`);
    
    res.status(200).json({
      success: true,
      data: {
        user
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get user profile failed:', error);
    next(error);
  }
};

/**
 * Update user profile
 * PUT /api/auth/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    logger.verbose('Entering updateProfile controller');
    
    const userId = req.user._id;
    const updateData = req.body;
    const user = await authService.updateProfile(userId, updateData);
    
    logger.info(`User profile updated: ${userId}`);
    
    res.status(200).json({
      success: true,
      message: 'Profil başarıyla güncellendi',
      data: {
        user
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Update profile failed:', error);
    next(error);
  }
};

/**
 * Change user password
 * POST /api/auth/change-password
 */
const changePassword = async (req, res, next) => {
  try {
    logger.verbose('Entering changePassword controller');
    
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(userId, currentPassword, newPassword);
    
    logger.info(`Password changed for user: ${userId}`);
    
    res.status(200).json({
      success: true,
      message: 'Şifre başarıyla değiştirildi',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Change password failed:', error);
    next(error);
  }
};

/**
 * Deactivate user account
 * POST /api/auth/deactivate
 */
const deactivateAccount = async (req, res, next) => {
  try {
    logger.verbose('Entering deactivateAccount controller');
    
    const userId = req.user._id;
    await authService.deactivateAccount(userId);
    
    logger.info(`Account deactivated: ${userId}`);
    
    res.status(200).json({
      success: true,
      message: 'Hesabınız başarıyla deaktif edildi',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Account deactivation failed:', error);
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  verifyEmail,
  resendEmailVerification,
  forgotPassword,
  resetPassword,
  getUser,
  updateProfile,
  changePassword,
  deactivateAccount
};