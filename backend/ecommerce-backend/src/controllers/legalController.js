const logger = require('../logger/logger');

/**
 * Yasal linkleri getir
 * GET /api/legal/links
 */
const getLegalLinks = async (req, res, next) => {
  try {
    const legalLinks = {
      privacyPolicyUrl: process.env.PRIVACY_POLICY_URL || 'https://shop.acikatolye.com.tr/gizlilik-politikasi',
      distanceSalesUrl: process.env.DISTANCE_SALES_URL || 'https://shop.acikatolye.com.tr/mesafeli-satis-sozlesmesi',
      kvkkUrl: process.env.KVKK_URL || 'https://shop.acikatolye.com.tr/kvkk-aydinlatma-metni',
      termsOfServiceUrl: process.env.TERMS_OF_SERVICE_URL || 'https://shop.acikatolye.com.tr/kullanim-kosullari',
      cookiePolicyUrl: process.env.COOKIE_POLICY_URL || 'https://shop.acikatolye.com.tr/cerez-politikasi',
      returnPolicyUrl: process.env.RETURN_POLICY_URL || 'https://shop.acikatolye.com.tr/iade-politikasi'
    };

    res.json({
      success: true,
      message: 'Yasal linkler getirildi',
      data: legalLinks
    });

  } catch (error) {
    logger.error('Get legal links failed:', error);
    next(error);
  }
};

/**
 * KVKK/GDPR açık aydınlatma metnini getir
 * GET /api/legal/kvkk-text
 */
const getKvkkText = async (req, res, next) => {
  try {
    const kvkkText = {
      title: 'Kişisel Verilerin Korunması Aydınlatma Metni',
      lastUpdated: '2024-07-28',
      content: `
        <h2>1. Veri Sorumlusu</h2>
        <p>ElektroTech olarak kişisel verilerinizin güvenliği bizim için önemlidir. Bu aydınlatma metni, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında veri sorumlusu sıfatıyla ElektroTech'in kişisel verilerinizi hangi amaçla, hangi hukuki sebeple, kimlerle paylaşabileceği ve KVKK'nın 11. maddesi uyarınca sahip olduğunuz haklar hakkında sizi bilgilendirmek amacıyla hazırlanmıştır.</p>

        <h2>2. Kişisel Verilerin İşlenme Amaçları</h2>
        <p>Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:</p>
        <ul>
          <li>Ürün ve hizmetlerimizin sunulması</li>
          <li>Sipariş işlemlerinin gerçekleştirilmesi</li>
          <li>Müşteri hizmetleri desteği</li>
          <li>Yasal yükümlülüklerin yerine getirilmesi</li>
          <li>Güvenlik ve dolandırıcılık önleme</li>
          <li>İstatistiksel analizler</li>
          <li>Pazarlama faaliyetleri (açık rızanız dahilinde)</li>
        </ul>

        <h2>3. Kişisel Verilerin Aktarılması</h2>
        <p>Kişisel verileriniz, yukarıda belirtilen amaçların gerçekleştirilmesi doğrultusunda aşağıdaki taraflarla paylaşılabilir:</p>
        <ul>
          <li>Ödeme sağlayıcıları (PayTR, bankalar)</li>
          <li>Kargo şirketleri</li>
          <li>Yasal yükümlülükler gereği kamu kurumları</li>
          <li>Hizmet aldığımız tedarikçiler</li>
        </ul>

        <h2>4. Kişisel Veri Toplamanın Yöntemi ve Hukuki Sebebi</h2>
        <p>Kişisel verileriniz, web sitemiz, mobil uygulamamız, çağrı merkezimiz ve diğer iletişim kanalları aracılığıyla toplanmaktadır. Bu verilerin işlenmesi, KVKK'nın 5. maddesinde belirtilen hukuki sebeplere dayanmaktadır.</p>

        <h2>5. KVKK Kapsamındaki Haklarınız</h2>
        <p>KVKK'nın 11. maddesi uyarınca sahip olduğunuz haklar:</p>
        <ul>
          <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
          <li>Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme</li>
          <li>Kişisel verilerinizin işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme</li>
          <li>Yurt içinde veya yurt dışında kişisel verilerinizin aktarıldığı üçüncü kişileri bilme</li>
          <li>Kişisel verilerinizin eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme</li>
          <li>KVKK'nın 7. maddesinde öngörülen şartlar çerçevesinde kişisel verilerinizin silinmesini veya yok edilmesini isteme</li>
          <li>Kişisel verilerinizin aktarıldığı üçüncü kişilere yukarıda sayılan (e) ve (f) bentleri uyarınca yapılan işlemlerin bildirilmesini isteme</li>
          <li>İşlenen verilerinizin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle kişiliğinize aykırı bir sonucun ortaya çıkmasına itiraz etme</li>
          <li>Kişisel verilerinizin kanuna aykırı olarak işlenmesi sebebiyle zarara uğramanız hâlinde zararın giderilmesini isteme</li>
        </ul>

        <h2>6. İletişim</h2>
        <p>Yukarıda belirtilen haklarınızı kullanmak için aşağıdaki iletişim kanallarından bize ulaşabilirsiniz:</p>
        <ul>
          <li>E-posta: kvkk@elektrotech.com</li>
          <li>Adres: ElektroTech, İstanbul, Türkiye</li>
          <li>Telefon: +90 212 XXX XX XX</li>
        </ul>

        <h2>7. Değişiklikler</h2>
        <p>Bu aydınlatma metni, gerekli görüldüğü takdirde güncellenebilir. Güncellemeler web sitemizde yayınlanacaktır.</p>
      `,
      consentText: 'Kişisel verilerimin işlenmesine ve KVKK Aydınlatma Metni\'ni okuduğumu onaylıyorum.',
      requiredConsent: true
    };

    res.json({
      success: true,
      message: 'KVKK aydınlatma metni getirildi',
      data: kvkkText
    });

  } catch (error) {
    logger.error('Get KVKK text failed:', error);
    next(error);
  }
};

