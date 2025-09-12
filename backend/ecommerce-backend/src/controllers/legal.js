const getLegalLinks = (req, res) => {
  res.json({
    privacyPolicyUrl: 'https://shop.acikatolye.com.tr/gizlilik-politikasi',
    distanceSalesUrl: 'https://shop.acikatolye.com.tr/mesafeli-satis-sozlesmesi',
    kvkkUrl: 'https://shop.acikatolye.com.tr/kvkk-aydinlatma-metni'
  });
};

module.exports = { getLegalLinks }; 