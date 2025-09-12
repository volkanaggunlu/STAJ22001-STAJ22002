'use client'

import { APP_CONFIG } from '@/lib/utils/constants'

export default function PrivacyPolicyPage() {
	const siteName = APP_CONFIG.NAME
	return (
		<main className="container mx-auto px-4 py-10 max-w-3xl">
			<h1 className="text-3xl font-bold mb-2">Gizlilik Sözleşmesi</h1>
			<p className="text-sm text-gray-500 mb-8">Son Güncelleme: [Tarih]</p>

			<section className="space-y-6 text-gray-800 leading-relaxed">
				<div>
					<h2 className="text-xl font-semibold mb-2">1. Giriş</h2>
					<p>
						{siteName} olarak, kullanıcı bilgilerinizin güvenliğini önemsiyoruz. Bu Gizlilik Sözleşmesi,
						hangi verilerin toplandığını ve nasıl kullanıldığını açıklar.
					</p>
				</div>

				<div>
					<h2 className="text-xl font-semibold mb-2">2. Toplanan Bilgiler</h2>
					<ul className="list-disc pl-5 space-y-2">
						<li>Ad, soyad, e-posta adresi, telefon numarası</li>
						<li>IP adresi, tarayıcı bilgileri, çerez verileri</li>
					</ul>
				</div>

				<div>
					<h2 className="text-xl font-semibold mb-2">3. Kullanım Amacı</h2>
					<ul className="list-disc pl-5 space-y-2">
						<li>Hizmet sunmak ve geliştirmek</li>
						<li>Siparişlerinizi işlemek</li>
						<li>Pazarlama ve bilgilendirme amaçlı iletişim sağlamak</li>
					</ul>
				</div>

				<div>
					<h2 className="text-xl font-semibold mb-2">4. Veri Paylaşımı</h2>
					<p>
						Bilgileriniz, yalnızca yasal zorunluluklar veya hizmetin sağlanması için gerekli durumlarda
						üçüncü taraflarla paylaşılır.
					</p>
				</div>

				<div>
					<h2 className="text-xl font-semibold mb-2">5. Güvenlik Önlemleri</h2>
					<p>
						Kişisel verileriniz, SSL sertifikası ve güvenlik duvarı gibi teknik önlemlerle korunur.
					</p>
				</div>

				<div>
					<h2 className="text-xl font-semibold mb-2">6. Çerezler</h2>
					<p>
						Sitemizde deneyiminizi iyileştirmek için çerezler kullanılmaktadır. Tarayıcınızdan çerez ayarlarını
						değiştirebilirsiniz.
					</p>
				</div>
			</section>
		</main>
	)
}


