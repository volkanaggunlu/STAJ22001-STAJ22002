export default function IadePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">İade & Değişim</h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-700 mb-6 leading-relaxed">
            Müşteri memnuniyeti bizim için önceliklidir. Açık Atölye üzerinden satın aldığınız ürünlerde, teslim aldığınız tarihten itibaren 14 gün içinde iade veya değişim hakkınız vardır.
          </p>
          
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">İade Koşulları</h2>
              <ul className="space-y-3 text-gray-700">
                <li>Ürün kullanılmamış, tüm parçaları eksiksiz ve orijinal ambalajında olmalıdır.</li>
                <li>Elektronik bileşenlerin lehimlenmiş, değiştirilmiş veya hasar görmüş olması iade hakkını ortadan kaldırır.</li>
                <li>Eğitim paketleri veya dijital içerikler, satın alındıktan sonra iade edilemez.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Değişim Koşulları</h2>
              <ul className="space-y-3 text-gray-700">
                <li>Ürün stoklarımızda mevcut ise, farklı model veya parça ile değişim yapılabilir.</li>
                <li>Değişim kargosu, hatalı ürün durumunda firmamız tarafından karşılanır.</li>
              </ul>
            </div>
          </div>

          <p className="text-gray-700 mt-6 leading-relaxed">
            İade veya değişim için, sipariş numaranızla birlikte{' '}
            <a href="mailto:info@acikatolye.com.tr" className="text-blue-600 hover:underline font-semibold">
              info@acikatolye.com.tr
            </a>{' '}
            üzerinden bizimle iletişime geçebilirsiniz.
          </p>
        </div>
      </div>
    </div>
  )
}
