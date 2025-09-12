// Elektronik Ürünler, Hobi Malzemeleri ve 3D Yazıcı Baskıları Örnek Ürünleri

// 1. Arduino Uno R3 Geliştirme Kartı
db.products.insertOne({
  name: "Arduino Uno R3 Geliştirme Kartı",
  description: "Mikroişlemci projeleriniz için ideal Arduino Uno R3 geliştirme kartı. 14 dijital giriş/çıkış pini, 6 analog giriş, USB bağlantısı ve güç jakı ile birlikte gelir. Yeni başlayanlar için mükemmel.",
  price: "299.90",
  slug: "arduino-uno-r3-gelistirme-karti",
  categories: [
    {category: "elektronik", rank: 1},
    {category: "arduino", rank: 2},
    {category: "gelistirme-kartlari", rank: 3}
  ],
  stock: 25,
  fakeStock: 8,
  enabled: true,
  type: "simple",
  isSubVariant: false,
  images: [{
    filename: "arduino-uno-r3.jpg",
    alt: "Arduino Uno R3 Geliştirme Kartı",
    rank: 1,
    isThumbnail: true,
    show: true
  }],
  createdAt: new Date(),
  updatedAt: new Date()
});

// 2. ESP32 WiFi Bluetooth Modülü
db.products.insertOne({
  name: "ESP32 WiFi Bluetooth Modülü",
  description: "Güçlü ESP32 WiFi ve Bluetooth özellikli mikrodenetleyici. IoT projeleriniz için ideal. Çift çekirdekli işlemci ve geniş pin desteği.",
  price: "189.90",
  slug: "esp32-wifi-bluetooth-modulu",
  categories: [
    {category: "elektronik", rank: 1},
    {category: "wifi-modulleri", rank: 2},
    {category: "iot", rank: 3}
  ],
  stock: 30,
  fakeStock: 12,
  enabled: true,
  type: "simple",
  isSubVariant: false,
  images: [{
    filename: "esp32-module.jpg",
    alt: "ESP32 WiFi Bluetooth Modülü",
    rank: 1,
    isThumbnail: true,
    show: true
  }],
  createdAt: new Date(),
  updatedAt: new Date()
});

// 3. LED Strip 5050 RGB 5m
db.products.insertOne({
  name: "LED Strip 5050 RGB 5 Metre - Adreslenebilir",
  description: "WS2812B çipli adreslenebilir RGB LED şerit. Her LED'i ayrı ayrı kontrol edebilirsiniz. Arduino ve Raspberry Pi ile uyumlu. Su geçirmez kaplama.",
  price: "159.90",
  discountedPrice: "129.90",
  slug: "led-strip-5050-rgb-5m",
  categories: [
    {category: "elektronik", rank: 1},
    {category: "led-aydinlatma", rank: 2},
    {category: "hobi-malzemeleri", rank: 3}
  ],
  stock: 20,
  fakeStock: 5,
  enabled: true,
  type: "simple",
  isSubVariant: false,
  images: [{
    filename: "led-strip-rgb.jpg",
    alt: "LED Strip 5050 RGB 5 Metre",
    rank: 1,
    isThumbnail: true,
    show: true
  }],
  createdAt: new Date(),
  updatedAt: new Date()
});

// 4. 3D Yazıcı PLA Filament
db.products.insertOne({
  name: "PLA Filament 1.75mm - Siyah (1kg)",
  description: "Yüksek kaliteli PLA filament. Kolay yazdırma, mükemmel yüzey kalitesi. FDM 3D yazıcılar için ideal. Çevre dostu ve kokusuz.",
  price: "149.90",
  slug: "pla-filament-175mm-siyah-1kg",
  categories: [
    {category: "3d-yazici", rank: 1},
    {category: "filament", rank: 2},
    {category: "pla", rank: 3}
  ],
  stock: 50,
  fakeStock: 18,
  enabled: true,
  type: "simple",
  isSubVariant: false,
  images: [{
    filename: "pla-filament-black.jpg",
    alt: "PLA Filament 1.75mm Siyah",
    rank: 1,
    isThumbnail: true,
    show: true
  }],
  createdAt: new Date(),
  updatedAt: new Date()
});

// 5. 3D Baskı Hizmet - Özel Tasarım
db.products.insertOne({
  name: "3D Baskı Hizmeti - Özel Prototip",
  description: "Kendi tasarımınızı gerçekleştirin! STL dosyanızı yükleyin, biz yazdıralım. PLA, ABS, PETG filament seçenekleri. 0.1mm hassasiyet.",
  price: "15.00",
  slug: "3d-baski-hizmeti-ozel-prototip",
  categories: [
    {category: "3d-baski-hizmeti", rank: 1},
    {category: "ozel-tasarim", rank: 2},
    {category: "prototip", rank: 3}
  ],
  stock: -1,
  fakeStock: 999,
  enabled: true,
  type: "simple",
  isSubVariant: false,
  images: [{
    filename: "3d-printing-service.jpg",
    alt: "3D Baskı Hizmeti",
    rank: 1,
    isThumbnail: true,
    show: true
  }],
  createdAt: new Date(),
  updatedAt: new Date()
});

