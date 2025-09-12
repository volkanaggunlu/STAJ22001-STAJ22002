const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('../src/models/Product');
const User = require('../src/models/User'); // User modelini dahil et

dotenv.config({ path: './.env' });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

const users = [
    {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      password: 'password123',
      phone: '+905551112233',
      gender: 'male',
      role: 'admin',
      isVerified: true,
    },
    {
        firstName: 'Ayhan',
        lastName: 'Tursun',
        email: 'ayhan@example.com',
        password: 'password456',
        phone: '+905441112233',
        gender: 'male',
        isVerified: true,
      },
  ];

const products = [
  {
    name: "Arduino Uno R3 Geliştirme Kartı",
    slug: "arduino-uno-r3-gelistirme-karti",
    description: "Mikroişlemci projeleriniz için ideal Arduino Uno R3 geliştirme kartı. 14 dijital giriş/çıkış pini, 6 analog giriş, USB bağlantısı ve güç jakı ile birlikte gelir. Yeni başlayanlar için mükemmel.",
    shortDescription: "Yeni başlayanlar ve profesyoneller için popüler Arduino Uno R3 geliştirme kartı.",
    price: 299.90,
    category: 'Elektronik',
    subCategory: 'Geliştirme Kartları',
    brand: 'Arduino',
    sku: 'ARD-UNO-R3-01',
    images: [{
      url: 'images/products/arduino-uno-r3.jpg',
      alt: 'Arduino Uno R3 Geliştirme Kartı',
      isPrimary: true
    }],
    stock: {
      quantity: 25,
      trackStock: true
    },
    type: 'product',
    features: ['14 dijital I/O', '6 analog giriş', 'USB bağlantısı', 'ATmega328P mikrodenetleyici'],
    specifications: [
        { key: 'Mikrodenetleyici', value: 'ATmega328P' },
        { key: 'Çalışma Gerilimi', value: '5V' },
        { key: 'Giriş Gerilimi (önerilen)', value: '7-12V' }
    ],
    seo: {
        title: "Arduino Uno R3 Geliştirme Kartı Satın Al",
        description: "En uygun fiyata orijinal Arduino Uno R3 geliştirme kartı. Projelerinize hemen başlayın."
    }
  },
  {
    name: "ESP32 WiFi Bluetooth Modülü",
    slug: "esp32-wifi-bluetooth-modulu",
    description: "Güçlü ESP32 WiFi ve Bluetooth özellikli mikrodenetleyici. IoT projeleriniz için ideal. Çift çekirdekli işlemci ve geniş pin desteği.",
    shortDescription: "IoT projeleri için güçlü ve çok yönlü ESP32 WiFi/Bluetooth modülü.",
    price: 189.90,
    category: 'Elektronik',
    subCategory: 'WiFi Modülleri',
    brand: 'Espressif',
    sku: 'ESP-32-WROOM-01',
    images: [{ url: 'images/products/esp32-module.jpg', alt: 'ESP32 WiFi Bluetooth Modülü', isPrimary: true }],
    stock: { quantity: 30, trackStock: true },
    type: 'product',
    features: ['WiFi 802.11 b/g/n', 'Bluetooth v4.2', 'Çift çekirdekli Tensilica LX6', 'Düşük güç tüketimi'],
    specifications: [{ key: 'Frekans', value: '2.4 GHz' }, { key: 'Protokoller', value: 'WiFi, Bluetooth, BLE' }],
    seo: { title: "ESP32 WiFi Modülü Satın Al", description: "IoT projeleriniz için Espressif ESP32 modülü." }
  },
  {
    name: "LED Strip 5050 RGB 5 Metre - Adreslenebilir",
    slug: "led-strip-5050-rgb-5m",
    description: "WS2812B çipli adreslenebilir RGB LED şerit. Her LED'i ayrı ayrı kontrol edebilirsiniz. Arduino ve Raspberry Pi ile uyumlu. Su geçirmez kaplama.",
    shortDescription: "5 metre, adreslenebilir, su geçirmez RGB LED şerit.",
    price: 159.90,
    originalPrice: 189.90,
    discountPercentage: 15.8,
    category: 'Elektronik',
    subCategory: 'LED Aydınlatma',
    brand: 'WorldSemi',
    sku: 'WS2812B-5M-60-IP65',
    images: [{ url: 'images/products/led-strip-rgb.jpg', alt: 'LED Strip 5050 RGB 5 Metre', isPrimary: true }],
    stock: { quantity: 20, trackStock: true },
    type: 'product',
    features: ['Her LED ayrı kontrol', 'Su geçirmez (IP65)', '5V çalışma gerilimi', 'Esnek yapı'],
    specifications: [{ key: 'LED Tipi', value: 'WS2812B (5050 SMD)' }, { key: 'Metredeki LED Sayısı', value: '60' }],
    seo: { title: "Adreslenebilir RGB LED Şerit Satın Al", description: "WS2812B 5 metre adreslenebilir RGB LED şerit." }
  },
  {
    name: "PLA Filament 1.75mm - Siyah (1kg)",
    slug: "pla-filament-175mm-siyah-1kg",
    description: "Yüksek kaliteli PLA filament. Kolay yazdırma, mükemmel yüzey kalitesi. FDM 3D yazıcılar için ideal. Çevre dostu ve kokusuz.",
    shortDescription: "1.75mm çapında, 1kg siyah renkli, yüksek kaliteli PLA filament.",
    price: 149.90,
    category: '3D Baskı',
    subCategory: 'Filament',
    brand: 'eSun',
    sku: 'ESUN-PLA-BLK-1KG',
    images: [{ url: 'images/products/pla-filament-black.jpg', alt: 'PLA Filament 1.75mm Siyah', isPrimary: true }],
    stock: { quantity: 50, trackStock: true },
    type: 'product',
    features: ['Kolay basım', 'Düşük çekme oranı', 'Çevre dostu', 'Parlak yüzey'],
    specifications: [{ key: 'Malzeme', value: 'PLA (Polilaktik Asit)' }, { key: 'Çap', value: '1.75mm' }, { key: 'Ağırlık', value: '1 kg' }],
    seo: { title: "Siyah PLA Filament 1kg Satın Al", description: "3D yazıcınız için eSun 1.75mm siyah PLA filament." }
  },
  {
    name: "Hassas Maket Bıçağı Seti - 11 Parça",
    slug: "maket-bicagi-seti-11-parca",
    description: "Hobi ve el işleri için profesyonel maket bıçağı seti. Metal gövde, ergonomik tasarım. 10 adet yedek uç dahil. Güvenli saklama kutusu ile.",
    shortDescription: "Hobi ve el işleri için 11 parçalık hassas maket bıçağı seti.",
    price: 89.90,
    category: 'Hobi',
    subCategory: 'El Aletleri',
    brand: 'Proskit',
    sku: 'PSK-MK-11P',
    images: [{ url: 'images/products/hobby-knife-set.jpg', alt: 'Maket Bıçağı Seti', isPrimary: true }],
    stock: { quantity: 15, trackStock: true },
    type: 'product',
    features: ['Metal gövde', '10 yedek bıçak', 'Ergonomik tasarım', 'Saklama kutusu'],
    specifications: [{ key: 'Parça Sayısı', value: '11' }, { key: 'Malzeme', value: 'Çelik ve Alüminyum' }],
    seo: { title: "Hassas Maket Bıçağı Seti", description: "Hobi projeleriniz için Proskit 11 parça maket bıçağı seti." }
  },
  {
    name: "SG90 Micro Servo Motor 9g",
    slug: "sg90-micro-servo-motor-9g",
    description: "Küçük robotik projeler için mükemmel servo motor. 180 derece dönüş açısı, hassas kontrol. Arduino ile kolay entegrasyon.",
    shortDescription: "Robotik projeler için 9 gramlık, 180 derece dönebilen mikro servo motor.",
    price: 39.90,
    category: 'Elektronik',
    subCategory: 'Motorlar',
    brand: 'Tower Pro',
    sku: 'TPRO-SG90-M01',
    images: [{ url: 'images/products/sg90-servo.jpg', alt: 'SG90 Micro Servo Motor', isPrimary: true }],
    stock: { quantity: 40, trackStock: true },
    type: 'product',
    features: ['180 derece dönüş', 'Hafif yapı (9g)', 'Plastik dişli', 'Kolay kontrol'],
    specifications: [{ key: 'Ağırlık', value: '9g' }, { key: 'Tork', value: '1.8 kg/cm @ 4.8V' }],
    seo: { title: "SG90 Mikro Servo Motor Satın Al", description: "Arduino ve robotik projeler için Tower Pro SG90 servo motor." }
  }
];

