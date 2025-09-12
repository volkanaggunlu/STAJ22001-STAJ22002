'use client'

import { APP_CONFIG } from '@/lib/utils/constants'

export default function KvkkPage() {
	const siteName = APP_CONFIG.NAME
	return (
		<main className="container mx-auto px-4 py-10 max-w-3xl">
			<h1 className="text-3xl font-bold mb-2">KVKK Aydınlatma Metni</h1>
			<p className="text-sm text-gray-500 mb-8">Son Güncelleme: [Tarih]</p>

			<section className="space-y-6 text-gray-800 leading-relaxed">
				<p>
					6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, {siteName} olarak veri sorumlusu
					sıfatıyla kişisel verilerinizi aşağıda belirtilen kapsamda işlemekteyiz.
				</p>

				<div>
					<h2 className="text-xl font-semibold mb-2">1. Kişisel Verilerin Toplanma Yöntemi ve Hukuki Sebep</h2>
					<p>
						Kişisel verileriniz, web sitemiz üzerinden elektronik ortamda veya fiziksel formlar aracılığıyla
						toplanmakta olup, KVKK madde 5 ve 6’da belirtilen hukuki sebeplere dayanılarak işlenmektedir.
					</p>
				</div>

				<div>
					<h2 className="text-xl font-semibold mb-2">2. İşleme Amaçları</h2>
					<ul className="list-disc pl-5 space-y-2">
						<li>Ürün ve hizmet sunumu</li>
						<li>Müşteri ilişkileri yönetimi</li>
						<li>Yasal yükümlülüklerin yerine getirilmesi</li>
					</ul>
				</div>

				<div>
					<h2 className="text-xl font-semibold mb-2">3. Veri Aktarımı</h2>
					<p>
						Kişisel verileriniz, yalnızca kanunen yetkili kamu kurum ve kuruluşlarına veya hizmet sağlayıcı
						iş ortaklarımıza aktarılabilir.
					</p>
				</div>

				<div>
					<h2 className="text-xl font-semibold mb-2">4. Haklarınız</h2>
					<p>
						KVKK madde 11 kapsamında, veri sorumlusuna başvurarak kişisel verilerinizin işlenip
						işlenmediğini öğrenme, düzeltilmesini talep etme, silinmesini isteme gibi haklara sahipsiniz.
					</p>
				</div>
			</section>
		</main>
	)
}


