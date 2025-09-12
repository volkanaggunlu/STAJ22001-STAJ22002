'use client'

import { APP_CONFIG } from '@/lib/utils/constants'

export default function DistanceSalesPage() {
	const siteName = APP_CONFIG.NAME
	return (
		<main className="container mx-auto px-4 py-10 max-w-3xl">
			<h1 className="text-3xl font-bold mb-2">Mesafeli Satış Sözleşmesi</h1>
			<p className="text-sm text-gray-500 mb-8">Son Güncelleme: [Tarih]</p>

			<section className="space-y-6 text-gray-800 leading-relaxed">
				<div>
					<h2 className="text-xl font-semibold mb-2">1. Taraflar</h2>
					<p>
						İşbu sözleşme, Açık Atölye ("Satıcı") ile [Müşteri Adı] ("Alıcı") arasında, mesafeli satış
						hükümlerine uygun olarak düzenlenmiştir.
					</p>
				</div>

				<div>
					<h2 className="text-xl font-semibold mb-2">2. Konu</h2>
					<p>
						Sözleşmenin konusu, Alıcı’nın elektronik ortamda sipariş verdiği ürün/hizmetin satış ve teslim
						koşullarını belirlemektir.
					</p>
				</div>

				<div>
					<h2 className="text-xl font-semibold mb-2">3. Ürün ve Hizmet Bilgileri</h2>
					<p>Ürün adı, fiyatı, adedi ve özellikleri sipariş sayfasında belirtilmiştir.</p>
				</div>

				<div>
					<h2 className="text-xl font-semibold mb-2">4. Teslimat</h2>
					<p>
						Teslimat, sipariş onayını takiben [x] iş günü içinde, Alıcı’nın belirttiği adrese yapılır.
					</p>
				</div>

				<div>
					<h2 className="text-xl font-semibold mb-2">5. Cayma Hakkı</h2>
					<p>
						Alıcı, teslim tarihinden itibaren 14 gün içinde hiçbir gerekçe göstermeksizin cayma hakkına
						sahiptir. Cayma hakkı kullanılmak istendiğinde, ürünün kullanılmamış ve orijinal ambalajında
						olması gerekir.
					</p>
				</div>

				<div>
					<h2 className="text-xl font-semibold mb-2">6. İade ve Geri Ödeme</h2>
					<p>
						İade edilen ürün, satıcıya ulaştıktan sonra en geç 14 gün içinde bedeli iade edilir.
					</p>
				</div>

				<div>
					<h2 className="text-xl font-semibold mb-2">7. Uyuşmazlık Çözümü</h2>
					<p>
						Uyuşmazlık halinde, Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri yetkilidir.
					</p>
				</div>
			</section>
		</main>
	)
}


