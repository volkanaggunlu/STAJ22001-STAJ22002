const mongoose = require('mongoose');
const Campaign = require('../src/models/Campaign');
const User = require('../src/models/User');
require('dotenv').config();

const connectDB = require('../src/config/db');

async function seedCampaigns() {
  try {
    await connectDB();
    console.log('Database connected');

    // Önce mevcut kampanyaları temizle
    await Campaign.deleteMany({});
    console.log('Existing campaigns cleared');

    // Test kullanıcısını bul
    const testUser = await User.findOne({ email: 'cnosman14043@gmail.com' });
    if (!testUser) {
      console.log('Test user not found, creating campaigns without user targeting');
    }

    const campaigns = [
      {
        name: 'Yaz Sezonu İndirimi',
        description: 'Tüm elektronik ürünlerde %15 indirim',
        type: 'seasonal',
        rules: {
          minOrderAmount: 200,
          applicableCategories: ['Elektronik', 'Arduino'],
          userGroups: ['all'],
          minProductCount: 1
        },
        discount: {
          type: 'percentage',
          value: 15,
          maxDiscountAmount: 100
        },
        isActive: true,
        isAutoApply: false,
        priority: 1,
        startDate: new Date(),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 gün
        createdBy: testUser ? testUser._id : null
      },
      {
        name: 'Ücretsiz Kargo',
        description: '500 TL üzeri alışverişlerde ücretsiz kargo',
        type: 'free_shipping',
        rules: {
          minOrderAmount: 500,
          userGroups: ['all'],
          minProductCount: 1
        },
        discount: {
          type: 'free_shipping',
          value: 29.90
        },
        isActive: true,
        isAutoApply: true,
        priority: 2,
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 gün
        createdBy: testUser ? testUser._id : null
      },
      {
        name: 'VIP Müşteri İndirimi',
        description: 'VIP müşteriler için %25 indirim',
        type: 'discount',
        rules: {
          minOrderAmount: 1000,
          userGroups: ['vip'],
          applicableUsers: testUser ? [testUser._id] : [],
          minProductCount: 2
        },
        discount: {
          type: 'percentage',
          value: 25,
          maxDiscountAmount: 200
        },
        isActive: true,
        isAutoApply: false,
        priority: 3,
        startDate: new Date(),
        endDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), // 120 gün
        createdBy: testUser ? testUser._id : null
      },
      {
        name: 'Flash Sale',
        description: 'Sınırlı süre %30 indirim',
        type: 'flash_sale',
        rules: {
          minOrderAmount: 150,
          maxOrderAmount: 1000,
          userGroups: ['all'],
          minProductCount: 1
        },
        discount: {
          type: 'percentage',
          value: 30,
          maxDiscountAmount: 150
        },
        isActive: true,
        isAutoApply: false,
        priority: 4,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 gün
        createdBy: testUser ? testUser._id : null
      },
      {
        name: 'İlk Sipariş İndirimi',
        description: 'Yeni müşteriler için %20 indirim',
        type: 'discount',
        rules: {
          minOrderAmount: 100,
          userGroups: ['new'],
          minProductCount: 1
        },
        discount: {
          type: 'percentage',
          value: 20,
          maxDiscountAmount: 50
        },
        isActive: true,
        isAutoApply: true,
        priority: 5,
        startDate: new Date(),
        endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 180 gün
        createdBy: testUser ? testUser._id : null
      }
    ];

    const createdCampaigns = await Campaign.insertMany(campaigns);
    console.log(`${createdCampaigns.length} test campaigns created:`);
    
    createdCampaigns.forEach(campaign => {
      console.log(`- ${campaign.name}: ${campaign.discount.type} ${campaign.discount.value}${campaign.discount.type === 'percentage' ? '%' : ' TL'}`);
    });

    console.log('Campaign seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Campaign seeding failed:', error);
    process.exit(1);
  }
}

seedCampaigns(); 