/**
 * Gizlilik politikası metnini getir
 * GET /api/legal/privacy-policy
 */
const getPrivacyPolicy = async (req, res, next) => {
  try {
    const privacyPolicy = {
      title: 'Gizlilik Politikası',
      lastUpdated: '2024-07-28',
      content: `
        <h2>1. Giriş</h2>
        <p>ElektroTech olarak kişisel verilerinizin güvenliği bizim için önemlidir. Bu gizlilik politikası, hangi bilgileri topladığımızı, nasıl kullandığımızı ve koruduğumuzu açıklar.</p>

        <h2>2. Topladığımız Bilgiler</h2>
        <ul>
          <li>Ad, soyad, e-posta adresi, telefon numarası</li>
          <li>Teslimat ve fatura adresleri</li>
          <li>Ödeme bilgileri (güvenli şekilde işlenir)</li>
          <li>Sipariş geçmişi ve tercihler</li>
          <li>Web sitesi kullanım verileri</li>
        </ul>

        <h2>3. Bilgilerin Kullanımı</h2>
        <p>Topladığımız bilgileri aşağıdaki amaçlarla kullanırız:</p>
        <ul>
          <li>Siparişlerinizi işlemek ve teslim etmek</li>
          <li>Müşteri hizmetleri sağlamak</li>
          <li>Ürün ve hizmetlerimizi geliştirmek</li>
          <li>Yasal yükümlülükleri yerine getirmek</li>
        </ul>

        <h2>4. Bilgi Güvenliği</h2>
        <p>Kişisel verilerinizi korumak için uygun teknik ve idari tedbirler alırız. Verileriniz şifrelenmiş bağlantılar üzerinden iletilir ve güvenli sunucularda saklanır.</p>

        <h2>5. Çerezler</h2>
        <p>Web sitemizde deneyiminizi geliştirmek için çerezler kullanırız. Çerez ayarlarınızı tarayıcınızdan yönetebilirsiniz.</p>

        <h2>6. Üçüncü Taraflar</h2>
        <p>Kişisel verilerinizi yalnızca hizmet sağlamak için gerekli olduğunda ve uygun güvenlik önlemleriyle üçüncü taraflarla paylaşırız.</p>

        <h2>7. Haklarınız</h2>
        <p>Kişisel verilerinizle ilgili aşağıdaki haklara sahipsiniz:</p>
        <ul>
          <li>Verilerinize erişim</li>
          <li>Düzeltme talep etme</li>
          <li>Silme talep etme</li>
          <li>İşlemeyi kısıtlama</li>
          <li>Veri taşınabilirliği</li>
          <li>İtiraz etme</li>
        </ul>

        <h2>8. İletişim</h2>
        <p>Gizlilik politikamızla ilgili sorularınız için: privacy@elektrotech.com</p>
      `
    };

    res.json({
      success: true,
      message: 'Gizlilik politikası getirildi',
      data: privacyPolicy
    });

  } catch (error) {
    logger.error('Get privacy policy failed:', error);
    next(error);
  }
};

