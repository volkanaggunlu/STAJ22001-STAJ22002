'use client'
import Image from 'next/image';

const features = [
  {
    icon: '/hero/arduino.jpg',
    title: 'Elektronik & Akıllı Ürünler',
    desc: 'Telefon, bilgisayar, aksesuar, akıllı ev ürünleri ve daha fazlası.'
  },
  {
    icon: '/hero/3d-baski.jpg',
    title: '3D Baskı & Maker',
    desc: '3D yazıcılar, filamentler, maker projeleri ve hobi ürünleri.'
  },
  {
    icon: '/hero/raspberry-pi.jpeg',
    title: 'Geliştirme Kitleri',
    desc: 'Arduino, Raspberry Pi, robotik ve eğitim setleri.'
  },
  {
    icon: '/hero/maker.jpg',
    title: 'Kampanyalar & Fırsatlar',
    desc: 'Sürekli güncellenen indirimler ve avantajlı alışveriş.'
  },
];

export default function ComingSoon() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-yellow-50 relative overflow-x-hidden">
      {/* Features */}
            {/* Hero & Logo */}
            <div className="w-full max-w-2xl flex flex-col items-center mt-8 mb-4 px-4">
        <div className="mb-6 animate-fade-in">
          <Image src="/logos/yatay-logo.png" alt="Açık Atölye Logo" width={180} height={40} priority />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-yellow-500 text-center mb-4 animate-slide-down">
          Çok Yakında <span className="text-yellow-500">Açılıyoruz!</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-700 text-center max-w-xl mb-6 animate-fade-in">
          Açık Atölye mağazamız çok yakında sizlerle! Yepyeni ürünler, avantajlı kampanyalar ve modern bir alışveriş deneyimi için bizi takipte kalın.
        </p>
      </div>
      <section className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10 px-4 animate-fade-in mt-16">
        {features.map((f, i) => (
          <div key={i} className="bg-white/80 rounded-2xl shadow-lg flex items-center gap-4 p-4 hover:scale-[1.03] transition-transform">
            <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
              <Image src={f.icon} alt={f.title} fill className="object-cover" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-blue-800 mb-1">{f.title}</h3>
              <p className="text-gray-600 text-sm leading-snug">{f.desc}</p>
            </div>
          </div>
        ))}
      </section>

    {/*
      <section className="w-full max-w-2xl bg-white/90 rounded-2xl shadow-xl p-6 mb-8 animate-fade-in">
        <h2 className="text-2xl font-semibold mb-3 text-blue-800">Planlanan Modüller</h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-gray-700 text-base pl-4 list-disc">
          <li>Ürün Kataloğu & Detay Sayfaları</li>
          <li>Kategori Yönetimi</li>
          <li>Sepet & Sipariş Takibi</li>
          <li>Kullanıcı Hesabı & Profil</li>
          <li>Favoriler & Listeler</li>
          <li>Admin Paneli (yetkililere özel)</li>
        </ul>
      </section>
      
      <section className="w-full max-w-2xl bg-white/90 rounded-2xl shadow-xl p-6 mb-8 animate-fade-in">
        <h2 className="text-2xl font-semibold mb-3 text-blue-800">Demo Ürünler</h2>
        <div className="flex flex-wrap gap-3">
          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">Akıllı Telefonlar</span>
          <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium">Dizüstü Bilgisayarlar</span>
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">Kulaklıklar</span>
          <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">Akıllı Saatler</span>
          <span className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-sm font-medium">Ev Elektroniği</span>
        </div>
      </section>
    */}
      {/* İletişim & Sosyal */}
      <div className="w-full max-w-2xl flex flex-col items-center gap-2 mb-8 animate-fade-in">
        <div className="text-center text-gray-600 text-base">
          Açılış tarihi ve fırsatlar için bizi takip edin:<br />
          <a href="mailto:info@Açık Atölye.com" className="text-blue-600 underline">info@acikatolye.com.tr</a>
        </div>
        <div className="flex gap-4 mt-2">
          <a href="#" className="hover:scale-110 transition-transform"><img src="/logos/aa.png" alt="Twitter" className="w-8 h-8 rounded" /></a>
        </div>
      </div>

      {/* Geliştirici Notu */}
      

      <style jsx>{`
        @media (max-width: 640px) {
          h1 { font-size: 2rem; }
        }
      `}</style>
    </main>
  );
}