const importData = async (model, data, modelName) => {
    try {
      await model.deleteMany();
      await model.insertMany(data);
      console.log(`${modelName} verisi başarıyla eklendi!`);
    } catch (error) {
      console.error(`${modelName} verisi eklenirken hata:`, error);
      throw error; // Hatanın yukarıya taşınması
    }
  };
  
  const destroyData = async (model, modelName) => {
    try {
      await model.deleteMany();
      console.log(`${modelName} verisi başarıyla silindi!`);
    } catch (error) {
      console.error(`${modelName} verisi silinirken hata:`, error);
      throw error; // Hatanın yukarıya taşınması
    }
  };

const run = async () => {
    const arg = process.argv[2];
    if (!arg) {
        console.log("Lütfen bir argüman belirtin: --import-users, --import-products, --destroy-users, --destroy-products");
        process.exit(0);
    }
  
    try {
        await connectDB();
    
        if (arg === '--import-users') {
          await importData(User, users, 'Kullanıcı');
        } else if (arg === '--import-products') {
          await importData(Product, products, 'Ürün');
        } else if (arg === '--destroy-users') {
            await destroyData(User, 'Kullanıcı');
        } else if (arg === '--destroy-products') {
            await destroyData(Product, 'Ürün');
        } else {
          console.log('Geçersiz argüman.');
        }
    
        console.log('İşlem tamamlandı.');
        process.exit();
      } catch (error) {
        console.error('Betiğin çalışması sırasında bir hata oluştu:', error.message);
        process.exit(1);
      }
}

run(); 