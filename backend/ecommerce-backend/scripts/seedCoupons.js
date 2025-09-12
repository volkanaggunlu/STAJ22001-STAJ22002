const mongoose = require('mongoose');
const Coupon = require('../src/models/Coupon');
const User = require('../src/models/User');
require('dotenv').config();

const connectDB = require('../src/config/db');

async function seedCoupons() {
  try {
    await connectDB();
    console.log('Database connected');

    // Önce mevcut kuponları temizle
    await Coupon.deleteMany({});
    console.log('Existing coupons cleared');

    // Test kullanıcısını bul
    const testUser = await User.findOne({ email: 'cnosman14043@gmail.com' });
    if (!testUser) {
      console.log('Test user not found, creating coupons without user targeting');
    }

    const coupons = [
      {
        code: 'WELCOME10',
        name: 'Hoş Geldin İndirimi',
        description: 'İlk siparişinizde %10 indirim',
        type: 'percentage',
        value: 10,
        minOrderAmount: 100,
        maxDiscountAmount: 50,
        usageLimit: 100,
        usageLimitPerUser: 1,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 gün
        isActive: true,
        isPublic: true,
        couponType: 'first-order',
        applicableUsers: testUser ? [testUser._id] : [],
        createdBy: testUser ? testUser._id : null
      },
      {
        code: 'SAVE20',
        name: '20 TL İndirim',
        description: '200 TL üzeri alışverişlerde 20 TL indirim',
        type: 'fixed',
        value: 20,
        minOrderAmount: 200,
        usageLimit: 50,
        usageLimitPerUser: 2,
        startDate: new Date(),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 gün
        isActive: true,
        isPublic: true,
        couponType: 'general',
        createdBy: testUser ? testUser._id : null
      },
      {
        code: 'SUMMER15',
        name: 'Yaz İndirimi',
        description: 'Yaz sezonu özel %15 indirim',
        type: 'percentage',
        value: 15,
        minOrderAmount: 150,
        maxDiscountAmount: 100,
        usageLimit: 200,
        usageLimitPerUser: 3,
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 gün
        isActive: true,
        isPublic: true,
        couponType: 'seasonal',
        createdBy: testUser ? testUser._id : null
      },
      {
        code: 'VIP25',
        name: 'VIP İndirimi',
        description: 'VIP müşteriler için %25 indirim',
        type: 'percentage',
        value: 25,
        minOrderAmount: 500,
        maxDiscountAmount: 200,
        usageLimit: 10,
        usageLimitPerUser: 1,
        startDate: new Date(),
        endDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), // 120 gün
        isActive: true,
        isPublic: false,
        couponType: 'loyalty',
        applicableUsers: testUser ? [testUser._id] : [],
        createdBy: testUser ? testUser._id : null
      }
    ];

    const createdCoupons = await Coupon.insertMany(coupons);
    console.log(`${createdCoupons.length} test coupons created:`);
    
    createdCoupons.forEach(coupon => {
      console.log(`- ${coupon.code}: ${coupon.name}`);
    });

    console.log('Coupon seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Coupon seeding failed:', error);
    process.exit(1);
  }
}

seedCoupons(); 