/**
 * Mesafeli satış sözleşmesi metnini getir
 * GET /api/legal/distance-sales
 */
const getDistanceSalesContract = async (req, res, next) => {
  try {
    const distanceSalesContract = {
      title: 'Mesafeli Satış Sözleşmesi',
      lastUpdated: '2024-07-28',
      content: `
        <h2>1. Taraflar</h2>
        <p><strong>SATICI:</strong> ElektroTech<br>
        <strong>ALICI:</strong> Sipariş veren müşteri</p>

        <h2>2. Konu</h2>
        <p>Bu sözleşme, alıcının satıcıdan elektronik ortamda sipariş ettiği ürünlerin satışı ve teslimi ile ilgili olarak tarafların hak ve yükümlülüklerini düzenler.</p>

        <h2>3. Genel Hükümler</h2>
        <ul>
          <li>Bu sözleşme, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümlerine tabidir.</li>
          <li>Sözleşme, siparişin onaylanması ile yürürlüğe girer.</li>
          <li>Alıcı, sipariş verirken bu sözleşmeyi kabul etmiş sayılır.</li>
        </ul>

        <h2>4. Sipariş ve Ödeme</h2>
        <ul>
          <li>Siparişler web sitemiz veya mobil uygulamamız üzerinden verilir.</li>
          <li>Ödeme, kredi kartı, banka kartı veya havale/EFT ile yapılabilir.</li>
          <li>Fiyatlar KDV dahil olup, kargo ücreti ayrıca belirtilir.</li>
        </ul>

        <h2>5. Teslimat</h2>
        <ul>
          <li>Teslimat süresi, ürün stok durumuna göre 1-3 iş günü arasındadır.</li>
          <li>Kargo ücreti, 500 TL üzeri alışverişlerde ücretsizdir.</li>
          <li>Teslimat, alıcının belirttiği adrese yapılır.</li>
        </ul>

        <h2>6. Cayma Hakkı</h2>
        <ul>
          <li>Alıcı, ürünü teslim aldığı tarihten itibaren 14 gün içinde cayma hakkına sahiptir.</li>
          <li>Cayma hakkı, ürünün kullanılmamış ve orijinal ambalajında olması şartıyla geçerlidir.</li>
          <li>İade kargo ücreti alıcıya aittir.</li>
        </ul>

        <h2>7. Garanti ve Sorumluluk</h2>
        <ul>
          <li>Ürünler, üretici garantisi kapsamındadır.</li>
          <li>Satıcı, ürünlerin ayıplı olmamasından sorumludur.</li>
          <li>Ayıplı ürün durumunda değişim veya iade yapılır.</li>
        </ul>

        <h2>8. Uyuşmazlık Çözümü</h2>
        <p>Bu sözleşmeden doğacak uyuşmazlıklar için İstanbul Mahkemeleri ve İcra Müdürlükleri yetkilidir.</p>

        <h2>9. İletişim</h2>
        <p>Müşteri hizmetleri: info@elektrotech.com<br>
        Telefon: +90 212 XXX XX XX</p>
      `
    };

    res.json({
      success: true,
      message: 'Mesafeli satış sözleşmesi getirildi',
      data: distanceSalesContract
    });

  } catch (error) {
    logger.error('Get distance sales contract failed:', error);
    next(error);
  }
};

module.exports = {
  getLegalLinks,
  getKvkkText,
  getPrivacyPolicy,
  getDistanceSalesContract
}; 