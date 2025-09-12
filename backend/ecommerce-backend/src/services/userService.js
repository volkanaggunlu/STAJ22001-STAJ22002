const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const logger = require('../logger/logger');

/**
 * User Service Class
 */
class UserService {
  /**
   * Get user addresses
   * @param {string} userId - User ID
   * @returns {Array} User addresses
   */
  async getAddresses(userId) {
    try {
      const user = await User.findById(userId).select('addresses');
      if (!user) {
        throw new Error('Kullanıcı bulunamadı');
      }

      return user.addresses;
    } catch (error) {
      logger.error('Get addresses failed:', error);
      throw error;
    }
  }

  /**
   * Add new address
   * @param {string} userId - User ID
   * @param {Object} addressData - Address data
   * @returns {Object} Added address
   */
  async addAddress(userId, addressData) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('Kullanıcı bulunamadı');
      }

      // If this is the first address, make it default
      if (user.addresses.length === 0) {
        addressData.isDefault = true;
      }

      // If setting as default, remove default from other addresses
      if (addressData.isDefault) {
        user.addresses.forEach(addr => {
          addr.isDefault = false;
        });
      }

      user.addresses.push(addressData);
      await user.save();

      const newAddress = user.addresses[user.addresses.length - 1];
      logger.info(`Address added successfully: ${userId}`);

      return newAddress;
    } catch (error) {
      logger.error('Add address failed:', error);
      throw error;
    }
  }

  /**
   * Update address
   * @param {string} userId - User ID
   * @param {string} addressId - Address ID
   * @param {Object} updateData - Update data
   * @returns {Object} Updated address
   */
  async updateAddress(userId, addressId, updateData) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('Kullanıcı bulunamadı');
      }

      const address = user.addresses.id(addressId);
      if (!address) {
        throw new Error('Adres bulunamadı');
      }

      // If setting as default, remove default from other addresses
      if (updateData.isDefault) {
        user.addresses.forEach(addr => {
          if (addr._id.toString() !== addressId) {
            addr.isDefault = false;
          }
        });
      }

      // Update address fields
      Object.keys(updateData).forEach(key => {
        address[key] = updateData[key];
      });

      await user.save();

      logger.info(`Address updated successfully: ${userId}`);
      return address;
    } catch (error) {
      logger.error('Update address failed:', error);
      throw error;
    }
  }

  /**
   * Delete address
   * @param {string} userId - User ID
   * @param {string} addressId - Address ID
   */
  async deleteAddress(userId, addressId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('Kullanıcı bulunamadı');
      }

      const address = user.addresses.id(addressId);
      if (!address) {
        throw new Error('Adres bulunamadı');
      }

      const wasDefault = address.isDefault;
      user.addresses.id(addressId).deleteOne();

      // If deleted address was default, make first remaining address default
      if (wasDefault && user.addresses.length > 0) {
        user.addresses[0].isDefault = true;
      }

      await user.save();

      logger.info(`Address deleted successfully: ${userId}`);
    } catch (error) {
      logger.error('Delete address failed:', error);
      throw error;
    }
  }

  /**
   * Set default address
   * @param {string} userId - User ID
   * @param {string} addressId - Address ID
   * @returns {Object} Updated address
   */
  async setDefaultAddress(userId, addressId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('Kullanıcı bulunamadı');
      }

      const address = user.addresses.id(addressId);
      if (!address) {
        throw new Error('Adres bulunamadı');
      }

      // Remove default from all addresses
      user.addresses.forEach(addr => {
        addr.isDefault = false;
      });

      // Set this address as default
      address.isDefault = true;

      await user.save();

      logger.info(`Default address set successfully: ${userId}`);
      return address;
    } catch (error) {
      logger.error('Set default address failed:', error);
      throw error;
    }
  }

    /**
   * Get user favorites
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Object} Favorites with pagination
   */
  async getFavorites(userId, options = {}) {
    try {
      const { page = 1, limit = 20 } = options;
      const skip = (page - 1) * limit;

      const user = await User.findById(userId)
        .populate({
          path: 'favorites',
          select: 'name slug price originalPrice discountPercentage images category brand stock rating  ',
            populate: {          
                        path: 'category',    
                        select: 'name'      
                        }, 
          options: {
            skip,
            limit: parseInt(limit)
          }
        });

      if (!user) {
        throw new Error('Kullanıcı bulunamadı');
      }

      // Get total count for pagination

      const totalFavorites = await User.findById(userId).select('favorites');
      const total = totalFavorites.favorites.length;

      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      };

      logger.info("Favorites retrieved successfully: ${userId}");

      return {
        products: user.favorites,
        pagination
      };
    } catch (error) {
      logger.error('Get favorites failed:', error);
      throw error;
    }
  }

  /**
   * Add product to favorites
   * @param {string} userId - User ID
   * @param {string} productId - Product ID
   */
  async addToFavorites(userId, productId) {
    try {
      // Check if product exists
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error('Ürün bulunamadı');
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('Kullanıcı bulunamadı');
      }

      // Check if product is already in favorites
      if (user.favorites.includes(productId)) {
        throw new Error('Ürün zaten favorilerinizde');
      }

      user.favorites.push(productId);
      await user.save();

      logger.info(`Product added to favorites: ${userId}, ${productId}`);
    } catch (error) {
      logger.error('Add to favorites failed:', error);
      throw error;
    }
  }

  /**
   * Remove product from favorites
   * @param {string} userId - User ID
   * @param {string} productId - Product ID
   */
  async removeFromFavorites(userId, productId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('Kullanıcı bulunamadı');
      }
      
      const index = user.favorites.indexOf(productId);
      if (index === -1) {
        throw new Error('Ürün favorilerinizde değil');
      }

      user.favorites.splice(index, 1);
      await user.save();

      logger.info(`Product removed from favorites: ${userId}, ${productId}`);
    } catch (error) {
      logger.error('Remove from favorites failed:', error);
      throw error;
    }
  }

  /**
   * Remove multiple products from favorites (bulk operation)
   * @param {string} userId - User ID
   * @param {Array} productIds - Array of Product IDs
   * @returns {Object} Results of bulk operation
   */
  async bulkRemoveFromFavorites(userId, productIds) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('Kullanıcı bulunamadı');
      }

      if (!Array.isArray(productIds) || productIds.length === 0) {
        throw new Error('Geçerli ürün ID listesi göndermelisiniz');
      }

      const initialCount = user.favorites.length;
      const removedIds = [];
      const notFoundIds = [];

      // Her productId için kontrol et ve kaldır
      productIds.forEach(productId => {
        const index = user.favorites.findIndex(favId => favId.toString() === productId.toString());
        if (index !== -1) {
          user.favorites.splice(index, 1);
          removedIds.push(productId);
        } else {
          notFoundIds.push(productId);
        }
      });

      await user.save();

      const result = {
        success: true,
        removedCount: removedIds.length,
        removedIds,
        notFoundIds,
        totalProcessed: productIds.length,
        message: `${removedIds.length} ürün favorilerden çıkarıldı`
      };

      logger.info(`Bulk remove from favorites: ${userId}, removed: ${removedIds.length}, not found: ${notFoundIds.length}`);
      return result;
    } catch (error) {
      logger.error('Bulk remove from favorites failed:', error);
      throw error;
    }
  }

  /**
   * Clear all favorites for user
   * @param {string} userId - User ID
   * @returns {Object} Results of operation
   */
  async clearAllFavorites(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('Kullanıcı bulunamadı');
      }

      const initialCount = user.favorites.length;
      
      if (initialCount === 0) {
        return {
          success: true,
          removedCount: 0,
          message: 'Favorilerinizde zaten ürün bulunmuyor'
        };
      }

      // Tüm favorileri temizle
      user.favorites = [];
      await user.save();

      const result = {
        success: true,
        removedCount: initialCount,
        message: `Tüm favoriler temizlendi (${initialCount} ürün kaldırıldı)`
      };

      logger.info(`All favorites cleared for user: ${userId}, removed: ${initialCount} products`);
      return result;
    } catch (error) {
      logger.error('Clear all favorites failed:', error);
      throw error;
    }
  }

  /**
   * Get user orders
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Object} Orders with pagination
   */
  async getOrders(userId, options = {}) {
    try {
      const { page = 1, limit = 10, status } = options;
      const skip = (page - 1) * limit;

      // Build query
      const query = { user: userId };
      if (status) {
        query.status = status;
      }

      const orders = await Order.find(query)
        .populate('items.product', 'name slug images price')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Order.countDocuments(query);

      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      };

      logger.info(`Orders retrieved successfully: ${userId}`);

      return {
        orders,
        pagination
      };
    } catch (error) {
      logger.error('Get orders failed:', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   * @param {string} userId - User ID
   * @returns {Object} User statistics
   */
  async getStatistics(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('Kullanıcı bulunamadı');
      }

      // Get order statistics
      const orderStats = await Order.aggregate([
        { $match: { user: user._id } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalSpent: { $sum: '$totalAmount' },
            avgOrderValue: { $avg: '$totalAmount' }
          }
        }
      ]);

      // Get order status breakdown
      const statusBreakdown = await Order.aggregate([
        { $match: { user: user._id } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      // Get favorite products count
      const favoritesCount = user.favorites.length;

      // Get recent orders (last 5)
      const recentOrders = await Order.find({ user: userId })
        .select('orderNumber status totalAmount createdAt')
        .sort({ createdAt: -1 })
        .limit(5);

      const statistics = {
        totalOrders: orderStats[0]?.totalOrders || 0,
        totalSpent: orderStats[0]?.totalSpent || 0,
        avgOrderValue: orderStats[0]?.avgOrderValue || 0,
        favoritesCount,
        statusBreakdown: statusBreakdown.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        recentOrders,
        memberSince: user.createdAt,
        lastLogin: user.lastLogin
      };

      logger.info(`Statistics retrieved successfully: ${userId}`);

      return statistics;
    } catch (error) {
      logger.error('Get statistics failed:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Object} User object
   */
  async getUserById(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('Kullanıcı bulunamadı');
      }
      return user;
    } catch (error) {
      logger.error('Get user by ID failed:', error);
      throw error;
    }
  }

  /**
   * Get invoice addresses
   * @param {string} userId - User ID
   * @returns {Array} User invoice addresses
   */
  async getInvoiceAddresses(userId) {
    try {
      const user = await User.findById(userId).select('invoiceAddresses');
      if (!user) {
        throw new Error('Kullanıcı bulunamadı');
      }

      return user.invoiceAddresses || [];
    } catch (error) {
      logger.error('Get invoice addresses failed:', error);
      throw error;
    }
  }

  /**
   * Add invoice address
   * @param {string} userId - User ID
   * @param {Object} addressData - Invoice address data
   * @returns {Object} Added invoice address
   */
  async addInvoiceAddress(userId, addressData) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('Kullanıcı bulunamadı');
      }

      // If this is the first invoice address, make it default
      if (!user.invoiceAddresses || user.invoiceAddresses.length === 0) {
        addressData.isDefault = true;
      }

      // If setting as default, remove default from other addresses
      if (addressData.isDefault) {
        user.invoiceAddresses.forEach(addr => {
          addr.isDefault = false;
        });
      }

      user.invoiceAddresses.push(addressData);
      await user.save();

      const newAddress = user.invoiceAddresses[user.invoiceAddresses.length - 1];
      logger.info(`Invoice address added successfully: ${userId}`);

      return newAddress;
    } catch (error) {
      logger.error('Add invoice address failed:', error);
      throw error;
    }
  }

  /**
   * Update invoice address
   * @param {string} userId - User ID
   * @param {string} addressId - Invoice address ID
   * @param {Object} updateData - Update data
   * @returns {Object} Updated invoice address
   */
  async updateInvoiceAddress(userId, addressId, updateData) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('Kullanıcı bulunamadı');
      }

      const address = user.invoiceAddresses.id(addressId);
      if (!address) {
        throw new Error('Fatura adresi bulunamadı');
      }

      // If setting as default, remove default from other addresses
      if (updateData.isDefault) {
        user.invoiceAddresses.forEach(addr => {
          if (addr._id.toString() !== addressId) {
            addr.isDefault = false;
          }
        });
      }

      // Update address fields
      Object.keys(updateData).forEach(key => {
        address[key] = updateData[key];
      });

      await user.save();

      logger.info(`Invoice address updated successfully: ${userId}`);
      return address;
    } catch (error) {
      logger.error('Update invoice address failed:', error);
      throw error;
    }
  }

  /**
   * Delete invoice address
   * @param {string} userId - User ID
   * @param {string} addressId - Invoice address ID
   */
  async deleteInvoiceAddress(userId, addressId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('Kullanıcı bulunamadı');
      }

      const address = user.invoiceAddresses.id(addressId);
      if (!address) {
        throw new Error('Fatura adresi bulunamadı');
      }

      const wasDefault = address.isDefault;
      user.invoiceAddresses.id(addressId).deleteOne();

      // If deleted address was default, make first remaining address default
      if (wasDefault && user.invoiceAddresses.length > 0) {
        user.invoiceAddresses[0].isDefault = true;
      }

      await user.save();

      logger.info(`Invoice address deleted successfully: ${userId}`);
    } catch (error) {
      logger.error('Delete invoice address failed:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
const userService = new UserService();

module.exports = userService; 