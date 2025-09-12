const crypto = require('crypto');
const User = require('../models/User');
const { 
  generateTokenPair,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  verifyToken,
  TOKEN_TYPES
} = require('../config/jwt');
const { emailService } = require('./emailService');
const logger = require('../logger/logger');

/**
 * Authentication Service Class
 */
class AuthService {
  /**
   * Register new user
   * @param {Object} userData - User registration data
   * @returns {Object} User and tokens
   */
  async register(userData) {
    try {
      const { firstName, lastName, email, password, phone, gender } = userData;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new Error('Bu email adresi zaten kullanımda');
      }

      // Create new user
      const user = new User({
        firstName,
        lastName,
        email,
        password,
        phone,
        gender,
        isVerified: false
      });

      await user.save();

      // Generate email verification token
      const verificationToken = generateEmailVerificationToken(user);
      
      // Set verification token in user model
      user.emailVerificationToken = verificationToken;
      user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      await user.save();

      // Send verification email
      try {
        await emailService.sendEmailVerification(user, verificationToken);
      } catch (emailError) {
        logger.error('Failed to send verification email:', emailError);
        // Don't throw error, user is still created
      }

      // Generate tokens
      const tokens = generateTokenPair(user);

      logger.info(`User registered successfully: ${user.email}`);

      return {
        user: user.toObject(),
        tokens
      };
    } catch (error) {
      logger.error('Registration failed:', error);
      throw error;
    }
  }

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Object} User and tokens
   */
  async login(email, password) {
    try {
      // Find user by email
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        throw new Error('Email veya şifre hatalı');
      }

      // Check if account is locked
      if (user.isLocked) {
        throw new Error('Hesabınız geçici olarak kilitlenmiştir. Lütfen daha sonra tekrar deneyin.');
      }

      // Check password
      const isPasswordMatch = await user.comparePassword(password);
      if (!isPasswordMatch) {
        // Increment login attempts
        await user.incrementLoginAttempts();
        throw new Error('Email veya şifre hatalı');
      }

      // Reset login attempts on successful login
      if (user.loginAttempts > 0) {
        await user.updateOne({
          $unset: { loginAttempts: 1, lockUntil: 1 }
        });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate tokens
      const tokens = generateTokenPair(user);

      logger.info(`User logged in successfully: ${user.email}`);

      return {
        user: user.toObject(),
        tokens
      };
    } catch (error) {
      logger.error('Login failed:', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   * @param {string} refreshToken - Refresh token
   * @returns {Object} New tokens
   */
  async refreshToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = verifyToken(refreshToken, TOKEN_TYPES.REFRESH);
      
      // Find user
      const user = await User.findById(decoded.userId);
      if (!user) {
        throw new Error('Invalid refresh token');
      }

      // Check if user is active
      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      // Generate new tokens
      const tokens = generateTokenPair(user);

      logger.info(`Token refreshed successfully: ${user.email}`);

      return tokens;
    } catch (error) {
      logger.error('Token refresh failed:', error);
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Verify email address
   * @param {string} verificationToken - Email verification token
   * @returns {Object} Success message
   */
  async verifyEmail(verificationToken) {
    try {
      // Verify token
      const decoded = verifyToken(verificationToken, TOKEN_TYPES.EMAIL_VERIFICATION);
      
      // Find user
      const user = await User.findById(decoded.userId);
      if (!user) {
        throw new Error('Geçersiz doğrulama token\'i');
      }

      // Check if token matches and not expired
      if (user.emailVerificationToken !== verificationToken) {
        throw new Error('Geçersiz doğrulama token\'i');
      }

      if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
        throw new Error('Doğrulama token\'i süresi dolmuş');
      }

      // Mark user as verified
      user.isVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();

      // Send welcome email
      try {
        await emailService.sendWelcomeEmail(user);
      } catch (emailError) {
        logger.error('Failed to send welcome email:', emailError);
        // Don't throw error, verification is still successful
      }

      logger.info(`Email verified successfully: ${user.email}`);

      return {
        message: 'Email adresiniz başarıyla doğrulandı'
      };
    } catch (error) {
      logger.error('Email verification failed:', error);
      throw error;
    }
  }

  /**
   * Resend email verification
   * @param {string} email - User email
   * @returns {Object} Success message
   */
  async resendEmailVerification(email) {
    try {
      const user = await User.findOne({ email });
      if (!user) {
        throw new Error('Kullanıcı bulunamadı');
      }

      if (user.isVerified) {
        throw new Error('Email adresi zaten doğrulanmış');
      }

      // Generate new verification token
      const verificationToken = generateEmailVerificationToken(user);
      
      // Update user with new token
      user.emailVerificationToken = verificationToken;
      user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      await user.save();

      // Send verification email
      await emailService.sendEmailVerification(user, verificationToken);

      logger.info(`Email verification resent: ${user.email}`);

      return {
        message: 'Doğrulama emaili tekrar gönderildi'
      };
    } catch (error) {
      logger.error('Resend email verification failed:', error);
      throw error;
    }
  }

  /**
   * Send password reset email
   * @param {string} email - User email
   * @returns {Object} Success message
   */
  async forgotPassword(email) {
    try {
      const user = await User.findOne({ email });
      if (!user) {
        // Don't reveal if user exists or not
        return {
          message: 'Eğer bu email adresi kayıtlı ise, şifre sıfırlama linki gönderildi'
        };
      }

      // Generate password reset token
      const resetToken = generatePasswordResetToken(user);
      
      // Update user with reset token
      user.passwordResetToken = resetToken;
      user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await user.save();

      // Send password reset email
      await emailService.sendPasswordResetEmail(user, resetToken);

      logger.info(`Password reset email sent: ${user.email}`);

      return {
        message: 'Eğer bu email adresi kayıtlı ise, şifre sıfırlama linki gönderildi'
      };
    } catch (error) {
      logger.error('Forgot password failed:', error);
      throw error;
    }
  }

  /**
   * Reset password
   * @param {string} resetToken - Password reset token
   * @param {string} newPassword - New password
   * @returns {Object} Success message
   */
  async resetPassword(resetToken, newPassword) {
    try {
      // Verify token
      const decoded = verifyToken(resetToken, TOKEN_TYPES.PASSWORD_RESET);
      
      // Find user
      const user = await User.findById(decoded.userId);
      if (!user) {
        throw new Error('Geçersiz sıfırlama token\'i');
      }

      // Check if token matches and not expired
      if (user.passwordResetToken !== resetToken) {
        throw new Error('Geçersiz sıfırlama token\'i');
      }

      if (user.passwordResetExpires && user.passwordResetExpires < new Date()) {
        throw new Error('Sıfırlama token\'i süresi dolmuş');
      }

      // Update password
      user.password = newPassword;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      
      // Reset login attempts if any
      user.loginAttempts = undefined;
      user.lockUntil = undefined;
      
      await user.save();

      logger.info(`Password reset successfully: ${user.email}`);

      return {
        message: 'Şifreniz başarıyla güncellendi'
      };
    } catch (error) {
      logger.error('Password reset failed:', error);
      throw error;
    }
  }

  /**
   * Change password
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Object} Success message
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      // Find user
      const user = await User.findById(userId).select('+password');
      if (!user) {
        throw new Error('Kullanıcı bulunamadı');
      }

      // Check current password
      const isPasswordMatch = await user.comparePassword(currentPassword);
      if (!isPasswordMatch) {
        throw new Error('Mevcut şifre yanlış');
      }

      // Update password
      user.password = newPassword;
      await user.save();

      logger.info(`Password changed successfully: ${user.email}`);

      return {
        message: 'Şifreniz başarıyla güncellendi'
      };
    } catch (error) {
      logger.error('Password change failed:', error);
      throw error;
    }
  }

  /**
   * Get user profile
   * @param {string} userId - User ID
   * @returns {Object} User profile
   */
  async getProfile(userId) {
    try {
      const user = await User.findById(userId).populate('favorites');
      if (!user) {
        throw new Error('Kullanıcı bulunamadı');
      }

      return user.toObject();
    } catch (error) {
      logger.error('Get profile failed:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updateData - Update data
   * @returns {Object} Updated user
   */
  async updateProfile(userId, updateData) {
    try {
      const allowedUpdates = ['firstName', 'lastName', 'phone', 'birthDate', 'gender'];
      const updates = {};

      // Filter allowed updates
      Object.keys(updateData).forEach(key => {
        if (allowedUpdates.includes(key)) {
          updates[key] = updateData[key];
        }
      });

      const user = await User.findByIdAndUpdate(
        userId,
        updates,
        { new: true, runValidators: true }
      );

      if (!user) {
        throw new Error('Kullanıcı bulunamadı');
      }

      logger.info(`Profile updated successfully: ${user.email}`);

      return user.toObject();
    } catch (error) {
      logger.error('Profile update failed:', error);
      throw error;
    }
  }

  /**
   * Logout user (invalidate token)
   * @param {string} userId - User ID
   * @returns {Object} Success message
   */
  async logout(userId) {
    try {
      // In a real-world application, you might want to maintain a blacklist of tokens
      // For now, we'll just log the logout
      logger.info(`User logged out: ${userId}`);

      return {
        message: 'Başarıyla çıkış yapıldı'
      };
    } catch (error) {
      logger.error('Logout failed:', error);
      throw error;
    }
  }

  /**
   * Deactivate user account
   * @param {string} userId - User ID
   * @returns {Object} Success message
   */
  async deactivateAccount(userId) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { isActive: false },
        { new: true }
      );

      if (!user) {
        throw new Error('Kullanıcı bulunamadı');
      }

      logger.info(`Account deactivated: ${user.email}`);

      return {
        message: 'Hesabınız başarıyla deaktive edildi'
      };
    } catch (error) {
      logger.error('Account deactivation failed:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
const authService = new AuthService();

module.exports = authService; 