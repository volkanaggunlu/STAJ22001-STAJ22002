const mongoose = require('mongoose');
const ShippingOption = require('../models/ShippingOption');
require('dotenv').config();

const shippingOptions = [
  {
    value: 'standart',
    label: 'Standart Kargo',
    description: '2-3 iş günü içinde teslimat',
    cost: 49.90,
    freeLimit: 500,
    estimatedDays: '2-3 iş günü',
    order: 1,
    isActive: true,
    applicableCities: [],
    applicableRegions: [],
    minOrderAmount: 0,
    carrier: 'Aras Kargo',
    trackingUrl: 'https://www.araskargo.com.tr/tr/cargo-tracking',
    notes: 'Tüm Türkiye genelinde geçerli'
  },
  {
    value: 'ekspres',
    label: 'Ekspres Kargo',
    description: '1 iş günü içinde teslimat',
    cost: 99.90,
    freeLimit: 1000,
    estimatedDays: '1 iş günü',
    order: 2,
    isActive: true,
    applicableCities: ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya'],
    applicableRegions: [],
    minOrderAmount: 0,
    carrier: 'Yurtiçi Kargo',
    trackingUrl: 'https://www.yurticikargo.com/tr/cargo-tracking',
    notes: 'Sadece büyük şehirlerde geçerli'
  },
  {
    value: 'same-day',
    label: 'Aynı Gün Teslimat',
    description: 'Aynı gün teslimat (sadece İstanbul)',
    cost: 149.90,
    freeLimit: 0,
    estimatedDays: 'Aynı gün',
    order: 3,
    isActive: true,
    applicableCities: ['İstanbul'],
    applicableRegions: [],
    minOrderAmount: 0,
    carrier: 'MNG Kargo',
    trackingUrl: 'https://www.mngkargo.com.tr/tr/cargo-tracking',
    notes: 'Sadece İstanbul içi, sabah 10:00\'a kadar verilen siparişler'
  },
  {
    value: 'ptt',
    label: 'PTT Kargo',
    description: '3-5 iş günü içinde teslimat',
    cost: 39.90,
    freeLimit: 750,
    estimatedDays: '3-5 iş günü',
    order: 4,
    isActive: true,
    applicableCities: [],
    applicableRegions: [],
    minOrderAmount: 0,
    carrier: 'PTT Kargo',
    trackingUrl: 'https://www.ptt.gov.tr/tr/cargo-tracking',
    notes: 'Tüm Türkiye genelinde geçerli, ekonomik seçenek'
  },
  {
    value: 'ups',
    label: 'UPS Express',
    description: '1-2 iş günü içinde teslimat',
    cost: 129.90,
    freeLimit: 1500,
    estimatedDays: '1-2 iş günü',
    order: 5,
    isActive: true,
    applicableCities: ['İstanbul', 'Ankara', 'İzmir'],
    applicableRegions: [],
    minOrderAmount: 0,
    carrier: 'UPS',
    trackingUrl: 'https://www.ups.com/track',
    notes: 'Uluslararası standartlarda hızlı teslimat'
  }
];

async function seedShippingOptions() {
  try {
    // MongoDB'ye bağlan
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB\'ye bağlandı');

    // Mevcut kargo seçeneklerini temizle
    await ShippingOption.deleteMany({});
    console.log('🗑️ Mevcut kargo seçenekleri temizlendi');

    // Yeni kargo seçeneklerini ekle
    const createdOptions = await ShippingOption.insertMany(shippingOptions);
    console.log(`✅ ${createdOptions.length} kargo seçeneği eklendi`);

    // Eklenen seçenekleri listele
    console.log('\n📋 Eklenen Kargo Seçenekleri:');
    createdOptions.forEach(option => {
      console.log(`- ${option.label}: ${option.cost}₺ (${option.estimatedDays})`);
    });

    console.log('\n🎉 Kargo seçenekleri başarıyla eklendi!');
  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB bağlantısı kapatıldı');
  }
}

// Script'i çalıştır
if (require.main === module) {
  seedShippingOptions();
}

module.exports = { seedShippingOptions };