// 6. Maket Bıçağı Seti
db.products.insertOne({
  name: "Hassas Maket Bıçağı Seti - 11 Parça",
  description: "Hobi ve el işleri için profesyonel maket bıçağı seti. Metal gövde, ergonomik tasarım. 10 adet yedek uç dahil. Güvenli saklama kutusu ile.",
  price: "89.90",
  slug: "maket-bicagi-seti-11-parca",
  categories: [
    {category: "hobi-malzemeleri", rank: 1},
    {category: "maket", rank: 2},
    {category: "el-aletleri", rank: 3}
  ],
  stock: 15,
  fakeStock: 4,
  enabled: true,
  type: "simple",
  isSubVariant: false,
  images: [{
    filename: "hobby-knife-set.jpg",
    alt: "Maket Bıçağı Seti",
    rank: 1,
    isThumbnail: true,
    show: true
  }],
  createdAt: new Date(),
  updatedAt: new Date()
});

// 7. Servo Motor SG90
db.products.insertOne({
  name: "SG90 Micro Servo Motor 9g",
  description: "Küçük robotik projeler için mükemmel servo motor. 180 derece dönüş açısı, hassas kontrol. Arduino ile kolay entegrasyon.",
  price: "39.90",
  slug: "sg90-micro-servo-motor-9g",
  categories: [
    {category: "elektronik", rank: 1},
    {category: "servo-motor", rank: 2},
    {category: "robotik", rank: 3}
  ],
  stock: 40,
  fakeStock: 15,
  enabled: true,
  type: "simple",
  isSubVariant: false,
  images: [{
    filename: "sg90-servo.jpg",
    alt: "SG90 Micro Servo Motor",
    rank: 1,
    isThumbnail: true,
    show: true
  }],
  createdAt: new Date(),
  updatedAt: new Date()
});

// 8. Breadboard 830 Delik
db.products.insertOne({
  name: "Breadboard 830 Delik - Jumper Kablolu",
  description: "Prototip geliştirme için ideal breadboard. 830 bağlantı noktası, güç rayları dahil. 65 adet jumper kablo hediye.",
  price: "79.90",
  slug: "breadboard-830-delik",
  categories: [
    {category: "elektronik", rank: 1},
    {category: "breadboard", rank: 2},
    {category: "prototip", rank: 3}
  ],
  stock: 25,
  fakeStock: 7,
  enabled: true,
  type: "simple",
  isSubVariant: false,
  images: [{
    filename: "breadboard-830.jpg",
    alt: "Breadboard 830 Delik",
    rank: 1,
    isThumbnail: true,
    show: true
  }],
  createdAt: new Date(),
  updatedAt: new Date()
});

// 9. Elektronik Lehim Seti
db.products.insertOne({
  name: "Elektronik Lehim Seti - 40W",
  description: "Başlangıç seviyesi lehim seti. 40W lehim demiri, lehim teli, flux, lehim sökücü braid ve temizlik süngeri dahil.",
  price: "199.90",
  slug: "elektronik-lehim-seti-40w",
  categories: [
    {category: "elektronik", rank: 1},
    {category: "lehim", rank: 2},
    {category: "el-aletleri", rank: 3}
  ],
  stock: 20,
  fakeStock: 6,
  enabled: true,
  type: "simple",
  isSubVariant: false,
  images: [{
    filename: "soldering-kit.jpg",
    alt: "Elektronik Lehim Seti",
    rank: 1,
    isThumbnail: true,
    show: true
  }],
  createdAt: new Date(),
  updatedAt: new Date()
});

// 10. 3D Yazıcı Yatak Leveling Kiti
db.products.insertOne({
  name: "3D Yazıcı Yatak Leveling & Kalibrasyon Kiti",
  description: "3D yazıcınızın yatak seviyesini ayarlamak için gerekli tüm araçlar. BL Touch sensörü, spiral yaylar, seviye ayar vidaları.",
  price: "249.90",
  slug: "3d-yazici-yatak-leveling-kiti",
  categories: [
    {category: "3d-yazici", rank: 1},
    {category: "kalibrasyon", rank: 2},
    {category: "yedek-parca", rank: 3}
  ],
  stock: 12,
  fakeStock: 3,
  enabled: true,
  type: "simple",
  isSubVariant: false,
  images: [{
    filename: "bed-leveling-kit.jpg",
    alt: "3D Yazıcı Yatak Leveling Kiti",
    rank: 1,
    isThumbnail: true,
    show: true
  }],
  createdAt: new Date(),
  updatedAt: new Date()
});

print("10 adet örnek ürün başarıyla eklendi!"); 