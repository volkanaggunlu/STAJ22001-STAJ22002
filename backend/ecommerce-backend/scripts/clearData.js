const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const Category = require('../src/models/Category');
const { MONGO_URI } = require('../src/config/environment');

async function clearData() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Veritabanına bağlanıldı');

    // Tüm kategorileri sil
    await Category.deleteMany({});
    console.log('Tüm kategoriler silindi');

    // Tüm ürünleri sil
    await Product.deleteMany({});
    console.log('Tüm ürünler silindi');

    console.log('Veritabanı temizlendi');
    process.exit(0);
  } catch (error) {
    console.error('Hata:', error);
    process.exit(1);
  }
}

clearData(); 