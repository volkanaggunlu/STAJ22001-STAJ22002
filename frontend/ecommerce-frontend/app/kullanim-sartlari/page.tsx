
'use client'

import { APP_CONFIG } from '@/lib/utils/constants'

export default function TermsOfServicePage() {
	const siteName = APP_CONFIG.NAME
	return (
		<main className="container mx-auto px-4 py-10 max-w-3xl">
			<h1 className="text-3xl font-bold mb-2">Kullanım Şartları</h1>
			<p className="text-sm text-gray-500 mb-8">Son Güncelleme: [Tarih]</p>

			<section className="space-y-6 text-gray-800 leading-relaxed">
				<div>
					<h2 className="text-xl font-semibold mb-2">1. Amaç ve Kapsam</h2>
					<p>
						Bu Kullanım Şartları, {siteName} ("Site") üzerinden sunulan hizmetlerden yararlanan tüm
						ziyaretçi ve kullanıcılar için geçerlidir. Siteyi kullanarak, bu şartları okuduğunuzu ve
						kabul ettiğinizi beyan edersiniz.
					</p>
				</div>

				<div>
					<h2 className="text-xl font-semibold mb-2">2. Hizmet Tanımı</h2>
					<p>
						{siteName}, elektronik ve teknoloji ürünleri alanında hizmet vermektedir. Site içeriği ve
						hizmetleri önceden bildirim yapılmaksızın değiştirilebilir.
					</p>
				</div>

				<div>
					<h2 className="text-xl font-semibold mb-2">3. Kullanıcı Yükümlülükleri</h2>
					<ul className="list-disc pl-5 space-y-2">
						<li>Yasalara aykırı, hakaret içeren, telif hakkı ihlal eden içerik paylaşamazsınız.</li>
						<li>Hesap bilgilerinizin güvenliğinden siz sorumlusunuz.</li>
					</ul>
				</div>

				<div>
					<h2 className="text-xl font-semibold mb-2">4. Fikri Mülkiyet Hakları</h2>
					<p>
						Site üzerindeki tüm görseller, metinler, logolar ve yazılımlar {siteName}’a veya lisans
						sahiplerine aittir. İzinsiz kopyalanamaz veya çoğaltılamaz.
					</p>
				</div>

				<div>
					<h2 className="text-xl font-semibold mb-2">5. Sorumluluk Reddi</h2>
					<p>
						{siteName}, site içeriğinin doğruluğu, güncelliği veya kesintisiz erişiminden sorumlu değildir.
					</p>
				</div>

				<div>
					<h2 className="text-xl font-semibold mb-2">6. Değişiklikler</h2>
					<p>
						{siteName}, kullanım şartlarını dilediği zaman değiştirme hakkını saklı tutar.
					</p>
				</div>
			</section>
		</main>
	)
}
