export default function HakkimizdaPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Hakkımızda</h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-700 mb-6 leading-relaxed">
            Açık Atölye olarak, teknolojiye meraklı herkesi bir araya getirmeyi hedefleyen bir eğitim ve satış platformuyuz. ... yılında başlayan yolculuğumuzda, öğrencilerimize ve teknoloji tutkunlarına yazılım, elektronik ve donanım konularında eğitimler veriyor, aynı zamanda projelerini hayata geçirmeleri için ihtiyaç duydukları ekipmanları sağlıyoruz.
          </p>
          
          <p className="text-gray-700 mb-6 leading-relaxed">
            Bünyemizde, Arduino, Raspberry Pi, sensörler, robotik kitler ve elektronik bileşenler gibi birçok ürünün satışını yaparken, aynı zamanda birebir ve grup dersleriyle kodlama, devre tasarımı ve proje geliştirme alanlarında destek veriyoruz.
          </p>
          
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Misyonumuz</h2>
              <p className="text-gray-700 leading-relaxed">
                Öğrenen, üreten ve paylaşan bir teknoloji topluluğu oluşturarak her yaştan bireyin teknolojiye olan ilgisini geliştirmek.
              </p>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Vizyonumuz</h2>
              <p className="text-gray-700 leading-relaxed">
                Türkiye'de ve dünyada teknoloji eğitimi ve donanım tedariki konusunda öncü ve güvenilir bir marka olmak.
              </p>
            </div>
          </div>
          
          <p className="text-gray-700 mt-6 leading-relaxed">
            Biz, sadece ürün satan bir firma değil; aynı zamanda öğrencilerimizin hayallerini gerçeğe dönüştürmeleri için yanlarında olan bir ekibiz.
          </p>
        </div>
      </div>
    </div>
  )
}
