export default function KargoPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Kargo Bilgileri</h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-700 mb-6 leading-relaxed">
            Açık Atölye olarak, siparişlerinizi hızlı ve güvenli bir şekilde size ulaştırmak için çalışıyoruz. Tüm Arduino kitleri, sensörler ve diğer ürünler, özenle paketlenerek 1-2 iş günü içerisinde anlaşmalı kargo firmalarına teslim edilir.
          </p>
          
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Kargo Süreci</h2>
              <ul className="space-y-3 text-gray-700">
                <li><strong>Kargo Ücreti:</strong> 500 TL ve üzeri alışverişlerde ücretsiz</li>
                <li><strong>Teslim Süresi:</strong> Şehir merkezlerinde genellikle 1-3 iş günü, uzak bölgelerde 3-5 iş günü</li>
                <li><strong>Takip:</strong> Siparişiniz kargoya verildiğinde size SMS veya e-posta ile takip numarası gönderilir.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Önemli Notlar</h2>
              <ul className="space-y-3 text-gray-700">
                <li>Elektronik ürünlerin taşınma sürecinde zarar görmemesi için paketlerimiz ekstra koruma ile hazırlanır.</li>
                <li>Teslim sırasında paketinizde hasar varsa, kargo görevlisine tutanak tutturmadan ürünü teslim almayın.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
