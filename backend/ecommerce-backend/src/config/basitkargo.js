const basitkargoConfig = {
  api_key: process.env.BASITKARGO_API_KEY || 'test_key',
  username: process.env.BASITKARGO_USERNAME || 'test_user',
  password: process.env.BASITKARGO_PASSWORD || 'test_pass',
  test_mode: process.env.NODE_ENV !== 'production',
  webhook_url: `${process.env.API_URL}/api/shipping/webhook`,
  carriers: {
    yurtici: 'YK',
    aras: 'AR',
    mng: 'MNG',
    ups: 'UPS',
    ptt: 'PTT'
  },
  services: {
    standard: 'STD',
    express: 'EXP',
    sameday: 'SAME'
  }
};

module.exports = basitkargoConfig; 